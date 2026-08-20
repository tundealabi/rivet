import "cookie-parser";

declare module "express-serve-static-core" {
  interface Request {
    logFields?: {
      orgId?: string;
      userId?: string;
    };
    rawBody?: Buffer;
    requestId: string;
  }
}
