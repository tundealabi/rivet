-- AlterTable
ALTER TABLE "projects" ADD COLUMN "key" TEXT;

-- Backfill existing rows before enforcing NOT NULL
UPDATE "projects" SET "key" = UPPER(SUBSTRING("id"::text, 1, 8)) WHERE "key" IS NULL;

ALTER TABLE "projects" ALTER COLUMN "key" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "projects_org_id_key_key" ON "projects"("org_id", "key");
