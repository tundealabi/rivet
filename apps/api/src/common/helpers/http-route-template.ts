import { HTTP_ROUTE_UNMATCHED } from "@/common/constants";

export function httpRouteTemplate(request: {
  baseUrl?: string;
  route?: { path?: unknown };
}): string {
  const routePath = request.route?.path;

  if (typeof routePath !== "string" || routePath.length === 0) {
    return HTTP_ROUTE_UNMATCHED;
  }

  const baseUrl = request.baseUrl ?? "";
  const suffix = routePath === "/" ? "" : routePath;
  const combined = `${baseUrl}${suffix}`.replace(/\/{2,}/g, "/");

  if (combined.length === 0) {
    return "/";
  }

  return combined.endsWith("/") && combined.length > 1
    ? combined.slice(0, -1)
    : combined;
}
