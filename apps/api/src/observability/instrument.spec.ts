import "./instrument";

import { isOpenTelemetryStarted } from "./sdk";

describe("instrument bootstrap", () => {
  it("does not start the SDK when imported from Jest", () => {
    expect(isOpenTelemetryStarted()).toBe(false);
  });
});
