// token.service.ts
import { Injectable } from "@nestjs/common";
import { randomBytes, randomInt } from "crypto";

@Injectable()
export class TokenService {
  /**
   * High-entropy opaque token for things like refresh tokens, session ids.
   * Default 32 bytes = 256 bits.
   */
  generateOpaqueToken(bytes = 32): string {
    return randomBytes(bytes).toString("base64url");
  }

  /**
   * Numeric code for things like email/SMS verification (e.g. 6-digit).
   */
  generateNumericCode(digits = 6): string {
    const min = 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return randomInt(min, max + 1).toString();
  }
}
