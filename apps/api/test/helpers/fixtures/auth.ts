import type { INestApplication } from "@nestjs/common";
import type {
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  OrganizationMemberResponseWire,
  SignInAuthResponseWire,
  UserOrganizationResponseWire,
} from "@rivet/shared/api";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX, TEST_PASSWORD } from "../constants";

export type RegisteredUser = {
  accessToken: string;
  email: string;
  orgId: string;
  userId: string;
};

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@rivet.test`;
}

export async function registerLoginAndGetOrg(
  app: INestApplication<App>,
  label: string,
  orgName: string
): Promise<RegisteredUser> {
  const email = uniqueEmail(label);

  await request(app.getHttpServer())
    .post(`${API_PREFIX}/auth/register`)
    .send({
      email,
      firstName: "Test",
      lastName: "User",
      orgName,
      password: TEST_PASSWORD,
    })
    .expect(201);

  const loginRes = await request(app.getHttpServer())
    .post(`${API_PREFIX}/auth/login`)
    .send({
      email,
      password: TEST_PASSWORD,
    })
    .expect(200);

  const loginBody =
    loginRes.body as ApiSuccessResponseWire<SignInAuthResponseWire>;
  const accessToken = loginBody.data.authTokens.accessToken;

  const orgsRes = await request(app.getHttpServer())
    .get(`${API_PREFIX}/organizations`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  const orgsBody = orgsRes.body as ApiSuccessResponseWire<
    UserOrganizationResponseWire[]
  >;
  const orgId = orgsBody.data[0]?.orgId;

  if (!orgId) {
    throw new Error(`Expected org for registered user ${email}`);
  }

  const membersRes = await request(app.getHttpServer())
    .get(`${API_PREFIX}/organizations/members`)
    .set("Authorization", `Bearer ${accessToken}`)
    .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgId)
    .expect(200);

  const membersBody =
    membersRes.body as ApiPaginatedSuccessResponseWire<OrganizationMemberResponseWire>;
  const userId = membersBody.data.find((member) => member.email === email)?.id;

  if (!userId) {
    throw new Error(`Expected membership for registered user ${email}`);
  }

  return { accessToken, email, orgId, userId };
}
