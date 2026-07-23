import type { OrganizationRole } from "@rivet/shared";

import type {
  PendingOrgInvitation,
  UserOrganization,
  UserOrganizationsStatus,
} from "../app/org-switcher-types";

export type ActiveOrgContextValue = {
  orgId: string;
  orgName: string;
  role: OrganizationRole;
  organizations: UserOrganization[];
  pendingInvitations: PendingOrgInvitation[];
  orgsStatus: UserOrganizationsStatus;
  hasOrganizations: boolean;
  isSwitching: boolean;
  refetchOrganizations: () => void;
  switchOrg: (orgId: string) => Promise<boolean>;
};
