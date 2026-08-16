import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IDEMPOTENCY_KEY_HEADER } from "@rivet/shared/constants";

import {
  ApiEnvelopeResponse,
  ApiIdempotencyKeyHeader,
  ApiOrgIdHeader,
} from "@/common/decorators";
import { OrgMemberGuard } from "@/common/guards";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import { CreateExportRequestDto, ExportJobResponseDto } from "./dto";
import { ExportService } from "./export.service";

@Controller("exports")
@UseGuards(AuthUserJwtGuard, OrgMemberGuard)
@ApiOrgIdHeader()
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post()
  @ApiIdempotencyKeyHeader()
  @ApiEnvelopeResponse(ExportJobResponseDto, {
    auth: "required",
    description:
      "Create an async issue CSV export for the current list filters. Returns 202 immediately; poll GET /exports/:id for status and a signed download URL.",
    errorResponses: [
      {
        description: "Missing or invalid Idempotency-Key header",
        status: HttpStatus.BAD_REQUEST,
      },
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project not found",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "CSV export quota exceeded for this month",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.ACCEPTED,
    summary: "Create an issue CSV export",
  })
  create(
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey: string | undefined,
    @Body() dto: CreateExportRequestDto
  ): Promise<ExportJobResponseDto> {
    return this.service.createExport({
      assigneeId: dto.assigneeId,
      idempotencyKey,
      priority: dto.priority,
      projectId: dto.projectId,
      status: dto.status,
    });
  }

  @Get(":id")
  @ApiEnvelopeResponse(ExportJobResponseDto, {
    auth: "required",
    description:
      "Get an export job by ID. Only the requester can read it. When succeeded and unexpired, data.downloadUrl is a short-lived signed GET.",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Export not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Get an export job",
  })
  get(@Param("id", ParseUUIDPipe) id: string): Promise<ExportJobResponseDto> {
    return this.service.getExport(id);
  }
}
