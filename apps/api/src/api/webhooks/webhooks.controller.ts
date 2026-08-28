import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request } from "express";

import { ApiPublic, SkipAllThrottlers } from "@/common/decorators";
import { DomainError } from "@/common/errors";

import { STRIPE_SIGNATURE_HEADER } from "./webhooks.constants";
import { WebhooksService } from "./webhooks.service";

@ApiPublic()
@SkipAllThrottlers()
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
