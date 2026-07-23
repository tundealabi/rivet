import type { PlanTier } from "../members/member-types";

/** Free plans cannot create additional organizations from the switcher. */
export function canCreateAdditionalOrg(planTier: PlanTier): boolean {
  return planTier !== "FREE";
}
