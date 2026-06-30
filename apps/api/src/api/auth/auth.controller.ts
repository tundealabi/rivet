import { Body, Controller, HttpStatus, Post } from "@nestjs/common";

import { ApiEnvelopeResponse } from "@/common/decorators";

import { AuthService } from "./auth.service";
import { RegisterAuthRequestDto, SignInAuthResponseDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post("register")
  @ApiEnvelopeResponse(SignInAuthResponseDto, {
    auth: "public",
    description: "Register a new user and create an organization",
    errorResponses: [
      {
        description: "User already exists with this email",
        status: HttpStatus.CONFLICT,
      },
    ],
    httpStatus: HttpStatus.CREATED,
    summary: "Register a new user",
  })
  register(@Body() dto: RegisterAuthRequestDto) {
    return this.service.register(dto);
  }
}
