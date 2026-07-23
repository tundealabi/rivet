import {
  Box,
  Flex,
  HStack,
  Image,
  Input,
  Popover,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { OrganizationRole } from "@rivet/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PiBuildingOffice, PiCaretUpDown, PiCheck } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

import { useActiveOrg } from "../billing/use-active-org";
import { useBillingSummary } from "../billing/use-billing-queries";
import { transition } from "../issues/issues-motion";
import { canCreateAdditionalOrg } from "./org-switcher-permissions";
import type { UserOrganization } from "./org-switcher-types";
import {
  ORG_SWITCHER_OPEN_EVENT,
  orgSwitcherItemBg,
  orgSwitcherMenuItemStyles,
  orgSwitcherTriggerStyles,
} from "./org-switcher-ui";
import {
  filterOrganizationsBySearch,
  ORG_LIST_MAX_HEIGHT,
  ORG_LIST_SCROLL_THRESHOLD,
  ORG_LIST_SEARCH_THRESHOLD,
  sortOrganizationsForMenu,
} from "./org-switcher-utils";
import { OrgRoleLabel } from "./OrgRoleLabel";
import { OrgSwitcherFooter } from "./OrgSwitcherFooter";
import {
  OrgSwitcherMenuErrorMessage,
  OrgSwitcherMenuSkeleton,
} from "./OrgSwitcherMenuStates";
import { OrgSwitchUnsavedDialog } from "./OrgSwitchUnsavedDialog";
import { useUnsavedChangesRegistry } from "./unsaved-changes-registry";
import {
  type OrgSwitcherMenuAction,
  useOrgSwitcherKeyboard,
} from "./use-org-switcher-keyboard";

const COLLAPSED_LOGO_SIZE = "8";

interface OrgSwitcherProps {
  collapsed?: boolean;
}

interface OrgAvatarProps {
  organization: Pick<UserOrganization, "orgName" | "initials" | "logoUrl">;
  size?: number | string;
}

function OrgAvatar({ organization, size = "8" }: OrgAvatarProps) {
  if (organization.logoUrl) {
    return (
      <Image
        src={organization.logoUrl}
        alt=""
        boxSize={size}
        borderRadius="control"
        objectFit="cover"
        flexShrink="0"
      />
    );
  }

  return (
    <Flex
      boxSize={size}
      align="center"
      justify="center"
      borderRadius="control"
      bg="brand.subtle"
      color="accent.default"
      fontWeight="semibold"
      fontSize="xs"
      flexShrink="0"
      userSelect="none"
    >
      {organization.initials}
    </Flex>
  );
}

function NoOrgAvatar({ size = "8" }: { size?: number | string }) {
  return (
    <Flex
      boxSize={size}
      align="center"
      justify="center"
      borderRadius="control"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.default"
      bg="bg.surfaceHover"
      color="fg.muted"
      flexShrink="0"
    >
      <PiBuildingOffice size={size === COLLAPSED_LOGO_SIZE ? 16 : 14} />
    </Flex>
  );
}

interface OrgSwitcherTriggerProps {
  organization: UserOrganization;
  role: OrganizationRole;
  collapsed?: boolean;
}

function OrgSwitcherTrigger({
  organization,
  role,
  collapsed = false,
}: OrgSwitcherTriggerProps) {
  if (collapsed) {
    return (
      <Flex
        as="button"
        {...orgSwitcherTriggerStyles}
        h="16"
        align="center"
        justify="center"
        aria-label={`${organization.orgName}, ${role}`}
      >
        <OrgAvatar organization={organization} size={COLLAPSED_LOGO_SIZE} />
      </Flex>
    );
  }

  return (
    <HStack
      as="button"
      {...orgSwitcherTriggerStyles}
      h="16"
      px="4"
      gap="3"
      aria-haspopup="menu"
      aria-expanded={undefined}
    >
      <OrgAvatar organization={organization} />
      <Box minW="0" flex="1">
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="fg.primary"
          truncate
          lineHeight="1.3"
        >
          {organization.orgName}
        </Text>
        <OrgRoleLabel role={role} />
      </Box>
      <Box
        data-org-chevron
        color="fg.muted"
        lineHeight="0"
        flexShrink="0"
        transition={transition.fast}
        opacity="0.85"
      >
        <PiCaretUpDown size={14} />
      </Box>
    </HStack>
  );
}

function OrgSwitcherEmptyTrigger({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Flex
        as="button"
        {...orgSwitcherTriggerStyles}
        h="16"
        align="center"
        justify="center"
        aria-label="No organization"
      >
        <NoOrgAvatar size={COLLAPSED_LOGO_SIZE} />
      </Flex>
    );
  }

  return (
    <HStack
      as="button"
      {...orgSwitcherTriggerStyles}
      h="16"
      px="4"
      gap="3"
      aria-haspopup="menu"
    >
      <NoOrgAvatar />
      <Box minW="0" flex="1">
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="fg.muted"
          lineHeight="1.3"
        >
          No organization
        </Text>
      </Box>
      <Box
        data-org-chevron
        color="fg.muted"
        lineHeight="0"
        flexShrink="0"
        transition={transition.fast}
        opacity="0.85"
      >
        <PiCaretUpDown size={14} />
      </Box>
    </HStack>
  );
}

interface OrgMenuItemProps {
  organization: UserOrganization;
  active: boolean;
  highlighted: boolean;
  itemRef?: (node: HTMLElement | null) => void;
  onSelect: () => void;
  onHover: () => void;
}

function OrgMenuItem({
  organization,
  active,
  highlighted,
  itemRef,
  onSelect,
  onHover,
}: OrgMenuItemProps) {
  return (
    <HStack
      as="button"
      {...orgSwitcherMenuItemStyles}
      ref={itemRef}
      role="menuitem"
      aria-current={active ? "true" : undefined}
      bg={orgSwitcherItemBg(highlighted, active)}
      _hover={{ bg: active ? "orgSwitcher.active" : "orgSwitcher.hover" }}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <OrgAvatar organization={organization} size="7" />
      <Box minW="0" flex="1">
        <Text fontSize="sm" fontWeight="medium" color="fg.primary" truncate>
          {organization.orgName}
        </Text>
        <OrgRoleLabel role={organization.role} />
      </Box>
      {active && (
        <Box color="accent.default" lineHeight="0" flexShrink="0">
          <PiCheck size={16} strokeWidth={2.5} />
        </Box>
      )}
    </HStack>
  );
}

function RetryOrganizationsAction({
  highlighted,
  itemRef,
  onClick,
  onHover,
}: {
  highlighted: boolean;
  itemRef?: (node: HTMLElement | null) => void;
  onClick: () => void;
  onHover: () => void;
}) {
  return (
    <Box
      as="button"
      {...orgSwitcherMenuItemStyles}
      ref={itemRef}
      role="menuitem"
      display="block"
      bg={orgSwitcherItemBg(highlighted)}
      color="accent.default"
      fontSize="sm"
      fontWeight="medium"
      _hover={{ bg: "orgSwitcher.hover", textDecoration: "underline" }}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      Retry
    </Box>
  );
}

export function OrgSwitcher({ collapsed = false }: OrgSwitcherProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    orgId,
    organizations,
    pendingInvitations,
    orgsStatus,
    hasOrganizations,
    switchOrg,
    isSwitching,
    refetchOrganizations,
  } = useActiveOrg();
  const { hasUnsavedChanges } = useUnsavedChangesRegistry();
  const billingQuery = useBillingSummary(orgId);
  const planTier = billingQuery.data?.subscription.planTier ?? "FREE";
  const canCreateOrg = !hasOrganizations || canCreateAdditionalOrg(planTier);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);

  const activeOrg = useMemo(
    () => organizations.find((item) => item.orgId === orgId),
    [orgId, organizations]
  );

  const sortedOrganizations = useMemo(
    () => sortOrganizationsForMenu(organizations, orgId),
    [organizations, orgId]
  );

  const showSearch = sortedOrganizations.length >= ORG_LIST_SEARCH_THRESHOLD;
  const visibleOrganizations = useMemo(
    () =>
      showSearch
        ? filterOrganizationsBySearch(sortedOrganizations, searchQuery)
        : sortedOrganizations,
    [searchQuery, showSearch, sortedOrganizations]
  );

  const pendingOrg = useMemo(
    () =>
      pendingOrgId
        ? organizations.find((item) => item.orgId === pendingOrgId)
        : undefined,
    [organizations, pendingOrgId]
  );

  const menuActions = useMemo<OrgSwitcherMenuAction[]>(() => {
    const actions: OrgSwitcherMenuAction[] = [];

    if (orgsStatus === "success") {
      for (const organization of visibleOrganizations) {
        actions.push({
          kind: "org",
          id: organization.orgId,
          label: organization.orgName,
        });
      }
    }

    if (orgsStatus === "error") {
      actions.push({ kind: "retry", id: "retry", label: "Retry" });
    }

    if (orgsStatus === "success" || orgsStatus === "error") {
      actions.push({
        kind: "create",
        id: "create",
        label: "Create organization",
        disabled: !canCreateOrg,
      });

      if (pendingInvitations.length > 0) {
        actions.push({
          kind: "invitation",
          id: "invitations",
          label: "Pending invitations",
        });
      }

      actions.push({
        kind: "manage-account",
        id: "manage-account",
        label: "Manage account",
      });
    }

    return actions;
  }, [
    canCreateOrg,
    orgsStatus,
    pendingInvitations.length,
    visibleOrganizations,
  ]);

  const actionIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    menuActions.forEach((action, index) => {
      map.set(`${action.kind}:${action.id}`, index);
    });
    return map;
  }, [menuActions]);

  const executeSwitch = useCallback(
    async (nextOrgId: string) => {
      const nextOrg = organizations.find((item) => item.orgId === nextOrgId);
      if (!nextOrg || nextOrgId === orgId || isSwitching) return;

      setMenuOpen(false);
      navigate("/projects");

      const success = await switchOrg(nextOrgId);

      if (success) {
        toast.success(`Switched to ${nextOrg.orgName}`, {
          position: "bottom-right",
          duration: 2000,
        });
      } else {
        toast.error(`Couldn't switch to ${nextOrg.orgName}. Try again.`);
      }
    },
    [isSwitching, navigate, orgId, organizations, switchOrg]
  );

  const handleSelect = useCallback(
    (nextOrgId: string) => {
      if (isSwitching) return;

      if (nextOrgId === orgId) {
        setMenuOpen(false);
        return;
      }

      setMenuOpen(false);

      if (hasUnsavedChanges) {
        setPendingOrgId(nextOrgId);
        setUnsavedDialogOpen(true);
        return;
      }

      void executeSwitch(nextOrgId);
    },
    [executeSwitch, hasUnsavedChanges, isSwitching, orgId]
  );

  const handleCreateOrganization = useCallback(() => {
    setMenuOpen(false);
    void navigate("/onboarding/create-org");
  }, [navigate]);

  const handleViewInvitations = useCallback(() => {
    setMenuOpen(false);
    void navigate("/invitations");
  }, [navigate]);

  const handleManageAccount = useCallback(() => {
    setMenuOpen(false);
    void navigate("/settings?section=profile");
  }, [navigate]);

  const handleActivate = useCallback(
    (action: OrgSwitcherMenuAction) => {
      switch (action.kind) {
        case "org":
          handleSelect(action.id);
          break;
        case "invitation":
          handleViewInvitations();
          break;
        case "create":
          if (!action.disabled) handleCreateOrganization();
          break;
        case "manage-account":
          handleManageAccount();
          break;
        case "retry":
          refetchOrganizations();
          break;
        default:
          break;
      }
    },
    [
      handleCreateOrganization,
      handleManageAccount,
      handleSelect,
      handleViewInvitations,
      refetchOrganizations,
    ]
  );

  const { highlightIndex, handleKeyDown, registerItemRef, setHighlightIndex } =
    useOrgSwitcherKeyboard({
      open: menuOpen && orgsStatus !== "loading",
      actions: menuActions,
      onActivate: handleActivate,
      onClose: () => setMenuOpen(false),
    });

  useEffect(() => {
    const openMenu = () => setMenuOpen(true);
    window.addEventListener(ORG_SWITCHER_OPEN_EVENT, openMenu);
    return () => window.removeEventListener(ORG_SWITCHER_OPEN_EVENT, openMenu);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      setSearchQuery("");
      window.requestAnimationFrame(() => menuRef.current?.focus());
    }
  }, [menuOpen]);

  const showOrgSection =
    orgsStatus === "success" && sortedOrganizations.length > 0;
  const showFooter = orgsStatus === "success" || orgsStatus === "error";

  const trigger =
    hasOrganizations && activeOrg ? (
      <OrgSwitcherTrigger
        organization={activeOrg}
        role={activeOrg.role}
        collapsed={collapsed}
      />
    ) : (
      <OrgSwitcherEmptyTrigger collapsed={collapsed} />
    );

  const resolveIndex = (kind: OrgSwitcherMenuAction["kind"], id: string) =>
    actionIndexByKey.get(`${kind}:${id}`) ?? -1;

  return (
    <>
      <Box
        w="full"
        flexShrink="0"
        borderBottomWidth="1px"
        borderColor="border.default"
      >
        <Popover.Root
          open={menuOpen}
          onOpenChange={(event) => setMenuOpen(event.open)}
          positioning={{
            placement: collapsed ? "right-start" : "bottom-start",
            gutter: collapsed ? 8 : 4,
          }}
        >
          <Popover.Trigger asChild>
            <Box
              w="full"
              onKeyDown={(event) => {
                if (
                  !menuOpen &&
                  (event.key === "ArrowDown" ||
                    event.key === "Enter" ||
                    event.key === " ")
                ) {
                  event.preventDefault();
                  setMenuOpen(true);
                }
              }}
            >
              {trigger}
            </Box>
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content
              ref={menuRef}
              tabIndex={-1}
              role="menu"
              aria-label="Organizations"
              className="rivet-org-switcher-menu"
              w="70"
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="12px"
              boxShadow="hover"
              py="2"
              px="1.5"
              zIndex="popover"
              _focusVisible={{ outline: "none" }}
              onKeyDown={handleKeyDown}
            >
              {orgsStatus === "loading" && <OrgSwitcherMenuSkeleton />}

              {orgsStatus === "error" && (
                <>
                  <OrgSwitcherMenuErrorMessage />
                  {(() => {
                    const retryIndex = resolveIndex("retry", "retry");
                    return (
                      <RetryOrganizationsAction
                        highlighted={retryIndex === highlightIndex}
                        itemRef={
                          retryIndex >= 0
                            ? registerItemRef(retryIndex)
                            : undefined
                        }
                        onClick={refetchOrganizations}
                        onHover={() => {
                          if (retryIndex >= 0) setHighlightIndex(retryIndex);
                        }}
                      />
                    );
                  })()}
                </>
              )}

              {orgsStatus === "success" && showOrgSection && (
                <>
                  <Text
                    px="3"
                    pt="1"
                    pb="2"
                    fontSize="11px"
                    fontWeight="semibold"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    color="fg.muted"
                  >
                    Your organizations
                  </Text>
                  {showSearch && (
                    <Box px="2" pb="2">
                      <Input
                        size="sm"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search organizations…"
                        borderRadius="control"
                        bg="bg.surfaceHover"
                        borderColor="border.default"
                        _focusVisible={orgSwitcherMenuItemStyles._focusVisible}
                      />
                    </Box>
                  )}
                  <Box
                    maxH={
                      sortedOrganizations.length >= ORG_LIST_SCROLL_THRESHOLD
                        ? ORG_LIST_MAX_HEIGHT
                        : undefined
                    }
                    overflowY={
                      sortedOrganizations.length >= ORG_LIST_SCROLL_THRESHOLD
                        ? "auto"
                        : undefined
                    }
                  >
                    <Stack gap="0.5">
                      {visibleOrganizations.length === 0 ? (
                        <Text px="3" py="2" fontSize="sm" color="fg.muted">
                          No organizations match your search
                        </Text>
                      ) : (
                        visibleOrganizations.map((organization) => {
                          const index = resolveIndex("org", organization.orgId);
                          return (
                            <OrgMenuItem
                              key={organization.orgId}
                              organization={organization}
                              active={organization.orgId === orgId}
                              highlighted={index === highlightIndex}
                              itemRef={
                                index >= 0 ? registerItemRef(index) : undefined
                              }
                              onSelect={() => handleSelect(organization.orgId)}
                              onHover={() => {
                                if (index >= 0) setHighlightIndex(index);
                              }}
                            />
                          );
                        })
                      )}
                    </Stack>
                  </Box>
                </>
              )}

              {showFooter && (
                <OrgSwitcherFooter
                  pendingInvitations={pendingInvitations}
                  hasOrganizations={hasOrganizations}
                  onCreateOrganization={handleCreateOrganization}
                  onViewInvitations={handleViewInvitations}
                  onManageAccount={handleManageAccount}
                  createKeyboard={{
                    highlighted:
                      resolveIndex("create", "create") === highlightIndex,
                    itemRef: registerItemRef(resolveIndex("create", "create")),
                    onHover: () =>
                      setHighlightIndex(resolveIndex("create", "create")),
                  }}
                  invitationsKeyboard={
                    pendingInvitations.length > 0
                      ? {
                          highlighted:
                            resolveIndex("invitation", "invitations") ===
                            highlightIndex,
                          itemRef: registerItemRef(
                            resolveIndex("invitation", "invitations")
                          ),
                          onHover: () =>
                            setHighlightIndex(
                              resolveIndex("invitation", "invitations")
                            ),
                        }
                      : undefined
                  }
                  manageAccountKeyboard={{
                    highlighted:
                      resolveIndex("manage-account", "manage-account") ===
                      highlightIndex,
                    itemRef: registerItemRef(
                      resolveIndex("manage-account", "manage-account")
                    ),
                    onHover: () =>
                      setHighlightIndex(
                        resolveIndex("manage-account", "manage-account")
                      ),
                  }}
                />
              )}
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </Box>

      <OrgSwitchUnsavedDialog
        open={unsavedDialogOpen}
        orgName={pendingOrg?.orgName ?? "this organization"}
        onOpenChange={(open) => {
          setUnsavedDialogOpen(open);
          if (!open) setPendingOrgId(null);
        }}
        onConfirm={() => {
          if (pendingOrgId) void executeSwitch(pendingOrgId);
          setPendingOrgId(null);
        }}
      />
    </>
  );
}
