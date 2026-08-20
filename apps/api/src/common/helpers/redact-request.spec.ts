import { redactSensitiveFields, redactSensitiveUrl } from "./redact-request";

describe("redactSensitiveFields", () => {
  it("redacts token, password, and idToken", () => {
    expect(
      redactSensitiveFields({
        password: "secret",
        token: "invite-token",
        idToken: "id-token",
        email: "ada@example.com",
      })
    ).toEqual({
      email: "ada@example.com",
      idToken: "[REDACTED]",
      password: "[REDACTED]",
      token: "[REDACTED]",
    });
  });

  it("does not mutate the original object", () => {
    const body = { token: "invite-token" };

    redactSensitiveFields(body);

    expect(body.token).toBe("invite-token");
  });
});

describe("redactSensitiveUrl", () => {
  it("redacts a token query param", () => {
    expect(redactSensitiveUrl("/api/invitations/preview?token=abc.def")).toBe(
      "/api/invitations/preview?token=[REDACTED]"
    );
  });

  it("leaves unrelated query params in place", () => {
    expect(
      redactSensitiveUrl("/api/invitations/preview?token=secret&limit=20")
    ).toBe("/api/invitations/preview?token=[REDACTED]&limit=20");
  });
});
