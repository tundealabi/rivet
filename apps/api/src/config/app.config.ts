import { registerAs } from "@nestjs/config";

import { NodeEnv } from "@/common/enums";

type AppConfigOptions = {
  corsOrigins: string[];
  enableDevFeatures: boolean;
  globalPrefix: string;
  http: { port: number };
  nodeEnv: string;
  versioning: { prefix: string; version: string };
};

function parseEnableDevFeatures(): boolean {
  const raw = process.env.APP_ENABLE_DEV_FEATURES;
  if (raw === "true") return true;
  if (raw === "false") return false;
  // When unset: enable only when not production (local dev convenience)
  const nodeEnv = process.env.NODE_ENV || NodeEnv.DEVELOPMENT;
  return nodeEnv !== NodeEnv.PRODUCTION.toString();
}

export default registerAs("app", (): AppConfigOptions => ({
  corsOrigins: process.env.CORS_ORIGINS?.split(",") ?? [],
  enableDevFeatures: parseEnableDevFeatures(),
  globalPrefix: "/api",
  http: {
    port: Number.parseInt(process.env.PORT!, 10),
  },
  nodeEnv: process.env.NODE_ENV || NodeEnv.DEVELOPMENT,
  versioning: {
    prefix: "v",
    version: "1",
  },
}));
