/*
  Warnings:

  - Made the column `idempotency_key` on table `export_jobs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "export_jobs" ALTER COLUMN "idempotency_key" SET NOT NULL;
