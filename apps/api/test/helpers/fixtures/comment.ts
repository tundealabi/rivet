import type { INestApplication } from "@nestjs/common";
import type {
  ApiSuccessResponseWire,
  IssueCommentResponseWire,
} from "@rivet/shared/api";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "../constants";

export async function createIssueComment(
  app: INestApplication<App>,
  accessToken: string,
  orgId: string,
  issueId: string,
  body: string
): Promise<IssueCommentResponseWire> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/issues/${issueId}/comments`)
    .set("Authorization", `Bearer ${accessToken}`)
    .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgId)
    .send({ body })
    .expect(201);

  const response = res.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
  return response.data;
}
