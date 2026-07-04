import { Body, Controller, HttpStatus, Post } from "@nestjs/common";

import { ApiEnvelopeResponse } from "@/common/decorators";

import { AuthService } from "./auth.service";
import {
  EmailVerificationStatusResponseDto,
  LoginAuthRequestDto,
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
  login(@Body() dto: LoginAuthRequestDto): Promise<SignInAuthResponseDto> {
    return this.service.login(dto);
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

  @Post("verify-email/status")
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

  @Post("verify-email/send-otp")
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

  @Post("verify-email/resend-otp")
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

  @Post("verify-email")
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
