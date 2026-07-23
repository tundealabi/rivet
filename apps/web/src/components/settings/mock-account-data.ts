import { OrganizationRole } from "@rivet/shared";

import {
  MOCK_ORG_ID,
  MOCK_ORG_NAME,
  MOCK_ROLE,
} from "../members/mock-members-data";
import type { UserOrgMembership } from "./settings-types";

export const MOCK_USER_MEMBERSHIPS: UserOrgMembership[] = [
  {
    orgId: MOCK_ORG_ID,
    orgName: MOCK_ORG_NAME,
    role: MOCK_ROLE,
  },
  {
    orgId: "org_globex",
    orgName: "Globex Ltd.",
    role: OrganizationRole.ADMIN,
  },
  {
    orgId: "org_side",
    orgName: "Side Collab",
    role: OrganizationRole.MEMBER,
  },
];
