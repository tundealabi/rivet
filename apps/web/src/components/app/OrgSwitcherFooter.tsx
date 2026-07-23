import {
  Badge,
  Box,
  Flex,
  HStack,
  Link,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { PiEnvelopeSimple, PiPlusCircle } from "react-icons/pi";

import { useActiveOrg } from "../billing/use-active-org";
import { useBillingSummary } from "../billing/use-billing-queries";
import { MOCK_USER_PROFILE } from "../settings/mock-profile-data";
import { useUserProfile } from "../settings/use-profile-settings-queries";
import { canCreateAdditionalOrg } from "./org-switcher-permissions";
import type { PendingOrgInvitation } from "./org-switcher-types";
import {
  orgSwitcherItemBg,
  orgSwitcherMenuItemFocusRing,
} from "./org-switcher-ui";

interface FooterRowKeyboardProps {
  highlighted: boolean;
  itemRef?: (node: HTMLElement | null) => void;
  onHover: () => void;
}

interface FooterActionRowProps extends FooterRowKeyboardProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
  hint?: string;
}

function FooterActionRow({
  icon,
  label,
  onClick,
  disabled = false,
  tooltip,
  hint,
  highlighted,
  itemRef,
  onHover,
}: FooterActionRowProps) {
  const content = (
    <Box
      as="button"
      ref={itemRef}
      role="menuitem"
      display="flex"
      alignItems="center"
      w="full"
      px="3"
      py="2.5"
      gap="2.5"
      border="none"
      borderRadius="control"
      bg={orgSwitcherItemBg(highlighted)}
      cursor={disabled ? "not-allowed" : "pointer"}
      color="fg.secondary"
      fontSize="sm"
      fontWeight="medium"
      textDecoration="none"
      opacity={disabled ? 0.72 : 1}
      aria-disabled={disabled || undefined}
      transition="background 0.12s ease, color 0.12s ease"
      _hover={
        disabled
          ? undefined
          : {
              bg: "orgSwitcher.hover",
              color: "fg.primary",
              textDecoration: "none",
            }
      }
      _focusVisible={orgSwitcherMenuItemFocusRing}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={onHover}
    >
      <Flex
        boxSize="7"
        align="center"
        justify="center"
        borderRadius="full"
        borderWidth="1px"
        borderColor="border.default"
        color="fg.muted"
        flexShrink="0"
      >
        {icon}
      </Flex>
      <Box flex="1" minW="0" textAlign="left">
        {label}
        {hint && (
          <Text fontSize="xs" color="fg.muted" mt="0.5">
            {hint}
          </Text>
        )}
      </Box>
    </Box>
  );

  if (disabled && tooltip) {
    return (
      <Tooltip.Root openDelay={200}>
        <Tooltip.Trigger asChild>
          <Box as="span" display="block" w="full">
            {content}
          </Box>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content
            bg="fg.primary"
            color="white"
            px="3"
            py="2"
            borderRadius="control"
            fontSize="sm"
            maxW="xs"
          >
            {tooltip}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    );
  }

  return content;
}

function UserIdentityRow({
  name,
  initials,
  onManageAccount,
  highlighted,
  itemRef,
  onHover,
}: {
  name: string;
  initials: string;
  onManageAccount: () => void;
  highlighted: boolean;
  itemRef?: (node: HTMLElement | null) => void;
  onHover: () => void;
}) {
  return (
    <Box px="3" py="2.5">
      <HStack gap="2.5" align="center">
        <Flex
          boxSize="5"
          align="center"
          justify="center"
          borderRadius="full"
          bg="brand.subtle"
          color="accent.default"
          fontWeight="semibold"
          fontSize="2xs"
          flexShrink="0"
        >
          {initials}
        </Flex>
        <Box minW="0" flex="1">
          <Text fontSize="sm" color="fg.muted" truncate>
            {name}
          </Text>
        </Box>
      </HStack>
      <Link
        as="button"
        ref={itemRef}
        role="menuitem"
        mt="1.5"
        ml="7"
        fontSize="xs"
        fontWeight="medium"
        color={highlighted ? "accent.default" : "fg.muted"}
        textDecoration="none"
        border="none"
        bg={highlighted ? "orgSwitcher.highlighted" : "transparent"}
        borderRadius="sm"
        cursor="pointer"
        p="1"
        _hover={{ color: "accent.default", textDecoration: "underline" }}
        _focusVisible={orgSwitcherMenuItemFocusRing}
        onClick={onManageAccount}
        onMouseEnter={onHover}
      >
        Manage account
      </Link>
    </Box>
  );
}

interface OrgSwitcherFooterProps {
  pendingInvitations: PendingOrgInvitation[];
  hasOrganizations: boolean;
  onCreateOrganization: () => void;
  onViewInvitations: () => void;
  onManageAccount: () => void;
  createKeyboard: FooterRowKeyboardProps;
  invitationsKeyboard?: FooterRowKeyboardProps;
  manageAccountKeyboard: FooterRowKeyboardProps;
}

export function OrgSwitcherFooter({
  pendingInvitations,
  hasOrganizations,
  onCreateOrganization,
  onViewInvitations,
  onManageAccount,
  createKeyboard,
  invitationsKeyboard,
  manageAccountKeyboard,
}: OrgSwitcherFooterProps) {
  const { orgId } = useActiveOrg();
  const billingQuery = useBillingSummary(orgId);
  const profileQuery = useUserProfile();

  const planTier = billingQuery.data?.subscription.planTier ?? "FREE";
  const canCreate = !hasOrganizations || canCreateAdditionalOrg(planTier);
  const inviteCount = pendingInvitations.length;

  const fullName = profileQuery.data?.fullName ?? MOCK_USER_PROFILE.fullName;
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box pt="1">
      <Box h="px" bg="border.divider" mx="2" mb="1" />

      <FooterActionRow
        icon={<PiPlusCircle size={16} />}
        label="Create organization"
        hint={!canCreate && hasOrganizations ? "Team plan required" : undefined}
        onClick={onCreateOrganization}
        disabled={!canCreate}
        tooltip={
          !canCreate ? "Upgrade to create more organizations" : undefined
        }
        {...createKeyboard}
      />

      {inviteCount > 0 && invitationsKeyboard && (
        <FooterActionRow
          icon={<PiEnvelopeSimple size={16} />}
          label={
            <HStack gap="2" justify="space-between" w="full">
              <Text as="span" color="fg.secondary">
                Pending invitations
              </Text>
              <Badge
                borderRadius="badge"
                px="2"
                py="0.5"
                fontSize="xs"
                fontWeight="semibold"
                bg="brand.subtle"
                color="accent.default"
              >
                {inviteCount}
              </Badge>
            </HStack>
          }
          onClick={onViewInvitations}
          {...invitationsKeyboard}
        />
      )}

      <Box h="px" bg="border.divider" mx="2" my="1" />

      <UserIdentityRow
        name={fullName}
        initials={initials}
        onManageAccount={onManageAccount}
        {...manageAccountKeyboard}
      />
    </Box>
  );
}
