import type { UserOrganization } from "./org-switcher-types";

export const ORG_LIST_SEARCH_THRESHOLD = 5;
export const ORG_LIST_SCROLL_THRESHOLD = 8;
export const ORG_LIST_MAX_HEIGHT = "400px";

/** Current org first, then most-recently active, then alphabetical. */
export function sortOrganizationsForMenu(
  organizations: UserOrganization[],
  activeOrgId: string
): UserOrganization[] {
  const active = organizations.find((org) => org.orgId === activeOrgId);
  const rest = organizations.filter((org) => org.orgId !== activeOrgId);

  rest.sort((a, b) => {
    const aTime = a.lastActiveAt?.getTime() ?? 0;
    const bTime = b.lastActiveAt?.getTime() ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.orgName.localeCompare(b.orgName, undefined, {
      sensitivity: "base",
    });
  });

  return active ? [active, ...rest] : rest;
}

export function filterOrganizationsBySearch(
  organizations: UserOrganization[],
  query: string
): UserOrganization[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return organizations;

  return organizations.filter((org) =>
    org.orgName.toLowerCase().includes(normalized)
  );
}
