import { PLAN_LIMITS } from "@rivet/shared/constants";

import type { PlanTier } from "../members/member-types";
import type { OrgUsageSnapshot } from "./billing-types";
import { PLAN_DISPLAY_NAMES } from "./billing-types";

export { PLAN_LIMITS };

export interface PlanCardConfig {
  tier: PlanTier;
  features: string[];
  highlighted?: boolean;
}

export const LANDING_PLAN_TAGLINES: Record<PlanTier, string> = {
  FREE: "For getting started",
  PRO: "For growing teams",
  TEAM: "For larger organizations",
};

export const LANDING_PLAN_CTAS: Record<PlanTier, string> = {
  FREE: "Get started free",
  PRO: "Start with Pro",
  TEAM: "Start with Team",
};

export const PLAN_CARDS: PlanCardConfig[] = [
  {
    tier: "FREE",
    features: [
      "Up to 3 projects",
      "Up to 5 team members",
      "Unlimited issues",
      "10 CSV exports/month",
      "Community support",
    ],
  },
  {
    tier: "PRO",
    highlighted: true,
    features: [
      "Up to 20 projects",
      "Up to 25 team members",
      "Priority support",
      "50 CSV exports/month",
      "Advanced RBAC",
      "Higher API rate limits",
    ],
  },
  {
    tier: "TEAM",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Unlimited exports",
      "Highest rate limits",
      "SAML SSO (future)",
      "Dedicated support",
    ],
  },
];

export type ComparisonCell =
  { type: "check" } | { type: "dash" } | { type: "text"; value: string };

export interface ComparisonRow {
  feature: string;
  free: ComparisonCell;
  pro: ComparisonCell;
  team: ComparisonCell;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Projects",
    free: { type: "text", value: "Up to 3" },
    pro: { type: "text", value: "Up to 20" },
    team: { type: "text", value: "Unlimited" },
  },
  {
    feature: "Team members",
    free: { type: "text", value: "Up to 5" },
    pro: { type: "text", value: "Up to 25" },
    team: { type: "text", value: "Unlimited" },
  },
  {
    feature: "Issues",
    free: { type: "text", value: "Unlimited" },
    pro: { type: "text", value: "Unlimited" },
    team: { type: "text", value: "Unlimited" },
  },
  {
    feature: "CSV exports",
    free: { type: "text", value: "10 / month" },
    pro: { type: "text", value: "50 / month" },
    team: { type: "text", value: "Unlimited" },
  },
  {
    feature: "Support",
    free: { type: "text", value: "Community" },
    pro: { type: "text", value: "Priority" },
    team: { type: "text", value: "Dedicated" },
  },
  {
    feature: "Advanced RBAC",
    free: { type: "dash" },
    pro: { type: "check" },
    team: { type: "check" },
  },
  {
    feature: "API rate limits",
    free: { type: "text", value: "Standard" },
    pro: { type: "text", value: "Higher" },
    team: { type: "text", value: "Highest" },
  },
  {
    feature: "SAML SSO",
    free: { type: "dash" },
    pro: { type: "dash" },
    team: { type: "text", value: "Coming soon" },
  },
];

export interface DowngradeImplication {
  label: string;
  action?: string;
}

export function downgradeImplications(
  currentTier: PlanTier,
  targetTier: PlanTier,
  usage: OrgUsageSnapshot,
  effectiveDate: Date
): DowngradeImplication[] {
  const currentLimits = PLAN_LIMITS[currentTier];
  const targetLimits = PLAN_LIMITS[targetTier];
  const dateLabel = effectiveDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const implications: DowngradeImplication[] = [];

  implications.push({
    label: `On ${dateLabel} (end of your billing period), you'll lose:`,
  });

  if (
    targetLimits.projects !== null &&
    usage.projectCount > targetLimits.projects
  ) {
    const excess = usage.projectCount - targetLimits.projects;
    const currentCap =
      currentLimits.projects === null ? "unlimited" : currentLimits.projects;
    implications.push({
      label: `${excess} project${excess === 1 ? "" : "s"} (currently ${usage.projectCount} on ${PLAN_DISPLAY_NAMES[currentTier]}'s ${currentCap}, ${PLAN_DISPLAY_NAMES[targetTier]} allows ${targetLimits.projects})`,
      action: `archive ${excess} project${excess === 1 ? "" : "s"}`,
    });
  }

  if (
    targetLimits.members !== null &&
    usage.memberCount > targetLimits.members
  ) {
    const excess = usage.memberCount - targetLimits.members;
    const currentCap =
      currentLimits.members === null ? "unlimited" : currentLimits.members;
    implications.push({
      label: `${excess} team member${excess === 1 ? "" : "s"} (currently ${usage.memberCount} on ${currentCap}, ${PLAN_DISPLAY_NAMES[targetTier]} allows ${targetLimits.members})`,
      action: `remove ${excess} member${excess === 1 ? "" : "s"}`,
    });
  }

  if (
    currentLimits.exportsPerMonth !== null &&
    targetLimits.exportsPerMonth !== null &&
    currentLimits.exportsPerMonth > targetLimits.exportsPerMonth
  ) {
    const lost = currentLimits.exportsPerMonth - targetLimits.exportsPerMonth;
    implications.push({
      label: `Access to ${lost} CSV exports/month`,
    });
  }

  if (targetTier === "FREE") {
    implications.push({
      label: "Priority support and advanced RBAC",
    });
  }

  if (targetTier === "PRO" && currentTier === "TEAM") {
    implications.push({
      label: "Dedicated support and SAML SSO (when available)",
    });
  }

  return implications;
}

export function hasDowngradeLimitConflicts(
  targetTier: PlanTier,
  usage: OrgUsageSnapshot
): boolean {
  const limits = PLAN_LIMITS[targetTier];

  if (limits.projects !== null && usage.projectCount > limits.projects) {
    return true;
  }

  if (limits.members !== null && usage.memberCount > limits.members) {
    return true;
  }

  return false;
}
