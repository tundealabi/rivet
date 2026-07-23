import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import toast from "react-hot-toast";
import { PiSignOut } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

import { AppSidebar, useLogout } from "../components/app/AppSidebar";
import type { PendingOrgInvitation } from "../components/app/org-switcher-types";
import {
  useAcceptOrgInvitationMutation,
  useDeclineOrgInvitationMutation,
} from "../components/app/use-org-switcher-queries";
import { useUserOrganizations } from "../components/app/use-user-organizations";
import { useActiveOrg } from "../components/billing/use-active-org";
import { EASE_OUT, fadeIn } from "../components/issues/issues-motion";
import {
  ROLE_DOT_COLORS,
  ROLE_LABELS,
} from "../components/members/member-types";

function InvitationRow({ invite }: { invite: PendingOrgInvitation }) {
  const navigate = useNavigate();
  const { switchOrg } = useActiveOrg();
  const acceptInvite = useAcceptOrgInvitationMutation();
  const declineInvite = useDeclineOrgInvitationMutation();

  const busy = acceptInvite.isPending || declineInvite.isPending;

  const handleAccept = () => {
    acceptInvite.mutate(invite.invitationId, {
      onSuccess: ({ orgId, orgName }) => {
        toast.success(`Joined ${orgName}`);
        void switchOrg(orgId).then((switched) => {
          if (switched) void navigate("/projects");
        });
      },
      onError: () => toast.error("Couldn't accept invitation — try again"),
    });
  };

  const handleDecline = () => {
    declineInvite.mutate(invite.invitationId, {
      onSuccess: () => toast.success(`Declined invite to ${invite.orgName}`),
      onError: () => toast.error("Couldn't decline invitation — try again"),
    });
  };

  return (
    <Flex
      align={{ base: "stretch", md: "center" }}
      direction={{ base: "column", md: "row" }}
      gap="4"
      p="4"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      boxShadow="subtle"
    >
      <HStack gap="3" flex="1" minW="0">
        <Flex
          boxSize="10"
          align="center"
          justify="center"
          borderRadius="control"
          bg="brand.subtle"
          color="accent.default"
          fontWeight="semibold"
          fontSize="sm"
          flexShrink="0"
        >
          {invite.initials}
        </Flex>
        <Box minW="0">
          <Text fontWeight="semibold" color="fg.primary" truncate>
            {invite.orgName}
          </Text>
          <HStack gap="1.5" mt="1">
            <Box
              boxSize="1.5"
              borderRadius="full"
              bg={ROLE_DOT_COLORS[invite.role]}
            />
            <Text fontSize="sm" color="fg.secondary">
              {ROLE_LABELS[invite.role]}
            </Text>
          </HStack>
          {invite.invitedByName && (
            <Text fontSize="xs" color="fg.muted" mt="1">
              Invited by {invite.invitedByName}
            </Text>
          )}
        </Box>
      </HStack>

      <HStack gap="2" flexShrink="0">
        <Button
          variant="outline"
          size="sm"
          borderRadius="control"
          disabled={busy}
          onClick={handleDecline}
        >
          Decline
        </Button>
        <Button
          size="sm"
          borderRadius="control"
          bg="accent.default"
          color="white"
          fontWeight="semibold"
          loading={acceptInvite.isPending}
          disabled={busy}
          onClick={handleAccept}
          _hover={{ bg: "accent.hover" }}
        >
          Accept
        </Button>
      </HStack>
    </Flex>
  );
}

export default function InvitationsPage() {
  const logout = useLogout();
  const menuQuery = useUserOrganizations();
  const invites = menuQuery.data?.pendingInvitations ?? [];

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />

      <Box flex="1" minW="0" overflow="auto">
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={{ base: "5", md: "10" }}
          py="5"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
          animation={`rivet-fade-in 0.4s ${EASE_OUT} both`}
        >
          <Box>
            <Heading
              size="xl"
              color="fg.primary"
              letterSpacing="-0.03em"
              fontWeight="semibold"
            >
              Pending invitations
            </Heading>
            <Text fontSize="sm" color="fg.secondary" mt="1">
              Accept or decline invites from other organizations
            </Text>
          </Box>

          <Button
            variant="outline"
            size="sm"
            borderRadius="control"
            borderColor="status.error"
            color="status.error"
            display={{ base: "inline-flex", md: "none" }}
            onClick={logout}
          >
            <PiSignOut size={16} />
            Log out
          </Button>
        </Flex>

        <Box px={{ base: "5", md: "10" }} py="8" maxW="3xl" {...fadeIn}>
          {menuQuery.isLoading ? (
            <Text color="fg.muted" fontSize="sm">
              Loading invitations…
            </Text>
          ) : invites.length === 0 ? (
            <Box
              p="8"
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="card"
              bg="bg.surface"
              textAlign="center"
            >
              <Text fontWeight="medium" color="fg.primary">
                No pending invitations
              </Text>
              <Text fontSize="sm" color="fg.muted" mt="2">
                When someone invites you to their organization, it will show up
                here.
              </Text>
            </Box>
          ) : (
            <Stack gap="3">
              {invites.map((invite) => (
                <InvitationRow key={invite.invitationId} invite={invite} />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
