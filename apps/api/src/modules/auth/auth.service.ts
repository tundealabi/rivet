import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { DATE_UTILS } from "@rivet/shared/utils";

import { ENV_KEYS } from "@/common/constants";
import { HashService, TokenService } from "@/common/services";

import { AuthRepository } from "./auth.repository";
import {
  CreateRefreshTokenInput,
  CreateSessionInput,
  GenerateAccessTokenInput,
  UpdateSessionInput,
  VerifyAccessTokenInput,
} from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService
  ) {}

  // ------------------------------
  // Sessions
  // ------------------------------

  createSession(input: CreateSessionInput) {
    return this.authRepository.createSession({
      ipAddress: input.ipAddress || null,
      lastSeenAt: DATE_UTILS.nowUtc().toJSDate(),
      lastSeenIp: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      userId: input.userId,
    });
  }

  findSessionById(id: string) {
    return this.authRepository.findSession({ id });
  }

  async revokeSession(sessionId: string) {
    await this.authRepository.updateSession(
      { id: sessionId },
      {
        revokedAt: DATE_UTILS.nowUtc().toJSDate(),
      }
    );
  }

  updateActiveSession(id: string, input: UpdateSessionInput) {
    return this.authRepository.updateSession(
      { id, revokedAt: null },
      {
        lastSeenAt: DATE_UTILS.nowUtc().toJSDate(),
        lastSeenIp: input.ipAddress ?? null,
      }
    );
  }

  // ------------------------------
  // Tokens
  // ------------------------------

  async createRefreshToken(input: CreateRefreshTokenInput) {
    const rawToken = this.generateRefreshToken();
    await this.authRepository.createRefreshToken({
      expiresAt: DATE_UTILS.nowUtc()
        .plus({
          days: this.configService.getOrThrow<number>(
            ENV_KEYS.AUTH_USER_REFRESH_TOKEN_EXPIRES_IN_DAYS
          ),
        })
        .toJSDate(),
      sessionId: input.sessionId,
      tokenHash: this.hashService.digest(rawToken),
    });
    return rawToken;
  }

  async findRefreshToken(token: string) {
    const tokenHash = this.hashService.digest(token);
    return this.authRepository.findRefreshToken({ tokenHash });
  }

  generateAccessToken(input: GenerateAccessTokenInput) {
    return this.jwtService.signAsync(
      { sid: input.sessionId, sub: input.userId },
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

  verifyAccessToken(input: VerifyAccessTokenInput) {
    return this.jwtService.verifyAsync(input.token, {
      secret: this.configService.getOrThrow<string>(
        ENV_KEYS.AUTH_USER_ACCESS_TOKEN_SECRET
      ),
    });
  }

  generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

  generateRefreshToken() {
    return this.tokenService.generateOpaqueToken();
  }

  revokeRefreshToken(id: string) {
    return this.authRepository.updateRefreshToken(
      { id },
      { revokedAt: DATE_UTILS.nowUtc().toJSDate() }
    );
  }

  // ------------------------------
  // Password
  // ------------------------------

  hashPassword(password: string) {
    return this.hashService.hash(password);
  }

  verifyHashedPassword(password: string, hashedPassword: string) {
    return this.hashService.verify(password, hashedPassword);
  }
}
