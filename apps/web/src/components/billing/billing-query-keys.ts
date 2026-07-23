/** TanStack Query keys — always scoped to the active org (tenant isolation). */
export const billingQueryKeys = {
  all: (orgId: string) => ["orgs", orgId, "billing"] as const,
  summary: (orgId: string) =>
    [...billingQueryKeys.all(orgId), "summary"] as const,
};
