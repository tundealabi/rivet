import { ListIssuesQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListIssuesQueryDto extends createZodDto(ListIssuesQuerySchema) {}
