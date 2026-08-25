import { SetMetadata } from "@nestjs/common";

export const API_PUBLIC_KEY = "apiPublic";

/** Skip the global AuthUserJwtGuard (login, refresh, probes, webhooks, etc.). */
export const ApiPublic = () => SetMetadata(API_PUBLIC_KEY, true);
