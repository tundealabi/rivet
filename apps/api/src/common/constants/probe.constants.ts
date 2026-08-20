import { RequestMethod } from "@nestjs/common";

/**
 * Routes served outside `/api` + URI versioning.
 * Keep in sync with `configureApp` prefix exclude.
 */
export const UNPREFIXED_PROBE_ROUTES = [
  { path: "health", method: RequestMethod.GET },
  { path: "metrics", method: RequestMethod.GET },
  { path: "ready", method: RequestMethod.GET },
] as const;

export function isUnprefixedProbePath(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  return UNPREFIXED_PROBE_ROUTES.some((route) => path === `/${route.path}`);
}
