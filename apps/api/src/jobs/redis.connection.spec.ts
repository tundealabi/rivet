import { redisConnectionFromUrl } from "./redis.connection";

describe("redisConnectionFromUrl", () => {
  it("parses a local redis URL", () => {
    expect(redisConnectionFromUrl("redis://localhost:6379")).toEqual({
      host: "localhost",
      port: 6379,
      username: undefined,
      password: undefined,
      tls: undefined,
      maxRetriesPerRequest: null,
    });
  });

  it("parses rediss credentials and enables TLS", () => {
    expect(
      redisConnectionFromUrl("rediss://default:s3cret@example.upstash.io:6379")
    ).toEqual({
      host: "example.upstash.io",
      port: 6379,
      username: "default",
      password: "s3cret",
      tls: {},
      maxRetriesPerRequest: null,
    });
  });
});
