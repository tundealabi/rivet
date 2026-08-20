import { PlanTier } from "./enums/org.enum.js";

export const CURSOR_PAGINATION_DEFAULT_LIMIT = 20;
export const CURSOR_PAGINATION_MAX_LIMIT = 100;

export const OFFSET_PAGINATION_DEFAULT_LIMIT = 20;
export const OFFSET_PAGINATION_MAX_LIMIT = 100;

export const REGEX_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[#?!@$%^&*-.])(?=.{8,})/;

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
export const IDEMPOTENCY_KEY_MAX_LENGTH = 256;

export const COMMENT_BODY_MAX_LENGTH = 10_000;

export const INVITE_TTL_DAYS = 7;
export const INVITE_MAX_EMAILS_PER_REQUEST = 50;

export interface PlanLimits {
  exportsPerMonth: number | null;
  members: number | null;
  projects: number | null;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: { exportsPerMonth: 10, members: 5, projects: 3 },
  [PlanTier.PRO]: { exportsPerMonth: 50, members: 25, projects: 20 },
  [PlanTier.TEAM]: { exportsPerMonth: null, members: null, projects: null },
};
