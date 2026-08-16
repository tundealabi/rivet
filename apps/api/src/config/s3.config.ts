import { registerAs } from "@nestjs/config";

type S3ConfigOptions = {
  accessKey: string;
  bucket: string;
  corsOrigins: string[];
  endpoint: string;
  forcePathStyle: boolean;
  region: string;
  secretKey: string;
};

function parseFlag(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === "") return defaultValue;
  return raw === "true";
}

function parseOrigins(...rawValues: Array<string | undefined>): string[] {
  const origins = new Set<string>();

  for (const raw of rawValues) {
    if (!raw) continue;
    for (const part of raw.split(",")) {
      const origin = part
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\/+$/, "");
      if (origin) origins.add(origin);
    }
  }

  return [...origins];
}

export default registerAs("s3", (): S3ConfigOptions => ({
  accessKey: process.env.S3_ACCESS_KEY!,
  bucket: process.env.S3_BUCKET!,
  corsOrigins: parseOrigins(
    process.env.CLIENT_WEB_BASE_URL,
    process.env.APP_CORS_ORIGINS
  ),
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: parseFlag(process.env.S3_FORCE_PATH_STYLE, true),
  region: process.env.S3_REGION!,
  secretKey: process.env.S3_SECRET_KEY!,
}));
