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
import { useEffect, useMemo, useState } from "react";
import {
  PiArrowsDownUp,
  PiCaretLeft,
  PiCaretRight,
  PiDotsThreeVertical,
  PiEye,
  PiSwap,
  PiTrash,
} from "react-icons/pi";

import { EASE_OUT, stagger, transition } from "../issues/issues-motion";
import {
  canChangeMemberRole,
  canRemoveMember,
  canShowTransferTo,
  canViewMemberActions,
  isCurrentUser,
} from "./member-permissions";
import {
  memberDisplayName,
  type OrgMember,
  ROLE_DOT_COLORS,
} from "./member-types";
import {
  filterMembers,
  formatJoinedLabel,
  formatLastActiveLabel,
  type MemberRoleFilter,
  type MemberSortField,
  type SortDirection,
  sortMembers,
} from "./member-utils";
import {
  MembersSearchEmptyState,
  MembersSoloBanner,
} from "./MembersPageStates";
import { MembersToolbar } from "./MembersToolbar";
import { RoleDropdownPill } from "./RoleDropdownPill";

const PAGE_SIZE = 50;
const ROW_HOVER_BG = "#F8F9FA";
const OWNER_ROW_BG = "#FAFAFB";
const ROW_MIN_H = "16";

function MemberAvatar({ initials }: { initials: string }) {
  return (
    <Flex
      boxSize="8"
      align="center"
      justify="center"
      borderRadius="full"
      bg="brand.subtle"
      color="accent.default"
      fontSize="xs"
      fontWeight="bold"
      flexShrink="0"
    >
      {initials}
    </Flex>
  );
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: MemberSortField;
  activeField: MemberSortField;
  direction: SortDirection;
  onSort: (field: MemberSortField) => void;
}) {
  const active = activeField === field;
  return (
    <Table.ColumnHeader
      color="fg.muted"
      fontWeight="medium"
      fontSize="xs"
      cursor="pointer"
      userSelect="none"
      onClick={() => onSort(field)}
      _hover={{ color: "fg.primary" }}
    >
      <HStack gap="1" display="inline-flex">
        <Text>{label}</Text>
        {active && (
          <Box
            color="accent.default"
            transform={direction === "desc" ? "rotate(180deg)" : undefined}
          >
            <PiArrowsDownUp size={12} />
          </Box>
        )}
      </HStack>
    </Table.ColumnHeader>
  );
}

interface MembersTableViewProps {
  members: OrgMember[];
  actorRole: OrganizationRole;
  currentUserId: string;
  onRoleChange: (
    memberId: string,
    role: OrganizationRole
  ) => void | Promise<void>;
  onRemove: (memberId: string) => void;
  onTransferOwnership: (memberId: string) => void;
  onViewProfile: (member: OrgMember) => void;
  onInvite?: () => void;
  canInvite?: boolean;
}

export function MembersTableView({
  members,
  actorRole,
  currentUserId,
  onRoleChange,
  onRemove,
  onTransferOwnership,
  onViewProfile,
  onInvite,
  canInvite = false,
}: MembersTableViewProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all");
  const [sortField, setSortField] = useState<MemberSortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useSafePage(0);

  const filtered = useMemo(
    () =>
      sortMembers(
        filterMembers(members, search, roleFilter),
        sortField,
        sortDirection
      ),
    [members, search, roleFilter, sortField, sortDirection]
  );

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, sortField, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageMembers = filtered.slice(start, start + PAGE_SIZE);

  const handleSort = (field: MemberSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const rangeLabel =
    filtered.length === 0
      ? "0 members"
      : `${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`;

  const isSoloOrg =
    members.length === 1 && isCurrentUser(members[0], currentUserId);
  const searchQuery = search.trim();
  const showActionsColumn = canViewMemberActions(actorRole);
  const columnCount = showActionsColumn ? 5 : 4;

  return (
    <Box animation={`rivet-fade-in-up 0.45s ${EASE_OUT} both`}>
      <MembersToolbar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      <Box
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="card"
        overflow="hidden"
        boxShadow="card"
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="bg.canvas">
              <SortableHeader
                label="Member"
                field="name"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <Table.ColumnHeader
                color="fg.muted"
                fontWeight="medium"
                fontSize="xs"
              >
                Role
              </Table.ColumnHeader>
              <SortableHeader
                label="Joined"
                field="joined"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Last active"
                field="lastActive"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              {showActionsColumn && <Table.ColumnHeader w="12" />}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {pageMembers.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={columnCount} py="10" textAlign="center">
                  {searchQuery ? (
                    <MembersSearchEmptyState query={searchQuery} />
                  ) : (
                    <Text fontSize="sm" color="fg.muted">
                      No members match your filters.
                    </Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ) : (
              pageMembers.map((member, index) => {
                const name = memberDisplayName(member);
                const isSelf = isCurrentUser(member, currentUserId);
                const isOwner = member.role === OrganizationRole.OWNER;
                const canEditRole = canChangeMemberRole(
                  actorRole,
                  member,
                  currentUserId
                );
                const canRemove = canRemoveMember(
                  actorRole,
                  member,
                  currentUserId
                );
                const canTransfer = canShowTransferTo(
                  actorRole,
                  member,
                  currentUserId
                );

                return (
                  <Table.Row
                    key={member.id}
                    bg={isOwner ? OWNER_ROW_BG : undefined}
                    borderBottomWidth="1px"
                    borderColor="border.divider"
                    _hover={{ bg: ROW_HOVER_BG }}
                    transition={transition.base}
                    css={stagger(index, 30)}
                  >
                    <Table.Cell py="4" minH={ROW_MIN_H}>
                      <HStack gap="3">
                        <MemberAvatar initials={member.initials} />
                        <Box minW="0">
                          <HStack gap="2" flexWrap="wrap">
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color="fg.primary"
                              truncate
                            >
                              {name}
                            </Text>
                            {isSelf && (
                              <Badge
                                px="1.5"
                                py="0"
                                borderRadius="badge"
                                bg="bg.surfaceHover"
                                color="fg.muted"
                                fontSize="2xs"
                                fontWeight="medium"
                              >
                                You
                              </Badge>
                            )}
                            {isOwner && (
                              <HStack gap="1" flexShrink="0">
                                <Box
                                  boxSize="1.5"
                                  borderRadius="full"
                                  bg={ROLE_DOT_COLORS[OrganizationRole.OWNER]}
                                />
                                <Text
                                  fontSize="2xs"
                                  color="fg.muted"
                                  fontWeight="medium"
                                >
                                  Owner
                                </Text>
                              </HStack>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="fg.muted" truncate>
                            {member.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell py="4" minH={ROW_MIN_H}>
                      <RoleDropdownPill
                        role={member.role}
                        actorRole={actorRole}
                        locked={
                          !canEditRole || member.role === OrganizationRole.OWNER
                        }
                        onChange={
                          canEditRole
                            ? (role) => {
                                void onRoleChange(member.id, role);
                              }
                            : undefined
                        }
                      />
                    </Table.Cell>
                    <Table.Cell py="4" minH={ROW_MIN_H}>
                      <Text fontSize="sm" color="fg.muted">
                        {formatJoinedLabel(member.joinedAt)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py="4" minH={ROW_MIN_H}>
                      <Text fontSize="sm" color="fg.muted">
                        {formatLastActiveLabel(member.lastActiveAt)}
                      </Text>
                    </Table.Cell>
                    {showActionsColumn && (
                      <Table.Cell py="4" minH={ROW_MIN_H}>
                        <Menu.Root positioning={{ placement: "bottom-end" }}>
                          <Menu.Trigger asChild>
                            <IconButton
                              aria-label={`Actions for ${name}`}
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
                                value="profile"
                                onClick={() => onViewProfile(member)}
                              >
                                <PiEye size={16} />
                                View profile
                              </Menu.Item>
                              {canTransfer && (
                                <Menu.Item
                                  value="transfer"
                                  onClick={() => onTransferOwnership(member.id)}
                                >
                                  <PiSwap size={16} />
                                  Transfer ownership
                                </Menu.Item>
                              )}
                              {canRemove && (
                                <Menu.Item
                                  value="remove"
                                  color="status.error"
                                  _hover={{ bg: "danger.ghostHover" }}
                                  onClick={() => onRemove(member.id)}
                                >
                                  <PiTrash size={16} />
                                  Remove from organization
                                </Menu.Item>
                              )}
                              {isSelf && isOwner && (
                                <Menu.Item
                                  value="leave"
                                  opacity="0.55"
                                  cursor="default"
                                >
                                  Leave organization (transfer ownership first)
                                </Menu.Item>
                              )}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Menu.Root>
                      </Table.Cell>
                    )}
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>

        {filtered.length > PAGE_SIZE && (
          <Flex
            align="center"
            justify="space-between"
            px="4"
            py="3"
            borderTopWidth="1px"
            borderColor="border.divider"
            bg="bg.canvas"
          >
            <Text fontSize="xs" color="fg.muted">
              {rangeLabel}
            </Text>
            <HStack gap="1">
              <IconButton
                aria-label="Previous page"
                variant="ghost"
                size="sm"
                borderRadius="control"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <PiCaretLeft />
              </IconButton>
              <IconButton
                aria-label="Next page"
                variant="ghost"
                size="sm"
                borderRadius="control"
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                <PiCaretRight />
              </IconButton>
            </HStack>
          </Flex>
        )}
      </Box>

      {isSoloOrg && onInvite && (
        <MembersSoloBanner onInvite={onInvite} canInvite={canInvite} />
      )}
    </Box>
  );
}

function useSafePage(_memberCount: number): [number, (page: number) => void] {
  const [page, setPage] = useState(1);
  return [page, setPage];
}
