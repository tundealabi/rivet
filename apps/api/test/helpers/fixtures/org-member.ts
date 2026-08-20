import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type { App } from "supertest/types";

import { OrgMemberService } from "@/modules/org-member/org-member.service";

export async function addOrgMember(
  app: INestApplication<App>,
  input: {
    orgId: string;
    role: OrganizationRole;
    userId: string;
  }
): Promise<void> {
  await app.get(OrgMemberService).create(input);
}
