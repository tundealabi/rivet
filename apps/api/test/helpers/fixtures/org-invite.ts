import type { INestApplication } from "@nestjs/common";
import type {
  ApiSuccessResponseWire,
  OrganizationInviteCreatedResponseWire,
} from "@rivet/shared/api";
import type { AssignableInviteRole } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "../constants";

export async function createOrganizationInvites(
  app: INestApplication<App>,
  accessToken: string,
  orgId: string,
  input: { emails: string[]; role: AssignableInviteRole }
): Promise<OrganizationInviteCreatedResponseWire[]> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/organizations/invites`)
    .set("Authorization", `Bearer ${accessToken}`)
    .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgId)
    .send(input)
    .expect(201);

  const body = res.body as ApiSuccessResponseWire<
    OrganizationInviteCreatedResponseWire[]
  >;

  return body.data;
}
