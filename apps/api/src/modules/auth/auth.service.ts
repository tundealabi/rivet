import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

import { ENV_KEYS } from "@/common/constants";
import { HashService } from "@/common/services";

import {
  GenerateAccessTokenInput,
  GenerateRefreshTokenInput,
  VerifyAccessTokenInput,
} from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService
  ) {}

  generateAccessToken(input: GenerateAccessTokenInput): Promise<string> {
    return this.jwtService.signAsync(
      { sub: input.userId },
      {
        expiresIn: this.configService.getOrThrow<string>(
          ENV_KEYS.AUTH_USER_ACCESS_TOKEN_EXPIRES_IN
        ) as JwtSignOptions["expiresIn"],
        secret: this.configService.getOrThrow<string>(
          ENV_KEYS.AUTH_USER_ACCESS_TOKEN_SECRET
        ),
      }
    );
  }

  generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

  generateRefreshToken(input: GenerateRefreshTokenInput): Promise<string> {
    return this.jwtService.signAsync(
      { sub: input.userId },
      {
        expiresIn: this.configService.getOrThrow<string>(
          ENV_KEYS.AUTH_USER_REFRESH_TOKEN_EXPIRES_IN
        ) as JwtSignOptions["expiresIn"],
        secret: this.configService.getOrThrow<string>(
          ENV_KEYS.AUTH_USER_REFRESH_TOKEN_SECRET
        ),
      }
    );
  }

  async hashPassword(password: string): Promise<string> {
    return this.hashService.hash(password);
  }

  verifyAccessToken(input: VerifyAccessTokenInput) {
    return this.jwtService.verifyAsync(input.token, {
      secret: this.configService.getOrThrow<string>(
        ENV_KEYS.AUTH_USER_ACCESS_TOKEN_SECRET
      ),
    });
  }

  verifyHashedPassword(password: string, hashedPassword: string) {
    return this.hashService.verify(password, hashedPassword);
  }
}
