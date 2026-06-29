import { registerAs } from "@nestjs/config";

type ClientConfigOptions = {
  web: {
    baseUrl: string;
  };
};

export default registerAs("client", (): ClientConfigOptions => ({
  web: {
    baseUrl: (process.env.CLIENT_WEB_BASE_URL ?? "").trim().replace(/\/+$/, ""),
  },
}));
