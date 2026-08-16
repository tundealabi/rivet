import { ExportJobStatus, IssuePriority, IssueStatus } from "@generated/prisma";

export interface CreateExportJobInput {
  filterAssigneeId?: string | null;
  filterPriority?: IssuePriority | null;
  filterStatus?: IssueStatus | null;
  filterUnassigned: boolean;
  idempotencyKey: string;
  organizationId: string;
  projectId: string;
  requestedById: string;
}

export interface FindExportJobByIdempotencyInput {
  idempotencyKey: string;
  organizationId: string;
  requestedById: string;
}

export interface FindExportJobForRequesterInput {
  id: string;
  requestedById: string;
}

export interface CountExportJobsCreatedBetweenInput {
  createdAtGte: Date;
  createdAtLt: Date;
}

export interface UpdateExportJobInput {
  error?: string | null;
  expiresAt?: Date | null;
  objectKey?: string | null;
  status: ExportJobStatus;
}
