import { OrganizationRole } from "@rivet/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { touchOrganizationActivity } from "../app/mock-orgs-data";
import { switchActiveOrgApi } from "../app/org-switch-api";
import {
  findOrganizationInList,
  resolveOrganization,
} from "../app/org-switcher-api";
import type {
  UserOrganization,
  UserOrganizationsStatus,
} from "../app/org-switcher-types";
import { useUserOrganizations } from "../app/use-user-organizations";
import { ActiveOrgContext } from "./use-active-org";

const ACTIVE_ORG_STORAGE_KEY = "rivet_active_org";
const MIN_SWITCH_UI_MS = 200;

function readStoredOrgId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
}

function pickInitialOrgId(organizations: UserOrganization[]): string {
  const stored = readStoredOrgId();
  if (stored && findOrganizationInList(organizations, stored)) return stored;
  return organizations[0]?.orgId ?? "";
}

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const orgsQuery = useUserOrganizations();
  const organizations = useMemo(
    () => orgsQuery.data?.organizations ?? [],
    [orgsQuery.data]
  );
  const pendingInvitations = useMemo(
    () => orgsQuery.data?.pendingInvitations ?? [],
    [orgsQuery.data]
  );

  const orgsStatus: UserOrganizationsStatus = orgsQuery.isPending
    ? "loading"
    : orgsQuery.isError
      ? "error"
      : "success";

  const [orgId, setOrgId] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  // Resolve/validate the active org id during render as the org list loads,
  // instead of syncing it from an effect (avoids cascading renders).
  if (orgsStatus === "success") {
    const currentIsValid =
      orgId !== "" && findOrganizationInList(organizations, orgId);
    if (!currentIsValid) {
      const next = pickInitialOrgId(organizations);
      if (next !== orgId) setOrgId(next);
    }
  }

  const activeOrg = useMemo(() => {
    if (organizations.length === 0) return null;
    return resolveOrganization(organizations, orgId);
  }, [organizations, orgId]);

  const switchOrg = useCallback(
    async (nextOrgId: string): Promise<boolean> => {
      if (
        nextOrgId === orgId ||
        !findOrganizationInList(organizations, nextOrgId)
      ) {
        return false;
      }

      const startedAt = Date.now();
      setIsSwitching(true);
      queryClient.clear();

      try {
        await switchActiveOrgApi(nextOrgId);
        setOrgId(nextOrgId);
        sessionStorage.setItem(ACTIVE_ORG_STORAGE_KEY, nextOrgId);
        touchOrganizationActivity(nextOrgId);
        return true;
      } catch {
        return false;
      } finally {
        const remaining = Math.max(
          0,
          MIN_SWITCH_UI_MS - (Date.now() - startedAt)
        );
        window.setTimeout(() => setIsSwitching(false), remaining);
      }
    },
    [orgId, organizations, queryClient]
  );

  const refetchOrganizations = useCallback(() => {
    void orgsQuery.refetch();
  }, [orgsQuery]);

  const value = useMemo(
    () => ({
      orgId: activeOrg?.orgId ?? "",
      orgName: activeOrg?.orgName ?? "No organization",
      role: activeOrg?.role ?? OrganizationRole.MEMBER,
      organizations,
      pendingInvitations,
      orgsStatus,
      hasOrganizations: organizations.length > 0,
      isSwitching,
      refetchOrganizations,
      switchOrg,
    }),
    [
      activeOrg,
      organizations,
      pendingInvitations,
      orgsStatus,
      isSwitching,
      refetchOrganizations,
      switchOrg,
    ]
  );

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}
