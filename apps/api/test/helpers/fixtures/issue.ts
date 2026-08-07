import type { INestApplication } from "@nestjs/common";
import type {
  ApiSuccessResponseWire,
  IssueResponseWire,
} from "@rivet/shared/api";
import type { IssuePriority, IssueStatus } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "../constants";

export async function createIssue(
  app: INestApplication<App>,
  accessToken: string,
  orgId: string,
  input: {
    description?: string;
    priority?: IssuePriority;
    projectId: string;
    status?: IssueStatus;
    title: string;
  }
): Promise<IssueResponseWire> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/issues`)
    .set("Authorization", `Bearer ${accessToken}`)
    .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgId)
    .send(input)
    .expect(201);

  const body = res.body as ApiSuccessResponseWire<IssueResponseWire>;
  return body.data;
}
