import { EmailVerification, EmailVerificationContext } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";

import { DomainError } from "@/common/errors";
import { DbOptions } from "@/database/database.types";

import { EmailVerificationRepository } from "./email-verification.repository";
import {
  ApplyEmailVerificationResendInput,
  ApplyEmailVerificationSendInput,
  CreateEmailVerificationInput,
  EmailVerificationResendLimits,
  EmailVerificationResendState,
  EmailVerificationStatus,
  EmailVerificationVerifyLimits,
  EmailVerificationVerifyState,
  VerifyEmailVerificationInput,
} from "./email-verification.types";

interface ResolvedResendState {
  resendCount: number;
  resendLockedUntil: Date | null;
}

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly emailVerificationRepository: EmailVerificationRepository
  ) {}

  async applyResend(
    userId: string,
    context: EmailVerificationContext,
    state: EmailVerificationResendState,
    input: ApplyEmailVerificationResendInput,
    options?: DbOptions
  ): Promise<EmailVerification> {
    const resolved = this.resolveResendState(state);
    this.assertResendAllowed(state, input.limits, resolved);

    const nextResendCount = resolved.resendCount + 1;
    const resendLockedUntil =
      nextResendCount >= input.limits.maxResends
        ? DATE_UTILS.addHours(
            DATE_UTILS.fromJSDate(input.lastSentAt),
            input.limits.lockoutHours
          ).toJSDate()
        : null;

    return this.emailVerificationRepository.update(
      {
        where: {
          userId_context: {
            context,
            userId,
          },
        },
        data: {
          attempts: 0,
          codeHash: input.codeHash,
          expiresAt: input.expiresAt,
          lastSentAt: input.lastSentAt,
          resendCount: nextResendCount,
          resendLockedUntil,
        },
      },
      options
    );
  }

  async applySendOtp(
    userId: string,
    context: EmailVerificationContext,
    resendState: EmailVerificationResendState,
    verifyState: Pick<EmailVerificationVerifyState, "expiresAt">,
    input: ApplyEmailVerificationSendInput,
    options?: DbOptions
  ): Promise<boolean> {
    if (!DATE_UTILS.isPast(DATE_UTILS.fromJSDate(verifyState.expiresAt))) {
      return false;
    }

    const resolved = this.resolveResendState(resendState);
    this.assertResendLockNotActive(resolved);

    await this.emailVerificationRepository.update(
      {
        where: {
          userId_context: {
            context,
            userId,
          },
        },
        data: {
          attempts: 0,
          codeHash: input.codeHash,
          expiresAt: input.expiresAt,
          lastSentAt: input.lastSentAt,
        },
      },
      options
    );

    return true;
  }

  async applyVerify(
    userId: string,
    context: EmailVerificationContext,
    verifyState: EmailVerificationVerifyState,
    input: VerifyEmailVerificationInput,
    options?: DbOptions
  ): Promise<void> {
    if (DATE_UTILS.isPast(DATE_UTILS.fromJSDate(verifyState.expiresAt))) {
      throw this.invalidCodeError();
    }

    if (verifyState.attempts >= input.limits.maxAttempts) {
      throw this.invalidCodeError();
    }

    if (!input.matchesStoredCode(verifyState.storedCodeSecret)) {
      await this.emailVerificationRepository.update(
        {
          where: {
            userId_context: {
              context,
              userId,
            },
          },
          data: { attempts: { increment: 1 } },
        },
        options
      );
      throw this.invalidCodeError();
    }

    await this.emailVerificationRepository.delete(
      {
        where: {
          userId_context: {
            context,
            userId,
          },
        },
      },
      options
    );
  }

  buildStatus(
    resendState: EmailVerificationResendState,
    verifyState: Pick<EmailVerificationVerifyState, "attempts" | "expiresAt">,
    resendLimits: EmailVerificationResendLimits,
    verifyLimits: EmailVerificationVerifyLimits
  ): EmailVerificationStatus {
    const now = DATE_UTILS.nowUtc();
    const resolved = this.resolveResendState(resendState);
    const expiresAt = DATE_UTILS.fromJSDate(verifyState.expiresAt);
    const codeExpired = DATE_UTILS.isPast(expiresAt);
    const verifyLocked = verifyState.attempts >= verifyLimits.maxAttempts;

    const resendLockoutSeconds = resolved.resendLockedUntil
      ? this.secondsUntilMillis(
          now.toMillis(),
          DATE_UTILS.fromJSDate(resolved.resendLockedUntil).toMillis()
        )
      : null;
    const isResendLocked =
      resendLockoutSeconds !== null && resendLockoutSeconds > 0;

    const cooldownSecs = this.getResendCooldownSecs(
      resolved.resendCount,
      resendLimits
    );
    const lastSentAt = DATE_UTILS.fromJSDate(resendState.lastSentAt);
    const elapsedSecs = (now.toMillis() - lastSentAt.toMillis()) / 1000;
    const cooldownRemainingSecs =
      elapsedSecs < cooldownSecs ? Math.ceil(cooldownSecs - elapsedSecs) : null;

    const resendAvailableAt =
      cooldownRemainingSecs !== null
        ? DATE_UTILS.toISO(DATE_UTILS.addSeconds(lastSentAt, cooldownSecs))
        : null;

    const codeExpiresInSeconds = codeExpired
      ? null
      : this.secondsUntilMillis(now.toMillis(), expiresAt.toMillis());

    return {
      active: true,
      canResend: !isResendLocked && cooldownRemainingSecs === null,
      canSendOtp: codeExpired && !isResendLocked,
      canVerify: !codeExpired && !verifyLocked,
      codeExpiresAt: DATE_UTILS.toISO(expiresAt) ?? null,
      codeExpiresInSeconds,
      resendAvailableAt,
      resendCooldownSeconds: cooldownRemainingSecs,
      resendLockedUntil: resolved.resendLockedUntil
        ? DATE_UTILS.toISO(DATE_UTILS.fromJSDate(resolved.resendLockedUntil))
        : null,
      resendLockoutSeconds: isResendLocked ? resendLockoutSeconds : null,
      verifyLocked,
    };
  }

  async create(
    input: CreateEmailVerificationInput,
    options?: DbOptions
  ): Promise<EmailVerification> {
    return this.emailVerificationRepository.create(
      {
        data: {
          codeHash: input.codeHash,
          context: input.context,
          expiresAt: input.expiresAt,
          lastSentAt: input.lastSentAt,
          userId: input.userId,
        },
      },
      options
    );
  }

  async findByUserIdAndContext(
    userId: string,
    context: EmailVerificationContext,
    options?: DbOptions
  ): Promise<EmailVerification | null> {
    return await this.emailVerificationRepository.findUnique(
      {
        where: {
          userId_context: {
            context,
            userId,
          },
        },
      },
      options
    );
  }

  private assertResendAllowed(
    state: EmailVerificationResendState,
    limits: EmailVerificationResendLimits,
    resolved: ResolvedResendState
  ): void {
    this.assertResendLockNotActive(resolved);

    const now = DATE_UTILS.nowUtc();
    const cooldownSecs = this.getResendCooldownSecs(
      resolved.resendCount,
      limits
    );
    const lastSentAt = DATE_UTILS.fromJSDate(state.lastSentAt);
    const elapsedSecs = (now.toMillis() - lastSentAt.toMillis()) / 1000;

    if (elapsedSecs < cooldownSecs) {
      const remainingSeconds = Math.ceil(cooldownSecs - elapsedSecs);
      throw new DomainError(
        "TOO_MANY_REQUESTS",
        ErrorCode.EMAIL_VERIFICATION_RESEND_COOLDOWN,
        `Please wait ${remainingSeconds} seconds before requesting a new code.`
      );
    }
  }

  private assertResendLockNotActive(resolved: ResolvedResendState): void {
    if (!resolved.resendLockedUntil) {
      return;
    }

    const now = DATE_UTILS.nowUtc();
    const lockedUntil = DATE_UTILS.fromJSDate(resolved.resendLockedUntil);

    if (now.toMillis() >= lockedUntil.toMillis()) {
      return;
    }

    const remainingSeconds = this.secondsUntilMillis(
      now.toMillis(),
      lockedUntil.toMillis()
    );
    throw new DomainError(
      "TOO_MANY_REQUESTS",
      ErrorCode.TOO_MANY_REQUESTS,
      `Please wait ${remainingSeconds} seconds before requesting a new code.`
    );
  }

  private getResendCooldownSecs(
    resendCount: number,
    limits: EmailVerificationResendLimits
  ): number {
    return (
      limits.baseCooldownSecs * Math.pow(limits.cooldownMultiplier, resendCount)
    );
  }

  private invalidCodeError(): DomainError {
    return new DomainError(
      "RULE_VIOLATION",
      ErrorCode.EMAIL_VERIFICATION_CODE_INVALID,
      ErrorMessage.EMAIL_VERIFICATION_CODE_INVALID
    );
  }

  private resolveResendState(
    state: EmailVerificationResendState
  ): ResolvedResendState {
    const now = DATE_UTILS.nowUtc();

    if (!state.resendLockedUntil) {
      return {
        resendCount: state.resendCount,
        resendLockedUntil: null,
      };
    }

    const lockedUntil = DATE_UTILS.fromJSDate(state.resendLockedUntil);
    if (now.toMillis() >= lockedUntil.toMillis()) {
      return {
        resendCount: 0,
        resendLockedUntil: null,
      };
    }

    return {
      resendCount: state.resendCount,
      resendLockedUntil: state.resendLockedUntil,
    };
  }

  private secondsUntilMillis(fromMillis: number, toMillis: number): number {
    return Math.max(0, Math.ceil((toMillis - fromMillis) / 1000));
  }
}
