/** TanStack Query keys — always scoped to the active org (tenant isolation). */
export const projectsQueryKeys = {
  all: (orgId: string) => ["orgs", orgId, "projects"] as const,
  lists: (orgId: string) => [...projectsQueryKeys.all(orgId), "list"] as const,
  list: (orgId: string, archived = false) =>
    [...projectsQueryKeys.lists(orgId), { archived }] as const,
  detail: (orgId: string, projectId: string) =>
    [...projectsQueryKeys.all(orgId), "detail", projectId] as const,
};
