import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Popover,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiChatCircleDots,
  PiTrash,
} from "react-icons/pi";

import {
  formatIssueKey,
  formatProjectIssueKey,
  formatRelativeTime,
  type Issue,
  memberByName,
  PRIORITY_BADGE_STYLE,
  STATUS_DOT_COLOR,
  type TeamMember,
} from "./issue-types";
import { type IssueStatus, STATUS_OPTIONS } from "./IssueFilterBar";
import { EASE_OUT, stagger, transition } from "./issues-motion";

const PAGE_SIZE = 50;

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

function stopRowClick(e: React.MouseEvent) {
  e.stopPropagation();
}

function StatusPill({
  status,
  onClick,
}: {
  status: IssueStatus;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <HStack
      gap="1.5"
      px="2.5"
      py="1"
      borderRadius="badge"
      bg="bg.surfaceHover"
      borderWidth="1px"
      borderColor="border.default"
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      transition={transition.base}
      _hover={
        onClick
          ? {
              bg: "bg.canvas",
              borderColor: "accent.default",
              transform: "scale(1.02)",
            }
          : undefined
      }
      flexShrink="0"
    >
      <Box boxSize="2" borderRadius="full" bg={STATUS_DOT_COLOR[status]} />
      <Text fontSize="xs" fontWeight="medium" color="fg.secondary">
        {STATUS_LABELS[status]}
      </Text>
    </HStack>
  );
}

function PriorityPill({ priority }: { priority: Issue["priority"] }) {
  const style = PRIORITY_BADGE_STYLE[priority];
  return (
    <Badge
      px="2"
      py="0.5"
      borderRadius="badge"
      bg={style.bg}
      color={style.color}
      fontSize="xs"
      fontWeight="medium"
      textTransform="capitalize"
    >
      {priority}
    </Badge>
  );
}

function AssigneeAvatar({
  assignee,
  initials,
  onClick,
}: {
  assignee: string | null;
  initials: string | null;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Flex
      boxSize="6"
      align="center"
      justify="center"
      borderRadius="full"
      borderWidth="1px"
      borderColor={assignee ? "transparent" : "border.default"}
      bg={assignee ? "brand.subtle" : "transparent"}
      color={assignee ? "accent.default" : "fg.muted"}
      fontSize="2xs"
      fontWeight="bold"
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      transition={transition.base}
      _hover={
        onClick
          ? { ring: "2px", ringColor: "brand.subtle", transform: "scale(1.08)" }
          : undefined
      }
      title={assignee ?? "Unassigned"}
      flexShrink="0"
    >
      {initials ?? ""}
    </Flex>
  );
}

function InlineStatusPicker({
  status,
  onChange,
}: {
  status: IssueStatus;
  onChange: (status: IssueStatus) => void;
}) {
  return (
    <Popover.Root positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Box as="span" display="inline-flex" onClick={stopRowClick}>
          <StatusPill status={status} />
        </Box>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          boxShadow="hover"
          p="1"
          minW="40"
          zIndex="popover"
        >
          <Stack gap="0">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                borderRadius="control"
                fontWeight={status === option.value ? "semibold" : "normal"}
                onClick={() => onChange(option.value)}
              >
                <Box
                  boxSize="2"
                  borderRadius="full"
                  bg={STATUS_DOT_COLOR[option.value]}
                  mr="2"
                />
                {option.label}
              </Button>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

function InlineAssigneePicker({
  assignee,
  members,
  onChange,
}: {
  assignee: string | null;
  members: TeamMember[];
  onChange: (assignee: string | null) => void;
}) {
  const member = memberByName(members, assignee);

  return (
    <Popover.Root positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Box as="span" display="inline-flex" onClick={stopRowClick}>
          <AssigneeAvatar
            assignee={assignee}
            initials={member?.initials ?? null}
          />
        </Box>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          boxShadow="hover"
          p="1"
          minW="44"
          zIndex="popover"
        >
          <Stack gap="0">
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              onClick={() => onChange(null)}
            >
              Unassigned
            </Button>
            {members.map((m) => (
              <Button
                key={m.name}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                borderRadius="control"
                fontWeight={assignee === m.name ? "semibold" : "normal"}
                onClick={() => onChange(m.name)}
              >
                <AssigneeAvatar assignee={m.name} initials={m.initials} />
                <Text ml="2">{m.name}</Text>
              </Button>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

interface BulkActionBarProps {
  count: number;
  onStatusChange: (status: IssueStatus) => void;
  onAssign: (assignee: string | null) => void;
  onDelete: () => void;
  members: TeamMember[];
  canDelete: boolean;
}

function BulkActionBar({
  count,
  onStatusChange,
  onAssign,
  onDelete,
  members,
  canDelete,
}: BulkActionBarProps) {
  return (
    <Flex
      position="fixed"
      bottom="6"
      left={{ base: 0, md: "16rem" }}
      right={0}
      justify="center"
      zIndex="20"
      pointerEvents="none"
      px="4"
      animation={`rivet-slide-up-bar 0.32s ${EASE_OUT} both`}
    >
      <HStack
        gap="3"
        px="4"
        py="3"
        bg="fg.primary"
        color="white"
        borderRadius="card"
        boxShadow="elevated"
        pointerEvents="auto"
        flexWrap="wrap"
        justify="center"
        backdropFilter="blur(8px)"
      >
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          {count} selected
        </Text>

        <Popover.Root positioning={{ placement: "top" }}>
          <Popover.Trigger asChild>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              Change status <PiCaretDown size={14} />
            </Button>
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="control"
              boxShadow="hover"
              p="1"
              minW="40"
            >
              <Stack gap="0">
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    justifyContent="flex-start"
                    borderRadius="control"
                    onClick={() => onStatusChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>

        <Popover.Root positioning={{ placement: "top" }}>
          <Popover.Trigger asChild>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              Assign <PiCaretDown size={14} />
            </Button>
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="control"
              boxShadow="hover"
              p="1"
              minW="44"
            >
              <Stack gap="0">
                <Button
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                  borderRadius="control"
                  onClick={() => onAssign(null)}
                >
                  Unassigned
                </Button>
                {members.map((m) => (
                  <Button
                    key={m.name}
                    variant="ghost"
                    size="sm"
                    justifyContent="flex-start"
                    borderRadius="control"
                    onClick={() => onAssign(m.name)}
                  >
                    {m.name}
                  </Button>
                ))}
              </Stack>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>

        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={onDelete}
          >
            <PiTrash size={14} /> Delete
          </Button>
        )}
      </HStack>
    </Flex>
  );
}

interface IssuesTableViewProps {
  issues: Issue[];
  teamMembers: TeamMember[];
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onIssueClick: (issue: Issue) => void;
  onIssueUpdate: (id: string, patch: Partial<Issue>) => void;
  onIssuesDelete: (ids: string[]) => void;
  canDelete: boolean;
  hideProjectColumn?: boolean;
}

export function IssuesTableView({
  issues,
  teamMembers,
  selectedIds,
  onSelectedIdsChange,
  onIssueClick,
  onIssueUpdate,
  onIssuesDelete,
  canDelete,
  hideProjectColumn = false,
}: IssuesTableViewProps) {
  const [page, setPage] = useState(1);

  const total = issues.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageIssues = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return issues.slice(start, start + PAGE_SIZE);
  }, [issues, safePage]);

  const pageIds = pageIssues.map((i) => i.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const rangeStart = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, total);

  const toggleAllOnPage = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    onSelectedIdsChange(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  };

  const handleBulkStatus = (status: IssueStatus) => {
    selectedIds.forEach((id) => {
      onIssueUpdate(id, { status, updatedAt: new Date() });
    });
    toast.success(`Updated status for ${selectedIds.size} issues`);
    onSelectedIdsChange(new Set());
  };

  const handleBulkAssign = (assignee: string | null) => {
    selectedIds.forEach((id) => {
      const member = memberByName(teamMembers, assignee);
      onIssueUpdate(id, {
        assignee,
        assigneeInitials: member?.initials ?? null,
        updatedAt: new Date(),
      });
    });
    toast.success(`Updated assignee for ${selectedIds.size} issues`);
    onSelectedIdsChange(new Set());
  };

  const handleBulkDelete = () => {
    onIssuesDelete([...selectedIds]);
    toast.success(`Deleted ${selectedIds.size} issues`);
    onSelectedIdsChange(new Set());
  };

  return (
    <>
      <Box
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="card"
        overflow="hidden"
        boxShadow="card"
        animation={`rivet-fade-in-up 0.4s ${EASE_OUT} both`}
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="bg.surface">
              <Table.ColumnHeader w="10" px="3">
                <Checkbox.Root
                  size="sm"
                  checked={somePageSelected ? "indeterminate" : allPageSelected}
                  onCheckedChange={toggleAllOnPage}
                  aria-label="Select all on page"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.ColumnHeader>
              <Table.ColumnHeader w="24">Issue ID</Table.ColumnHeader>
              <Table.ColumnHeader minW="48">Title</Table.ColumnHeader>
              {!hideProjectColumn && (
                <Table.ColumnHeader w="32">Project</Table.ColumnHeader>
              )}
              <Table.ColumnHeader w="36">Status</Table.ColumnHeader>
              <Table.ColumnHeader w="24">Priority</Table.ColumnHeader>
              <Table.ColumnHeader w="12" textAlign="center">
                Assignee
              </Table.ColumnHeader>
              <Table.ColumnHeader w="16" textAlign="center">
                Comments
              </Table.ColumnHeader>
              <Table.ColumnHeader w="24" textAlign="end" pr="4">
                Updated
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {pageIssues.map((issue, index) => {
              const isSelected = selectedIds.has(issue.id);
              return (
                <Table.Row
                  key={issue.id}
                  cursor="pointer"
                  bg={isSelected ? "brand.subtle" : "transparent"}
                  borderBottomWidth="1px"
                  borderColor="border.divider"
                  transition={transition.base}
                  animation={`rivet-fade-in-up 0.35s ${EASE_OUT} both`}
                  style={stagger(index)}
                  _hover={{
                    bg: isSelected ? "brand.subtle" : "bg.surfaceHover",
                    "& [data-issue-title]": { color: "accent.default" },
                  }}
                  onClick={() => onIssueClick(issue)}
                >
                  <Table.Cell px="3" onClick={stopRowClick}>
                    <Checkbox.Root
                      size="sm"
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(issue.id)}
                      aria-label={`Select ${issue.title}`}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs" fontFamily="mono" color="fg.muted">
                      {hideProjectColumn
                        ? formatProjectIssueKey(issue)
                        : formatIssueKey(issue.number)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell maxW="xs">
                    <Text
                      data-issue-title
                      fontSize="sm"
                      fontWeight="medium"
                      color="fg.primary"
                      truncate
                      transition={transition.fast}
                    >
                      {issue.title}
                    </Text>
                  </Table.Cell>
                  {!hideProjectColumn && (
                    <Table.Cell>
                      <Badge
                        px="2"
                        py="0.5"
                        borderRadius="badge"
                        bg="bg.surfaceHover"
                        color="fg.secondary"
                        fontSize="xs"
                        fontWeight="medium"
                        maxW="full"
                        truncate
                      >
                        {issue.projectName}
                      </Badge>
                    </Table.Cell>
                  )}
                  <Table.Cell onClick={stopRowClick}>
                    <InlineStatusPicker
                      status={issue.status}
                      onChange={(status) =>
                        onIssueUpdate(issue.id, {
                          status,
                          updatedAt: new Date(),
                        })
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <PriorityPill priority={issue.priority} />
                  </Table.Cell>
                  <Table.Cell textAlign="center" onClick={stopRowClick}>
                    <Flex justify="center">
                      <InlineAssigneePicker
                        assignee={issue.assignee}
                        members={teamMembers}
                        onChange={(assignee) => {
                          const member = memberByName(teamMembers, assignee);
                          onIssueUpdate(issue.id, {
                            assignee,
                            assigneeInitials: member?.initials ?? null,
                            updatedAt: new Date(),
                          });
                        }}
                      />
                    </Flex>
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    {issue.commentCount > 0 ? (
                      <HStack gap="1" justify="center" color="fg.muted">
                        <PiChatCircleDots size={14} />
                        <Text fontSize="xs">{issue.commentCount}</Text>
                      </HStack>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell textAlign="end" pr="4">
                    <Text fontSize="xs" color="fg.muted">
                      {formatRelativeTime(issue.updatedAt)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>

        <Flex
          align="center"
          justify="space-between"
          px="4"
          py="3"
          borderTopWidth="1px"
          borderColor="border.divider"
          bg="bg.surface"
          gap="4"
          flexWrap="wrap"
        >
          <Text fontSize="sm" color="fg.secondary">
            Showing {rangeStart}–{rangeEnd} of {total}
          </Text>
          <HStack gap="1">
            <IconButton
              aria-label="Previous page"
              variant="ghost"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <PiCaretLeft />
            </IconButton>
            <Text fontSize="sm" color="fg.secondary" px="2">
              Page {safePage} of {totalPages}
            </Text>
            <IconButton
              aria-label="Next page"
              variant="ghost"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <PiCaretRight />
            </IconButton>
          </HStack>
        </Flex>
      </Box>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onStatusChange={handleBulkStatus}
          onAssign={handleBulkAssign}
          onDelete={handleBulkDelete}
          members={teamMembers}
          canDelete={canDelete}
        />
      )}
    </>
  );
}

export { PAGE_SIZE as ISSUES_PAGE_SIZE };
