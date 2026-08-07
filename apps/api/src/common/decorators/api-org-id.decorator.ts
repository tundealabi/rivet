import { ApiHeader } from "@nestjs/swagger";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

export const ApiOrgIdHeader = () =>
  ApiHeader({
    name: AUTH_CONSTANTS.ORG_ID_HEADER,
    description: "Organization ID for the request",
    required: true,
  });
