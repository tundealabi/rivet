import type { RedisOptions } from "bullmq";

export function redisConnectionFromUrl(urlString: string): RedisOptions {
  const url = new URL(urlString);
  const useTls = url.protocol === "rediss:";

  return {
    host: decodeURIComponent(url.hostname),
    port: url.port ? Number.parseInt(url.port, 10) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    tls: useTls ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}
