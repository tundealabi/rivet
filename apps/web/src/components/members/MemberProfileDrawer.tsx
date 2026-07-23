import { Drawer, Flex, HStack, Stack, Text } from "@chakra-ui/react";

import { formatDateLong } from "../issues/issue-types";
import type { OrgMember } from "./member-types";
import { memberDisplayName } from "./member-types";
import {
  countAssignedIssues,
  formatJoinedLabel,
  formatLastActiveLabel,
} from "./member-utils";
import { RolePill } from "./RoleDropdownPill";

interface MemberProfileDrawerProps {
  member: OrgMember | null;
  open: boolean;
  onClose: () => void;
}

export function MemberProfileDrawer({
  member,
  open,
  onClose,
}: MemberProfileDrawerProps) {
  if (!member) return null;

  const name = memberDisplayName(member);
  const assignedCount = countAssignedIssues(member.id);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      placement="end"
      size="sm"
    >
      <Drawer.Backdrop bg="blackAlpha.500" backdropFilter="blur(3px)" />
      <Drawer.Positioner>
        <Drawer.Content bg="bg.surface">
          <Drawer.Header borderBottomWidth="1px" borderColor="border.default">
            <Drawer.Title color="fg.primary">Member profile</Drawer.Title>
            <Drawer.CloseTrigger />
          </Drawer.Header>
          <Drawer.Body py="6">
            <Stack gap="6">
              <HStack gap="3">
                <Flex
                  boxSize="12"
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bg="brand.subtle"
                  color="accent.default"
                  fontWeight="bold"
                >
                  {member.initials}
                </Flex>
                <Stack gap="0.5">
                  <Text fontWeight="semibold" color="fg.primary">
                    {name}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {member.email}
                  </Text>
                </Stack>
              </HStack>

              <Stack gap="3">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="fg.muted">
                    Role
                  </Text>
                  <RolePill role={member.role} />
                </HStack>
                <HStack justify="space-between" align="flex-start">
                  <Text fontSize="sm" color="fg.muted">
                    Joined
                  </Text>
                  <Text fontSize="sm" color="fg.secondary" textAlign="right">
                    {formatJoinedLabel(member.joinedAt)}
                    <br />
                    {formatDateLong(member.joinedAt)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="fg.muted">
                    Last active
                  </Text>
                  <Text fontSize="sm" color="fg.secondary">
                    {formatLastActiveLabel(member.lastActiveAt)}
                  </Text>
                </HStack>
              </Stack>

              <ProfileSection
                title="Issues assigned"
                value={`${assignedCount} open`}
              />
              <ProfileSection
                title="Recent activity"
                value={
                  member.lastActiveAt
                    ? `Last seen ${formatLastActiveLabel(member.lastActiveAt).toLowerCase()}`
                    : "No recent activity"
                }
              />
            </Stack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

function ProfileSection({ title, value }: { title: string; value: string }) {
  return (
    <Stack
      gap="1"
      p="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.canvas"
    >
      <Text
        fontSize="xs"
        fontWeight="medium"
        color="fg.muted"
        textTransform="uppercase"
      >
        {title}
      </Text>
      <Text fontSize="sm" color="fg.primary">
        {value}
      </Text>
    </Stack>
  );
}
