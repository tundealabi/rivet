import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { ApiSuccessResponseWire } from "@rivet/shared/api";
import { ApiResponseState } from "@rivet/shared/enums";
import request from "supertest";
import { App } from "supertest/types";

import { AppModule } from "../src/app/app.module";
import { configureApp } from "../src/app/configure-app";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
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

  afterEach(async () => {
    await app.close();
  });
});
