import type { Request } from "express";
import { z } from "zod";

import { ValidationError } from "@/common/errors";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

const OrgIdSchema = z.string().uuid();

export function parseOrgIdHeader(request: Request): string {
  const raw = request.header(AUTH_CONSTANTS.ORG_ID_HEADER);
  const parsed = OrgIdSchema.safeParse(raw);

  if (!parsed.success) {
    throw new ValidationError({
      [AUTH_CONSTANTS.ORG_ID_HEADER]: [
        {
          message: "X-ORG-ID header is required and must be a valid UUID",
        },
      ],
    });
  }

  return parsed.data;
}
