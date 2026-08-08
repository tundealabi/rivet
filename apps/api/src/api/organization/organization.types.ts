import type { CursorPaginationInput } from "@rivet/shared/api";

export interface ListOrganizationMembersInput {
  pagination: CursorPaginationInput;
  q?: string;
}
