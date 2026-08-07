import { IssueResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class IssueResponseDto extends createZodDto(IssueResponseSchema) {}
