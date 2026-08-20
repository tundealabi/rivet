import type { ApiGeneralErrorResponseWire } from "@rivet/shared/api";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import request from "supertest";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";

describe("ThrottlerGuard (e2e)", () => {
  it("returns 429 after exceeding the short window", async () => {
    const app = await createE2eApp({ throttle: true });

    try {
      for (let index = 0; index < 3; index += 1) {
        await request(app.getHttpServer())
          .post(`${API_PREFIX}/auth/login`)
          .send({})
          .expect(400);
      }

      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({})
        .expect(429);

      const body = res.body as ApiGeneralErrorResponseWire;
      expect(body.error.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
      expect(body.error.message).toBe(ErrorMessage.TOO_MANY_REQUESTS);
    } finally {
      await app.close();
    }
  });
});
