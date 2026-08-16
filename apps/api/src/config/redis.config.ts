import { registerAs } from "@nestjs/config";

type RedisConfigOptions = {
  url: string;
};

export default registerAs("redis", (): RedisConfigOptions => ({
  url: process.env.REDIS_URL!,
}));
