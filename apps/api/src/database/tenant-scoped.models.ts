/** Prisma model names (PascalCase) that require org scoping via CLS. */
export const TENANT_SCOPED_MODELS = [
  "ExportJob",
  "Issue",
  "IssueActivity",
  "Project",
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

export const TENANT_ORG_FIELD = "organizationId" as const;

export function isTenantScopedModel(model: string): model is TenantScopedModel {
  return TENANT_SCOPED_MODELS.includes(model as TenantScopedModel);
}
