import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

import { ENV_KEYS } from "@/common/constants";

@Injectable()
export class HashService {
  constructor(private readonly configService: ConfigService) {}

  async hash(value: string): Promise<string> {
    return argon2.hash(value);
  }

  async verify(value: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, value);
  }

  digest(value: string): string {
    const pepper = this.configService.getOrThrow<string>(
      ENV_KEYS.SECURITY_HMAC_PEPPER
    );
    return createHmac("sha256", pepper).update(value).digest("hex");
  }

  verifyDigest(value: string, digest: string): boolean {
    const expected = this.digest(value);
    const expectedBuffer = Buffer.from(expected, "hex");
    const digestBuffer = Buffer.from(digest, "hex");

    if (expectedBuffer.length !== digestBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, digestBuffer);
  }

  /** Unkeyed SHA-256 hex digest of exact UTF-8 bytes. */
  fingerprint(value: string): string {
    return createHash("sha256").update(value, "utf8").digest("hex");
  }

  verifyFingerprint(value: string, fingerprint: string): boolean {
    if (!/^[0-9a-f]{64}$/i.test(fingerprint)) {
      return false;
    }

    const expected = this.fingerprint(value);
    const expectedBuffer = Buffer.from(expected, "hex");
    const fingerprintBuffer = Buffer.from(fingerprint.toLowerCase(), "hex");

    if (expectedBuffer.length !== fingerprintBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, fingerprintBuffer);
  }
}
