import { OrganizationRole } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";

import { DomainError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";
import { AuthService as AuthModuleService } from "@/modules/auth/auth.service";
import { OrgService } from "@/modules/org/org.service";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { UserService } from "@/modules/user/user.service";

import { LoginAuthInput, RegisterAuthInput } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly authService: AuthModuleService,
    private readonly databaseService: DatabaseService,
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
    const emailVerifyOtp = this.authService.generateOtp();
    return this.databaseService.client.$transaction(async (tx) => {
      const options = { tx };
      const user = await this.userService.create(
        {
          email: input.email,
          emailVerifyOtp,
          emailVerifyOtpExpiresAt: DATE_UTILS.addMinutes(
            DATE_UTILS.nowUtc(),
            AUTH_CONSTANTS.EMAIL_VERIFY_OTP_DURATION_MINS
          ).toJSDate(),
          firstName: input.firstName,
          lastName: input.lastName,
          hashedPassword,
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
          userId: user.id,
          orgId: org.id,
          role: OrganizationRole.OWNER,
        },
        options
      );
      return user;
    });
  }
}
