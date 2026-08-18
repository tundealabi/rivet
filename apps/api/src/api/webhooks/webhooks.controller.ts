import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";

import {
  THROTTLER_LONG,
  THROTTLER_MEDIUM,
  THROTTLER_SHORT,
} from "@/common/constants";
import { DomainError } from "@/common/errors";

import { STRIPE_SIGNATURE_HEADER } from "./webhooks.constants";
import { WebhooksService } from "./webhooks.service";

@SkipThrottle({
  [THROTTLER_LONG]: true,
  [THROTTLER_MEDIUM]: true,
  [THROTTLER_SHORT]: true,
})
@ApiExcludeController()
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  async handleStripe(
    @Headers(STRIPE_SIGNATURE_HEADER) signature: string | undefined,
    @Req() request: Request
  ) {
    try {
      await this.service.handleStripeWebhook({
        rawBody: request.rawBody,
        signature,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return { received: true };
      }

      throw error;
    }

    return { received: true };
  }
}
