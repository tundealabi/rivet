import { createContext, useContext } from "react";

import type {
  PendingOrgInvitation,
  UserOrganization,
} from "../app/org-switcher-types";
import { MOCK_ORG_ID, MOCK_ROLE } from "../members/mock-members-data";
import type { ActiveOrgContextValue } from "./active-org-types";

export type { ActiveOrgContextValue } from "./active-org-types";

export const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(
  null
);

export function useActiveOrg(): ActiveOrgContextValue {
  const context = useContext(ActiveOrgContext);

  if (!context) {
    return {
      orgId: MOCK_ORG_ID,
      orgName: "Acme Inc.",
      role: MOCK_ROLE,
      organizations: [] as UserOrganization[],
      pendingInvitations: [] as PendingOrgInvitation[],
      orgsStatus: "success",
      hasOrganizations: true,
      isSwitching: false,
      refetchOrganizations: () => undefined,
      switchOrg: () => Promise.resolve(false),
    };
  }

  return context;
}
