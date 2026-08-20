import {
  Controller,
  Get,
  Res,
  UseGuards,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";

import { SkipAllThrottlers, SkipApiEnvelope } from "@/common/decorators";
import { Metrics } from "@/observability";

import { MetricsBearerGuard } from "./metrics-bearer.guard";

@Controller({ version: VERSION_NEUTRAL })
@ApiExcludeController()
@SkipAllThrottlers()
@SkipApiEnvelope()
@UseGuards(MetricsBearerGuard)
export class MetricsController {
  @Get("metrics")
  async metrics(@Res() response: Response): Promise<void> {
    response.setHeader("Content-Type", Metrics.contentType());
    response.send(await Metrics.render());
  }
}
