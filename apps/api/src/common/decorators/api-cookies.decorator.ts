import "@/common/types";

import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

function readCookie(
  cookies: Record<string, unknown> = {},
  name: string
): string | undefined {
  const value = cookies[name];
  return typeof value === "string" ? value : undefined;
}

function readCookies(cookies: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(cookies).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : []
    )
  );
}

export const Cookies = createParamDecorator(
  (
    data: string | undefined,
    ctx: ExecutionContext
  ): string | Record<string, string> | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, unknown>;
    return data ? readCookie(cookies, data) : readCookies(cookies);
  }
);
