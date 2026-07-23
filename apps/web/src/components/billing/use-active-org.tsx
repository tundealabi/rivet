import { OrganizationRole } from "@rivet/shared";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { touchOrganizationActivity } from "../app/mock-orgs-data";
import { switchActiveOrgApi } from "../app/org-switch-api";
import {
  findOrganizationInList,
  resolveOrganization,
} from "../app/org-switcher-api";
import type {
  PendingOrgInvitation,
  UserOrganization,
  UserOrganizationsStatus,
} from "../app/org-switcher-types";
import { useUserOrganizations } from "../app/use-user-organizations";
import { MOCK_ORG_ID, MOCK_ROLE } from "../members/mock-members-data";
import type { ActiveOrgContextValue } from "./active-org-types";

export type { ActiveOrgContextValue } from "./active-org-types";

const ACTIVE_ORG_STORAGE_KEY = "rivet_active_org";
const MIN_SWITCH_UI_MS = 200;

const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(null);

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
  const organizations = orgsQuery.data?.organizations ?? [];
  const pendingInvitations = orgsQuery.data?.pendingInvitations ?? [];

  const orgsStatus: UserOrganizationsStatus = orgsQuery.isPending
    ? "loading"
    : orgsQuery.isError
      ? "error"
      : "success";

  const [orgId, setOrgId] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (orgsStatus !== "success") return;

    setOrgId((current) => {
      if (current && findOrganizationInList(organizations, current)) {
        return current;
      }
      return pickInitialOrgId(organizations);
    });
  }, [organizations, orgsStatus]);

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

export function useActiveOrg(): ActiveOrgContextValue {
  const context = useContext(ActiveOrgContext);

  if (!context) {
    return {
      orgId: MOCK_ORG_ID,
      orgName: "Acme Inc.",
      role: MOCK_ROLE,
      organizations: [] as UserOrganization[],
      pendingInvitations: [] as PendingOrgInvitation[],
      orgsStatus: "success",
      hasOrganizations: true,
      isSwitching: false,
      refetchOrganizations: () => undefined,
      switchOrg: () => Promise.resolve(false),
    };
  }

  return context;
}
