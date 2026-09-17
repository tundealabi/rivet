/** TanStack Query keys — always scoped to the active org (tenant isolation). */
export const issuesQueryKeys = {
  all: (orgId: string) => ["orgs", orgId, "issues"] as const,
  projectList: (orgId: string, projectId: string) =>
    [...issuesQueryKeys.all(orgId), "project", projectId] as const,
  orgList: (orgId: string, projectIds: string[]) =>
    [...issuesQueryKeys.all(orgId), "org", [...projectIds].sort()] as const,
  detail: (orgId: string, issueId: string) =>
    [...issuesQueryKeys.all(orgId), "detail", issueId] as const,
  summary: (orgId: string, projectId: string) =>
    [...issuesQueryKeys.all(orgId), "summary", projectId] as const,
};
