import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { AUTH_CONSTANTS } from "./auth.constants";

@Injectable()
export class AuthUserJwtGuard extends AuthGuard(AUTH_CONSTANTS.JWT_STRATEGY) {}
