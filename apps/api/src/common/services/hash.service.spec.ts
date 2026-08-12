import { createHash } from "node:crypto";

import { ConfigService } from "@nestjs/config";

import { HashService } from "./hash.service";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("HashService fingerprints", () => {
  let service: HashService;

  beforeEach(() => {
    service = new HashService({
      getOrThrow: jest.fn(),
    } as unknown as ConfigService);
  });

  it("fingerprints exact UTF-8 bytes as lowercase SHA-256 hex", () => {
    expect(service.fingerprint("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    expect(service.fingerprint("hello")).toBe(sha256Hex("hello"));
  });

  it("does not treat distinct strings as the same content", () => {
    expect(service.fingerprint("hello")).not.toBe(
      service.fingerprint("hello ")
    );
  });

  it("verifies a matching fingerprint", () => {
    const digest = service.fingerprint("issue body");
    expect(service.verifyFingerprint("issue body", digest)).toBe(true);
  });

  it("rejects a stale or malformed fingerprint", () => {
    const digest = service.fingerprint("current");
    expect(service.verifyFingerprint("other", digest)).toBe(false);
    expect(service.verifyFingerprint("current", "not-a-hash")).toBe(false);
    expect(service.verifyFingerprint("current", digest.slice(0, 63))).toBe(
      false
    );
  });
});
