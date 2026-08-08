import { Injectable } from "@nestjs/common";
import type {
  OrganizationMemberResponseWire,
  UserOrganizationResponseWire,
} from "@rivet/shared/api";
import { ZodError } from "zod";

import { ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import { TenantContextService } from "@/common/services";
import type { PaginatedResult } from "@/common/types";
import { OrgMemberService } from "@/modules/org-member/org-member.service";

import { OrgMembersListCursorSchema } from "./organization.constants";
import { ListOrganizationMembersInput } from "./organization.types";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly orgMemberService: OrgMemberService,
    private readonly tenantContext: TenantContextService
  ) {}

  async getUserOrganizations(
    userId: string
  ): Promise<UserOrganizationResponseWire[]> {
    const result = await this.orgMemberService.listOrganizationsForUser({
      userId,
    });

    return result.items;
  }

  async listMembers(
    input: ListOrganizationMembersInput
  ): Promise<PaginatedResult<OrganizationMemberResponseWire>> {
    const after = this.decodeCursor(input.pagination.cursor);

    const result = await this.orgMemberService.listMembersInOrg({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      limit: input.pagination.limit,
      orgId: this.tenantContext.orgId,
      q: input.q,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items,
        nextCursor: result.next
          ? Helpers.encodePaginationCursor({
              createdAt: result.next.createdAt.toISOString(),
              id: result.next.id,
            })
          : null,
      },
      input.pagination
    );
  }

  private decodeCursor(cursor: string | undefined) {
    if (!cursor) {
      return undefined;
    }

    try {
      return Helpers.decodePaginationCursor(cursor, OrgMembersListCursorSchema);
    } catch (err) {
      if (err instanceof ZodError || err instanceof SyntaxError) {
        throw new ValidationError({
          cursor: [{ message: "Invalid cursor" }],
        });
      }
      throw err;
    }
  }
}
