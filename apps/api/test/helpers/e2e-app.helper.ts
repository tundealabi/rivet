import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { App } from "supertest/types";

import { AppModule } from "@/app/app.module";
import { configureApp } from "@/app/configure-app";
import { STRIPE_CLIENT } from "@/stripe";

export async function createE2eApp(options?: {
  stripeClient?: unknown;
}): Promise<INestApplication<App>> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options?.stripeClient !== undefined) {
    builder.overrideProvider(STRIPE_CLIENT).useValue(options.stripeClient);
  }

  const moduleFixture: TestingModule = await builder.compile();

  const app = moduleFixture.createNestApplication({ rawBody: true });
  configureApp(app);
  await app.init();

  return app;
}
