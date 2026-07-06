import {
  EmailVerification,
  EmailVerificationContext,
  OrganizationRole,
  User,
} from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";

import { ENV_KEYS } from "@/common/constants";
import { NodeEnv } from "@/common/enums";
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
  LogoutAuthInput,
  RefreshTokensAuthInput,
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
    private readonly configService: ConfigService,
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
    // if (!user.emailVerifiedAt) {
    //   throw new DomainError(
    //     "RULE_VIOLATION",
    //     ErrorCode.EMAIL_NOT_VERIFIED,
    //     ErrorMessage.EMAIL_NOT_VERIFIED
    //   );
    // }

    const session = await this.authService.createSession({
      userId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    const accessToken = await this.authService.generateAccessToken({
      sessionId: session.id,
      userId: user.id,
    });

    const refreshToken = await this.authService.createRefreshToken({
      sessionId: session.id,
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
  // Logout
  // ------------------------------

  async logout(input: LogoutAuthInput) {
    const refreshToken = await this.authService.findRefreshToken(
      input.refreshToken
    );
    if (refreshToken) {
      await this.authService.revokeSession(refreshToken.sessionId);
    }
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
  // Refresh tokens
  // ------------------------------

  async refreshTokens(input: RefreshTokensAuthInput) {
    const refreshTokenRecord = await this.authService.findRefreshToken(
      input.refreshToken
    );

    if (!refreshTokenRecord) {
      throw new DomainError(
        "INVALID_CREDENTIALS",
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessage.INVALID_CREDENTIALS
      );
    }
    if (refreshTokenRecord.revokedAt) {
      await this.authService.revokeSession(refreshTokenRecord.sessionId);
      throw new DomainError(
        "INVALID_CREDENTIALS",
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessage.INVALID_CREDENTIALS
      );
    }
    if (
      DATE_UTILS.isPast(DATE_UTILS.fromJSDate(refreshTokenRecord.expiresAt))
    ) {
      throw new DomainError(
        "INVALID_CREDENTIALS",
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessage.INVALID_CREDENTIALS
      );
    }

    const sessionRecord = await this.authService.updateActiveSession(
      refreshTokenRecord.sessionId,
      { ipAddress: input.ipAddress }
    );

    if (!sessionRecord) {
      throw new DomainError(
        "INVALID_CREDENTIALS",
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessage.INVALID_CREDENTIALS
      );
    }

    const accessToken = await this.authService.generateAccessToken({
      sessionId: sessionRecord.id,
      userId: sessionRecord.userId,
    });

    const refreshToken = await this.authService.createRefreshToken({
      sessionId: sessionRecord.id,
    });

    await this.authService.revokeRefreshToken(refreshTokenRecord.id);

    return {
      authTokens: {
        accessToken,
        refreshToken,
      },
    };
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
  // Get cookie options
  // ------------------------------

  getCookieOptions() {
    return {
      httpOnly: true,
      maxAge: DATE_UTILS.addDays(
        DATE_UTILS.nowUtc(),
        this.configService.getOrThrow<number>(
          ENV_KEYS.AUTH_USER_REFRESH_TOKEN_EXPIRES_IN_DAYS
        )
      ).toMillis(),
      path: "/api/v1/auth",
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === NodeEnv.PRODUCTION,
    };
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
