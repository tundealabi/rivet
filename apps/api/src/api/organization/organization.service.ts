import { Injectable } from "@nestjs/common";
import type { UserOrganizationResponseWire } from "@rivet/shared/api";

import { OrgMemberService } from "@/modules/org-member/org-member.service";

@Injectable()
export class OrganizationService {
  constructor(private readonly orgMemberService: OrgMemberService) {}

  // ------------------------------
  // Get User's Organizations
  // ------------------------------

  async getUserOrganizations(
    userId: string
  ): Promise<UserOrganizationResponseWire[]> {
    const result = await this.orgMemberService.listOrganizationsForUser({
      userId,
    });

    return result.items;
  }
}
