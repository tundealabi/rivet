import { Body, Controller, HttpStatus, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { getClientIp } from "request-ip";

import { ApiEnvelopeResponse, Cookies } from "@/common/decorators";

import { AUTH_REFRESH_TOKEN_COOKIE_NAME } from "./auth.constants";
import { AuthService } from "./auth.service";
import {
  EmailVerificationStatusResponseDto,
  LoginAuthRequestDto,
  RefreshAuthResponseDto,
  RegisterAuthRequestDto,
  ResendEmailVerificationResponseDto,
  SendEmailVerificationResponseDto,
  SignInAuthResponseDto,
  SignUpAuthResponseDto,
  VerifyEmailByEmailRequestDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // ------------------------------
  // Login
  // ------------------------------

  @Post("login")
  @ApiEnvelopeResponse(SignInAuthResponseDto, {
    auth: "public",
    description: "Login a user",
    errorResponses: [
      {
        description: "Invalid credentials",
        status: HttpStatus.UNAUTHORIZED,
      },
      {
        description: "Email not verified",
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Login a user",
  })
  async login(
    @Body() dto: LoginAuthRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<SignInAuthResponseDto> {
    const result = await this.service.login({
      ...dto,
      ipAddress: getClientIp(req) || "",
      userAgent: req.get("user-agent") || "",
    });
    res.cookie(
      AUTH_REFRESH_TOKEN_COOKIE_NAME,
      result.authTokens.refreshToken,
      this.service.getCookieOptions()
    );
    return result;
  }

  // ------------------------------
  // Logout
  // ------------------------------

  @Post("logout")
  @ApiEnvelopeResponse(null, {
    auth: "public",
    description: "Logout a user",
    httpStatus: HttpStatus.OK,
    summary: "Logout a user",
  })
  logout(
    @Cookies(AUTH_REFRESH_TOKEN_COOKIE_NAME) refreshToken: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const cookieOptions = this.service.getCookieOptions();
    res.clearCookie(AUTH_REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: cookieOptions.httpOnly,
      path: cookieOptions.path,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
    });
    return this.service.logout({
      refreshToken,
    });
  }

  // ------------------------------
  // Refresh tokens
  // ------------------------------

  @Post("refresh")
  @ApiEnvelopeResponse(RefreshAuthResponseDto, {
    auth: "public",
    description: "Refresh authentication tokens",
    errorResponses: [
      {
        description: "Invalid refresh token",
        status: HttpStatus.UNAUTHORIZED,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Refresh authentication tokens",
  })
  async refreshTokens(
    @Cookies(AUTH_REFRESH_TOKEN_COOKIE_NAME) refreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<RefreshAuthResponseDto> {
    const result = await this.service.refreshTokens({
      ipAddress: getClientIp(req) || "",
      refreshToken,
    });
    res.cookie(
      AUTH_REFRESH_TOKEN_COOKIE_NAME,
      result.authTokens.refreshToken,
      this.service.getCookieOptions()
    );
    return result;
  }

  // ------------------------------
  // Register
  // ------------------------------

  @Post("register")
  @ApiEnvelopeResponse(SignUpAuthResponseDto, {
    auth: "public",
    description: "Register a new user and create an organization",
    errorResponses: [
      {
        description: "User already exists with this email",
        status: HttpStatus.CONFLICT,
      },
    ],
    httpStatus: HttpStatus.CREATED,
    summary: "Register a new user and create an organization",
  })
  register(
    @Body() dto: RegisterAuthRequestDto
  ): Promise<SignUpAuthResponseDto> {
    return this.service.register(dto);
  }

  // ------------------------------
  // Verify email
  // ------------------------------

  // @Post("verify-email/status")
  @ApiEnvelopeResponse(EmailVerificationStatusResponseDto, {
    auth: "public",
    description: "Get email verification status for the verify UI",
    httpStatus: HttpStatus.OK,
    summary: "Get email verification status",
  })
  getEmailVerificationStatus(
    @Body() dto: VerifyEmailByEmailRequestDto
  ): Promise<EmailVerificationStatusResponseDto> {
    return this.service.getEmailVerificationStatus(dto);
  }

  // @Post("verify-email/send-otp")
  @ApiEnvelopeResponse(SendEmailVerificationResponseDto, {
    auth: "public",
    description:
      "Send a verification code when missing or expired without resend backoff",
    errorResponses: [
      {
        description: "Resend locked or rate limited",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Send email verification OTP",
  })
  sendEmailVerificationOtp(
    @Body() dto: VerifyEmailByEmailRequestDto
  ): Promise<SendEmailVerificationResponseDto> {
    return this.service.sendEmailVerificationOtp(dto);
  }

  // @Post("verify-email/resend-otp")
  @ApiEnvelopeResponse(ResendEmailVerificationResponseDto, {
    auth: "public",
    description: "Resend email verification OTP",
    errorResponses: [
      {
        description: "Resend cooldown or lockout active",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Resend email verification OTP",
  })
  resendEmailVerificationOtp(
    @Body() dto: VerifyEmailByEmailRequestDto
  ): Promise<ResendEmailVerificationResponseDto> {
    return this.service.resendEmailVerification(dto);
  }

  // @Post("verify-email")
  @ApiEnvelopeResponse(VerifyEmailResponseDto, {
    auth: "public",
    description: "Verify email with OTP code",
    errorResponses: [
      {
        description: "Invalid or expired code",
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Verify email",
  })
  verifyEmail(
    @Body() dto: VerifyEmailRequestDto
  ): Promise<VerifyEmailResponseDto> {
    return this.service.verifyEmail(dto);
  }
}
