import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  Table,
  Text,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import toast from "react-hot-toast";
import {
  PiClipboard,
  PiDotsThreeVertical,
  PiPaperPlaneTilt,
  PiTrash,
} from "react-icons/pi";

import { EASE_OUT, stagger, transition } from "../issues/issues-motion";
import { canInviteMembers } from "./member-permissions";
import { inviteLink, type PendingInvite } from "./member-types";
import { formatExpiresLabel, formatSentLabel } from "./member-utils";
import { RolePill } from "./RoleDropdownPill";

const ROW_HOVER_BG = "#F5F5F6";

const ROW_MIN_H = "16";

const PENDING_SURFACE = "#FAFAFB";

function InviterAvatar({ initials }: { initials: string }) {
  return (
    <Flex
      boxSize="6"

      align="center"

      justify="center"

      borderRadius="full"

      bg="white"

      borderWidth="1px"

      borderColor="border.default"

      color="fg.muted"

      fontSize="2xs"

      fontWeight="bold"

      flexShrink="0"
    >
      {initials}
    </Flex>
  );
}

interface PendingInvitesTableViewProps {
  invites: PendingInvite[];

  actorRole: OrganizationRole;

  onRequestRevoke: (invite: PendingInvite) => void;

  onResend: (inviteId: string) => void;
}

export function PendingInvitesTableView({
  invites,

  actorRole,

  onRequestRevoke,

  onResend,
}: PendingInvitesTableViewProps) {
  const canManage = canInviteMembers(actorRole);

  if (invites.length === 0) {
    return (
      <Flex
        align="center"

        justify="center"

        py="16"

        px="6"

        borderWidth="1px"

        borderStyle="dashed"

        borderColor="border.default"

        borderRadius="card"

        bg={PENDING_SURFACE}

        animation={`rivet-fade-in-up 0.45s ${EASE_OUT} both`}
      >
        <Text fontSize="sm" color="fg.muted" fontStyle="italic">
          No pending invites
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      bg={PENDING_SURFACE}

      borderWidth="1px"

      borderStyle="dashed"

      borderColor="border.default"

      borderRadius="card"

      overflow="hidden"

      animation={`rivet-fade-in-up 0.45s ${EASE_OUT} both`}
    >
      <Box px="4" py="2.5" borderBottomWidth="1px" borderColor="border.divider">
        <Text fontSize="xs" color="fg.muted">
          Invites are single-use and expire automatically — not yet part of your
          team.
        </Text>
      </Box>

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row bg="transparent">
            <Table.ColumnHeader
              color="fg.muted"
              fontWeight="medium"
              fontSize="xs"
            >
              Email
            </Table.ColumnHeader>

            <Table.ColumnHeader
              color="fg.muted"
              fontWeight="medium"
              fontSize="xs"
            >
              Role
            </Table.ColumnHeader>

            <Table.ColumnHeader
              color="fg.muted"
              fontWeight="medium"
              fontSize="xs"
            >
              Invited by
            </Table.ColumnHeader>

            <Table.ColumnHeader
              color="fg.muted"
              fontWeight="medium"
              fontSize="xs"
            >
              Sent
            </Table.ColumnHeader>

            <Table.ColumnHeader
              color="fg.muted"
              fontWeight="medium"
              fontSize="xs"
            >
              Expires
            </Table.ColumnHeader>

            {canManage && <Table.ColumnHeader w="12" />}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {invites.map((invite, index) => {
            const expires = formatExpiresLabel(invite.expiresAt);

            const isExpired =
              invite.status === "expired" || expires.tone === "danger";

            const expiresColor =
              expires.tone === "danger"
                ? "#DC2626"
                : expires.tone === "warning"
                  ? "#D97706"
                  : "fg.muted";

            return (
              <Table.Row
                key={invite.id}

                borderBottomWidth="1px"

                borderColor="border.divider"

                _hover={{ bg: ROW_HOVER_BG }}

                transition={transition.base}

                css={stagger(index, 30)}
              >
                <Table.Cell py="4" minH={ROW_MIN_H}>
                  <HStack gap="2">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color="fg.secondary"
                      truncate
                    >
                      {invite.email}
                    </Text>

                    {isExpired && (
                      <Badge
                        px="1.5"

                        py="0"

                        borderRadius="badge"

                        bg="#FEF2F2"

                        color="#DC2626"

                        fontSize="2xs"

                        fontWeight="medium"
                      >
                        Expired
                      </Badge>
                    )}
                  </HStack>
                </Table.Cell>

                <Table.Cell py="4" minH={ROW_MIN_H}>
                  <RolePill role={invite.role} />
                </Table.Cell>

                <Table.Cell py="4" minH={ROW_MIN_H}>
                  <HStack gap="2">
                    <InviterAvatar initials={invite.invitedBy.initials} />

                    <Text fontSize="sm" color="fg.muted" truncate>
                      {invite.invitedBy.name}
                    </Text>
                  </HStack>
                </Table.Cell>

                <Table.Cell py="4" minH={ROW_MIN_H}>
                  <Text fontSize="sm" color="fg.muted">
                    {formatSentLabel(invite.sentAt)}
                  </Text>
                </Table.Cell>

                <Table.Cell py="4" minH={ROW_MIN_H}>
                  <Text
                    fontSize="sm"

                    color={expiresColor}

                    fontWeight={
                      expires.tone !== "default" ? "medium" : "normal"
                    }
                  >
                    {expires.label}
                  </Text>
                </Table.Cell>

                {canManage && (
                  <Table.Cell py="4" minH={ROW_MIN_H}>
                    <Menu.Root positioning={{ placement: "bottom-end" }}>
                      <Menu.Trigger asChild>
                        <IconButton
                          aria-label={`Actions for invite to ${invite.email}`}

                          variant="ghost"

                          size="sm"

                          borderRadius="control"

                          color="fg.muted"

                          _hover={{
                            bg: "bg.surfaceHover",
                            color: "fg.primary",
                          }}
                        >
                          <PiDotsThreeVertical />
                        </IconButton>
                      </Menu.Trigger>

                      <Menu.Positioner>
                        <Menu.Content
                          bg="bg.surface"

                          borderWidth="1px"

                          borderColor="border.default"

                          borderRadius="control"

                          boxShadow="elevated"

                          minW="44"

                          py="1"
                        >
                          <Menu.Item
                            value="resend"

                            onClick={() => {
                              onResend(invite.id);

                              toast.success(`Invite resent to ${invite.email}`);
                            }}
                          >
                            <PiPaperPlaneTilt size={16} />
                            Resend invite
                          </Menu.Item>

                          <Menu.Item
                            value="copy"

                            onClick={() => {
                              void navigator.clipboard.writeText(
                                inviteLink(invite.inviteToken)
                              );

                              toast.success("Invite link copied to clipboard");
                            }}
                          >
                            <PiClipboard size={16} />
                            Copy invite link
                          </Menu.Item>

                          <Menu.Item
                            value="revoke"

                            color="status.error"

                            _hover={{ bg: "danger.ghostHover" }}

                            onClick={() => onRequestRevoke(invite)}
                          >
                            <PiTrash size={16} />
                            Revoke invite
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
                  </Table.Cell>
                )}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
