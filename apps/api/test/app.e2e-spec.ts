import type { ApiSuccessResponseWire } from "@rivet/shared/api";
import { ApiResponseState } from "@rivet/shared/enums";
import request from "supertest";

import { createE2eApp } from "./helpers/e2e-app.helper";

describe("AppController (e2e)", () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("/ (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/v1")
      .expect(200)
      .expect((res) => {
        const body = res.body as ApiSuccessResponseWire<string>;

        expect(body.data).toBe("Hello World!");
        expect(body.error).toBeNull();
        expect(body.state).toBe(ApiResponseState.SUCCESS);
        expect(body.requestId).toEqual(expect.any(String));
        expect(body.timestamp).toEqual(expect.any(String));
      });
  });
});
