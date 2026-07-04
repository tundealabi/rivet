import { registerAs } from "@nestjs/config";

type SecurityConfigOptions = {
  hmacPepper: string;
};

export default registerAs("security", (): SecurityConfigOptions => ({
  hmacPepper: process.env.SECURITY_HMAC_PEPPER!,
}));
