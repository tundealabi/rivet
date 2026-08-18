import { PrismaClient } from "@generated/prisma";
import { InternalServerErrorException } from "@nestjs/common";

import { isTenantScopedModel, TENANT_ORG_FIELD } from "./tenant-scoped.models";

type QueryArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
};

const WHERE_OPERATIONS = new Set([
  "aggregate",
  "count",
  "delete",
  "deleteMany",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
]);

const CREATE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
]);

function requireOrgId(
  getOrgId: () => string | undefined,
  model: string,
  operation: string
): string {
  const orgId = getOrgId();

  if (!orgId) {
    throw new InternalServerErrorException(
      `Tenant org context is required for ${model}.${operation}`
    );
  }

  return orgId;
}

function mergeOrgIntoWhere(
  where: Record<string, unknown> | undefined,
  orgId: string
): Record<string, unknown> {
  if (!where) {
    return { [TENANT_ORG_FIELD]: orgId };
  }

  return {
    ...where,
    [TENANT_ORG_FIELD]: orgId,
  };
}

function mergeOrgIntoData(
  data: Record<string, unknown>,
  orgId: string
): Record<string, unknown> {
  const existingOrgId = data[TENANT_ORG_FIELD];

  if (existingOrgId && existingOrgId !== orgId) {
    throw new InternalServerErrorException(
      "Tenant org context does not match organizationId in write data"
    );
  }

  return {
    ...data,
    [TENANT_ORG_FIELD]: orgId,
  };
}

function applyTenantScope(
  operation: string,
  args: QueryArgs,
  orgId: string
): QueryArgs {
  const scopedArgs: QueryArgs = { ...args };

  if (WHERE_OPERATIONS.has(operation)) {
    scopedArgs.where = mergeOrgIntoWhere(scopedArgs.where, orgId);
  }

  if (CREATE_OPERATIONS.has(operation) && scopedArgs.data) {
    if (Array.isArray(scopedArgs.data)) {
      scopedArgs.data = scopedArgs.data.map((item) =>
        mergeOrgIntoData(item, orgId)
      );
    } else {
      scopedArgs.data = mergeOrgIntoData(scopedArgs.data, orgId);
    }
  }

  if (operation === "upsert") {
    scopedArgs.where = mergeOrgIntoWhere(scopedArgs.where, orgId);
    scopedArgs.create = mergeOrgIntoData(scopedArgs.create ?? {}, orgId);
    scopedArgs.update = scopedArgs.update ?? {};
  }

  if (operation === "update" || operation === "updateManyAndReturn") {
    scopedArgs.data = scopedArgs.data ?? {};
  }

  return scopedArgs;
}

export function createTenantScopedClient(
  baseClient: PrismaClient,
  getOrgId: () => string | undefined
) {
  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!isTenantScopedModel(model)) {
            return query(args);
          }

          const orgId = requireOrgId(getOrgId, model, operation);
          const scopedArgs = applyTenantScope(operation, args, orgId);

          return query(scopedArgs);
        },
      },
    },
  });
}

export type AppPrismaClient = ReturnType<typeof createTenantScopedClient>;

export type AppPrismaClientLike =
  | AppPrismaClient
  | Parameters<Parameters<AppPrismaClient["$transaction"]>[0]>[0];
