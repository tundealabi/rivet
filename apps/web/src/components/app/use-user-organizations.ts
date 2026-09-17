import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { isAuthenticated, isSessionExpiredError } from "../../auth-api";
import { orgSwitcherQueryKeys } from "./org-query-keys";
import { fetchUserOrganizations } from "./org-switcher-api";

export function useUserOrganizations() {
  // Re-read localStorage after login/logout navigation; this hook's
  // callers (ActiveOrgProvider) do not subscribe to the router.
  useLocation();

  return useQuery({
    queryKey: orgSwitcherQueryKeys.list(),
    queryFn: fetchUserOrganizations,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) =>
      isSessionExpiredError(error) ? false : failureCount < 1,
  });
}
