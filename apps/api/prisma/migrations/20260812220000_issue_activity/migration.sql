-- CreateEnum
CREATE TYPE "IssueActivityField" AS ENUM ('ASSIGNEE', 'DESCRIPTION', 'PRIORITY', 'STATUS', 'TITLE');

-- CreateTable
CREATE TABLE "issue_activities" (
    "id" UUID NOT NULL,
    "field" "IssueActivityField" NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "actor_id" UUID,
    "issue_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_activities_issue_id_created_at_idx" ON "issue_activities"("issue_id", "created_at");

-- CreateIndex
CREATE INDEX "issue_activities_org_id_idx" ON "issue_activities"("org_id");

-- AddForeignKey
ALTER TABLE "issue_activities" ADD CONSTRAINT "issue_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_activities" ADD CONSTRAINT "issue_activities_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_activities" ADD CONSTRAINT "issue_activities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
