import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { ENV_KEYS } from "@/common/constants";

import { AUTH_CONSTANTS } from "./auth.constants";
import { AuthJwtUser } from "./auth.entities";

@Injectable()
export class AuthUserJwtStrategy extends PassportStrategy(
  Strategy,
  AUTH_CONSTANTS.JWT_STRATEGY
) {
  constructor(configService: ConfigService) {
    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    const secretOrKey = configService.getOrThrow<string>(
      ENV_KEYS.AUTH_USER_ACCESS_TOKEN_SECRET
    );
    super({
      jwtFromRequest,
      secretOrKey,
    });
  }

  validate(payload: AuthJwtUser) {
    return payload;
  }
}
