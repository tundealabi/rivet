import { useQuery } from "@tanstack/react-query";

import { orgSwitcherQueryKeys } from "./org-query-keys";
import { fetchUserOrganizationsMock } from "./org-switcher-api";

export function useUserOrganizations() {
  return useQuery({
    queryKey: orgSwitcherQueryKeys.list(),
    queryFn: fetchUserOrganizationsMock,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
