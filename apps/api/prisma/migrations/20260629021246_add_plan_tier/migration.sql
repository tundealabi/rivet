-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'TEAM');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "plan_tier" "PlanTier" NOT NULL DEFAULT 'FREE';
