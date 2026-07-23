import type { IssueListPreset } from "./issue-list-presets";

/** TanStack Query keys — always scoped to the active org (tenant isolation). */
export const dashboardQueryKeys = {
  all: (orgId: string) => ["orgs", orgId, "dashboard"] as const,
  stats: (orgId: string) =>
    [...dashboardQueryKeys.all(orgId), "stats"] as const,
  stat: (orgId: string, preset: IssueListPreset | "fourth") =>
    [...dashboardQueryKeys.stats(orgId), preset] as const,
  activity: (orgId: string) =>
    [...dashboardQueryKeys.all(orgId), "activity"] as const,
};
