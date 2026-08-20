import type { ClsService } from "nestjs-cls";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants";

import {
  resolveTenantLogFields,
  tenantFieldsFromCls,
} from "./tenant-log-fields";

function clsStub(store: {
  active: boolean;
  orgId?: string;
  userId?: string;
}): ClsService<TenantContextStore> {
  return {
    isActive: () => store.active,
    get: (key: string) => {
      if (key === TENANT_CONTEXT_KEYS.orgId) {
        return store.orgId;
      }
      if (key === TENANT_CONTEXT_KEYS.userId) {
        return store.userId;
      }
      return undefined;
    },
  } as unknown as ClsService<TenantContextStore>;
}

describe("tenantFieldsFromCls", () => {
  it("returns nothing when CLS is inactive", () => {
    expect(
      tenantFieldsFromCls(clsStub({ active: false, orgId: "org-1" }))
    ).toEqual({});
  });

  it("omits missing ids", () => {
    expect(tenantFieldsFromCls(clsStub({ active: true }))).toEqual({});
  });

  it("returns orgId and userId when set", () => {
    expect(
      tenantFieldsFromCls(
        clsStub({ active: true, orgId: "org-1", userId: "user-1" })
      )
    ).toEqual({ orgId: "org-1", userId: "user-1" });
  });
});

describe("resolveTenantLogFields", () => {
  it("prefers live CLS over request stash", () => {
    expect(
      resolveTenantLogFields(clsStub({ active: true, orgId: "org-live" }), {
        logFields: { orgId: "org-stale", userId: "user-1" },
      })
    ).toEqual({ orgId: "org-live", userId: "user-1" });
  });

  it("uses request stash when CLS has no tenant", () => {
    expect(
      resolveTenantLogFields(clsStub({ active: false }), {
        logFields: { orgId: "org-1" },
      })
    ).toEqual({ orgId: "org-1" });
  });
});
