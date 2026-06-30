import { OperationContext } from "@/common/types";

export interface CreateOrgInput {
  name: string;
  ctx?: OperationContext;
}
