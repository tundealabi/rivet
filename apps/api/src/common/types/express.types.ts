import "cookie-parser";

declare module "express-serve-static-core" {
  interface Request {
    rawBody?: Buffer;
    requestId: string;
  }
}
