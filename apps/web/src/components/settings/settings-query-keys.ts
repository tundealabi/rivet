export const settingsQueryKeys = {
  all: (orgId: string) => ["settings", orgId] as const,
  orgGeneral: (orgId: string) =>
    [...settingsQueryKeys.all(orgId), "org-general"] as const,
  orgNotifications: (orgId: string) =>
    [...settingsQueryKeys.all(orgId), "org-notifications"] as const,
  slugAvailability: (orgId: string, slug: string) =>
    [...settingsQueryKeys.all(orgId), "slug-availability", slug] as const,
  page: (orgId: string) => [...settingsQueryKeys.all(orgId), "page"] as const,
  profile: () => ["settings", "profile"] as const,
  accountDanger: (orgId: string) =>
    [...settingsQueryKeys.all(orgId), "account-danger"] as const,
  security: () => ["settings", "security"] as const,
  accountNotifications: (orgId: string) =>
    [...settingsQueryKeys.all(orgId), "account-notifications"] as const,
};
