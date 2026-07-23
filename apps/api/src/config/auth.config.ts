import { registerAs } from "@nestjs/config";

type AuthConfigOptions = {
  user: {
    accessToken: {
      expiresIn: string;
      secret: string;
    };
    refreshToken: {
      expiresInDays: number;
    };
  };
};

export default registerAs("auth", (): AuthConfigOptions => ({
  user: {
    accessToken: {
      expiresIn: process.env.AUTH_USER_ACCESS_TOKEN_EXPIRES_IN!,
      secret: process.env.AUTH_USER_ACCESS_TOKEN_SECRET!,
    },
    refreshToken: {
      expiresInDays: parseInt(
        process.env.AUTH_USER_REFRESH_TOKEN_EXPIRES_IN_DAYS!,
        10
      ),
    },
  },
}));
