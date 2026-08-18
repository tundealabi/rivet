import { registerAs } from "@nestjs/config";

type StripeConfigOptions = {
  priceProId: string;
  secretKey: string;
  webhookSecret: string;
};

export default registerAs("stripe", (): StripeConfigOptions => ({
  priceProId: process.env.STRIPE_PRICE_PRO_ID!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
}));
