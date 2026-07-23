/** TanStack Query keys — always scoped to the active org (tenant isolation). */
export const membersQueryKeys = {
  all: (orgId: string) => ["orgs", orgId, "members"] as const,
  roster: (orgId: string) =>
    [...membersQueryKeys.all(orgId), "roster"] as const,
};

/** Downstream consumers fed by the members roster (assignee picker, @mentions, avatars). */
export const orgPeopleQueryKeys = {
  assignees: (orgId: string) => ["orgs", orgId, "assignees"] as const,
  mentions: (orgId: string) => ["orgs", orgId, "mentions"] as const,
};

export function orgPeopleQueryPrefix(orgId: string) {
  return ["orgs", orgId] as const;
}
