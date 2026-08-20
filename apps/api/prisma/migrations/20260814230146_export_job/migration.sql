-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "project_id" UUID NOT NULL,
    "filter_status" "IssueStatus",
    "filter_priority" "IssuePriority",
    "filter_assignee_id" UUID,
    "filter_unassigned" BOOLEAN NOT NULL DEFAULT false,
    "object_key" TEXT,
    "error" TEXT,
    "idempotency_key" TEXT,
    "requested_by_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_jobs_org_id_created_at_idx" ON "export_jobs"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "export_jobs_org_id_requested_by_id_created_at_idx" ON "export_jobs"("org_id", "requested_by_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "export_jobs_org_id_requested_by_id_idempotency_key_key" ON "export_jobs"("org_id", "requested_by_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
