import {
  EmailVerification,
  EmailVerificationContext,
  OrganizationRole,
  User,
} from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";

import { DomainError } from "@/common/errors";
import { HashService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";
import { AuthService as AuthModuleService } from "@/modules/auth/auth.service";
import { EmailVerificationService } from "@/modules/email-verification/email-verification.service";
import {
  EmailVerificationStatus,
  INACTIVE_EMAIL_VERIFICATION_STATUS,
} from "@/modules/email-verification/email-verification.types";
import { OrgService } from "@/modules/org/org.service";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { UserService } from "@/modules/user/user.service";

import {
  EmailVerificationByEmailInput,
  LoginAuthInput,
  RegisterAuthInput,
  ResendEmailVerificationInput,
  VerifyEmailInput,
} from "./auth.types";

interface PendingSignUpVerification {
  record: EmailVerification;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authService: AuthModuleService,
    private readonly databaseService: DatabaseService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly hashService: HashService,
    private readonly orgService: OrgService,
    private readonly orgMemberService: OrgMemberService,
    private readonly userService: UserService
  ) {}

  // ------------------------------
  // Login
  // ------------------------------

  async login(input: LoginAuthInput) {
    const user = await this.userService.findByEmail(input.email);
    if (!user) {
      throw new DomainError(
        "INVALID_CREDENTIALS",
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessage.INVALID_CREDENTIALS
      );
    }
    const isPasswordValid = await this.authService.verifyHashedPassword(
      input.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new DomainError(
        "INVALID_CREDENTIALS",
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessage.INVALID_CREDENTIALS
      );
    }
    if (!user.emailVerifiedAt) {
      throw new DomainError(
        "RULE_VIOLATION",
        ErrorCode.EMAIL_NOT_VERIFIED,
        ErrorMessage.EMAIL_NOT_VERIFIED
      );
    }

    const accessToken = await this.authService.generateAccessToken({
      userId: user.id,
    });
    const refreshToken = await this.authService.generateRefreshToken({
      userId: user.id,
    });
    return {
      authTokens: {
        accessToken,
        refreshToken,
      },
      user,
    };
  }

  // ------------------------------
  // Register
  // ------------------------------

  async register(input: RegisterAuthInput) {
    const hashedPassword = await this.authService.hashPassword(input.password);
    const code = this.authService.generateOtp();
    const verification = this.buildEmailVerificationPayload(code);

    const user = await this.databaseService.client.$transaction(async (tx) => {
      const options = { tx };
      const createdUser = await this.userService.create(
        {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          hashedPassword,
        },
        options
      );
      await this.emailVerificationService.create(
        {
          ...verification,
          context: EmailVerificationContext.SIGN_UP,
          userId: createdUser.id,
        },
        options
      );
      const org = await this.orgService.create(
        {
          name: input.orgName,
        },
        options
      );
      await this.orgMemberService.create(
        {
          userId: createdUser.id,
          orgId: org.id,
          role: OrganizationRole.OWNER,
        },
        options
      );

      return createdUser;
    });

    // TODO: Send email verification code

    return user;
  }

  // ------------------------------
  // Verify email — status
  // ------------------------------

  async getEmailVerificationStatus(
    input: EmailVerificationByEmailInput
  ): Promise<EmailVerificationStatus> {
    return this.buildEmailVerificationStatus(input.email);
  }

  // ------------------------------
  // Verify email — send OTP
  // ------------------------------

  async sendEmailVerificationOtp(
    input: EmailVerificationByEmailInput
  ): Promise<{ sent: boolean }> {
    const user = await this.userService.findByEmail(input.email);

    if (!user || user.emailVerifiedAt) {
      return { sent: false };
    }

    const code = this.authService.generateOtp();
    const verification = this.buildEmailVerificationPayload(code);

    const record = await this.emailVerificationService.findByUserIdAndContext(
      user.id,
      EmailVerificationContext.SIGN_UP
    );

    if (!record) {
      await this.emailVerificationService.create({
        ...verification,
        context: EmailVerificationContext.SIGN_UP,
        userId: user.id,
      });

      // TODO: Send email verification code

      return { sent: true };
    }

    const sent = await this.emailVerificationService.applySendOtp(
      user.id,
      EmailVerificationContext.SIGN_UP,
      {
        lastSentAt: record.lastSentAt,
        resendCount: record.resendCount,
        resendLockedUntil: record.resendLockedUntil,
      },
      { expiresAt: record.expiresAt },
      verification
    );

    if (sent) {
      // TODO: Send email verification code
    }

    return { sent };
  }

  // ------------------------------
  // Verify email — resend OTP
  // ------------------------------

  async resendEmailVerification(
    input: ResendEmailVerificationInput
  ): Promise<{ sent: boolean }> {
    const pending = await this.findPendingSignUpVerification(input.email);

    if (!pending) {
      return { sent: false };
    }

    const code = this.authService.generateOtp();
    const verification = this.buildEmailVerificationPayload(code);

    await this.emailVerificationService.applyResend(
      pending.user.id,
      EmailVerificationContext.SIGN_UP,
      {
        lastSentAt: pending.record.lastSentAt,
        resendCount: pending.record.resendCount,
        resendLockedUntil: pending.record.resendLockedUntil,
      },
      {
        ...verification,
        limits: AUTH_CONSTANTS.EMAIL_VERIFICATION_RESEND_LIMITS,
      }
    );

    // TODO: Send email verification code

    return { sent: true };
  }

  // ------------------------------
  // Verify email — submit code
  // ------------------------------

  async verifyEmail(input: VerifyEmailInput): Promise<{ verified: boolean }> {
    const user = await this.userService.findByEmail(input.email);

    if (!user || user.emailVerifiedAt) {
      throw new DomainError(
        "RULE_VIOLATION",
        ErrorCode.EMAIL_VERIFICATION_CODE_INVALID,
        ErrorMessage.EMAIL_VERIFICATION_CODE_INVALID
      );
    }

    const record = await this.emailVerificationService.findByUserIdAndContext(
      user.id,
      EmailVerificationContext.SIGN_UP
    );

    if (!record) {
      throw new DomainError(
        "RULE_VIOLATION",
        ErrorCode.EMAIL_VERIFICATION_CODE_INVALID,
        ErrorMessage.EMAIL_VERIFICATION_CODE_INVALID
      );
    }

    await this.emailVerificationService.applyVerify(
      user.id,
      EmailVerificationContext.SIGN_UP,
      {
        attempts: record.attempts,
        expiresAt: record.expiresAt,
        storedCodeSecret: record.codeHash,
      },
      {
        limits: AUTH_CONSTANTS.EMAIL_VERIFICATION_VERIFY_LIMITS,
        matchesStoredCode: (storedCode) =>
          this.hashService.verifyDigest(input.code, storedCode),
      }
    );

    await this.userService.updateEmailVerification(user.id, {
      emailVerifiedAt: DATE_UTILS.nowUtc().toJSDate(),
    });

    return { verified: true };
  }

  // ------------------------------
  // Private Methods
  // ------------------------------

  private async buildEmailVerificationStatus(
    email: string
  ): Promise<EmailVerificationStatus> {
    const pending = await this.findPendingSignUpVerification(email);

    if (!pending) {
      return INACTIVE_EMAIL_VERIFICATION_STATUS;
    }

    return this.emailVerificationService.buildStatus(
      {
        lastSentAt: pending.record.lastSentAt,
        resendCount: pending.record.resendCount,
        resendLockedUntil: pending.record.resendLockedUntil,
      },
      {
        attempts: pending.record.attempts,
        expiresAt: pending.record.expiresAt,
      },
      AUTH_CONSTANTS.EMAIL_VERIFICATION_RESEND_LIMITS,
      AUTH_CONSTANTS.EMAIL_VERIFICATION_VERIFY_LIMITS
    );
  }

  private async findPendingSignUpVerification(
    email: string
  ): Promise<PendingSignUpVerification | null> {
    const user = await this.userService.findByEmail(email);

    if (!user || user.emailVerifiedAt) {
      return null;
    }

    const record = await this.emailVerificationService.findByUserIdAndContext(
      user.id,
      EmailVerificationContext.SIGN_UP
    );

    if (!record) {
      return null;
    }

    return { record, user };
  }

  private buildEmailVerificationPayload(code: string) {
    const now = DATE_UTILS.nowUtc();
    const lastSentAt = now.toJSDate();

    return {
      codeHash: this.hashService.digest(code),
      expiresAt: DATE_UTILS.addMinutes(
        now,
        AUTH_CONSTANTS.EMAIL_VERIFICATION_CODE_DURATION_MINS
      ).toJSDate(),
      lastSentAt,
    };
  }
}
