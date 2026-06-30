import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

import { ENV_KEYS } from "@/common/constants";

import {
  GenerateAccessTokenInput,
  GenerateRefreshTokenInput,
  VerifyAccessTokenInput,
} from "../types";

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
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

  verifyAccessToken(input: VerifyAccessTokenInput) {
    return this.jwtService.verifyAsync(input.token, {
      secret: this.configService.getOrThrow<string>(
        ENV_KEYS.AUTH_USER_ACCESS_TOKEN_SECRET
      ),
    });
  }
}
