import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";
import type { Request } from "express";
import { z } from "zod";

import { ValidationError } from "@/common/errors";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

const OrgIdSchema = z.string().uuid();

export const ApiOrgIdHeader = () =>
  ApiHeader({
    name: AUTH_CONSTANTS.ORG_ID_HEADER,
    description: "Organization ID for the request",
    required: true,
  });

export const ApiOrgId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
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
);
