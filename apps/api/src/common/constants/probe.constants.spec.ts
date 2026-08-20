import { isUnprefixedProbePath } from "./probe.constants";

describe("isUnprefixedProbePath", () => {
  it("matches live, ready, and metrics probes", () => {
    expect(isUnprefixedProbePath("/health")).toBe(true);
    expect(isUnprefixedProbePath("/ready")).toBe(true);
    expect(isUnprefixedProbePath("/metrics")).toBe(true);
    expect(isUnprefixedProbePath("/ready?foo=1")).toBe(true);
    expect(isUnprefixedProbePath("/health/")).toBe(true);
  });

  it("does not match versioned API routes", () => {
    expect(isUnprefixedProbePath("/api/v1")).toBe(false);
    expect(isUnprefixedProbePath("/api/v1/health")).toBe(false);
    expect(isUnprefixedProbePath("/")).toBe(false);
  });
});
