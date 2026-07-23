/** TanStack Query keys for the signed-in user's org memberships. */
export const orgSwitcherQueryKeys = {
  all: ["user-organizations"] as const,
  list: () => [...orgSwitcherQueryKeys.all, "list"] as const,
};
