import { Body, Controller, HttpStatus, Post } from "@nestjs/common";

import { ApiEnvelopeResponse } from "@/common/decorators";

import { AuthService } from "./auth.service";
import {
  LoginAuthRequestDto,
  RegisterAuthRequestDto,
  SignInAuthResponseDto,
  SignUpAuthResponseDto,
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
}
