import type { INestApplication } from "@nestjs/common";
import type { ProjectResponseWire } from "@rivet/shared/api";
import type { ApiSuccessResponseWire } from "@rivet/shared/api";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "../constants";

export async function createProject(
  app: INestApplication<App>,
  accessToken: string,
  orgId: string,
  input: { description: string; key: string; name: string }
): Promise<ProjectResponseWire> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/projects`)
    .set("Authorization", `Bearer ${accessToken}`)
    .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgId)
    .send(input)
    .expect(201);

  const body = res.body as ApiSuccessResponseWire<ProjectResponseWire>;
  return body.data;
}
