import { registerAs } from "@nestjs/config";

type DBConfigOptions = {
  url: string;
};

export default registerAs("db", (): DBConfigOptions => ({
  url: process.env.DATABASE_URL!,
}));
