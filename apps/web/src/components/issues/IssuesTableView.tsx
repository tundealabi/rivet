import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Menu,
  Popover,
  Portal,
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

import { useActiveOrg } from "../billing/use-active-org";
import { STATUS_OPTIONS } from "./issue-filters";
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
import type { IssueStatus } from "./IssueFilterBar";
import { IssueConflictError, issueFieldsFromUpdate } from "./issues-api";
import { EASE_OUT, stagger, transition } from "./issues-motion";
import { useUpdateIssueMutation } from "./use-issues-queries";

const PAGE_SIZE = 50;

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

function stopRowClick(e: React.SyntheticEvent) {
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
    <Menu.Root
      positioning={{
        placement: "bottom-start",
        strategy: "fixed",
        gutter: 4,
      }}
    >
      <Menu.Trigger asChild>
        <Button
          type="button"
          unstyled
          display="inline-flex"
          onClick={stopRowClick}
          onPointerDown={stopRowClick}
        >
          <StatusPill status={status} />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner style={{ zIndex: 1500 }}>
          <Menu.Content
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="control"
            boxShadow="elevated"
            p="1"
            minW="44"
            w="max-content"
            overflow="hidden"
          >
            {STATUS_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                value={option.value}
                borderRadius="control"
                fontWeight={status === option.value ? "semibold" : "normal"}
                bg={status === option.value ? "brand.subtle" : "transparent"}
                whiteSpace="nowrap"
                onClick={() => onChange(option.value)}
              >
                <HStack gap="2">
                  <Box
                    boxSize="2"
                    borderRadius="full"
                    bg={STATUS_DOT_COLOR[option.value]}
                    flexShrink="0"
                  />
                  <Text fontSize="sm">{option.label}</Text>
                </HStack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
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
    <Popover.Root
      positioning={{ placement: "bottom-start", strategy: "fixed", gutter: 4 }}
    >
      <Popover.Trigger asChild>
        <Box
          as="span"
          display="inline-flex"
          onClick={stopRowClick}
          onPointerDown={stopRowClick}
        >
          <AssigneeAvatar
            assignee={assignee}
            initials={member?.initials ?? null}
          />
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner style={{ zIndex: 1500 }}>
          <Popover.Content
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="control"
            boxShadow="hover"
            p="1"
            minW="44"
            w="max-content"
            overflow="hidden"
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
      </Portal>
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
  deleting?: boolean;
}

function BulkActionBar({
  count,
  onStatusChange,
  onAssign,
  onDelete,
  members,
  canDelete,
  deleting = false,
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
            loading={deleting}
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
  onIssuesDelete: (ids: string[]) => void | Promise<void>;
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
  const { orgId } = useActiveOrg();
  const updateMutation = useUpdateIssueMutation(orgId);
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const persistStatus = (issue: Issue, status: IssueStatus) => {
    if (status === issue.status) return;
    const previousStatus = issue.status;
    const previousUpdatedAt = issue.updatedAt;
    onIssueUpdate(issue.id, { status, updatedAt: new Date() });
    void (async () => {
      try {
        const updated = await updateMutation.mutateAsync({
          issueId: issue.id,
          input: { expectedStatus: previousStatus, status },
        });
        onIssueUpdate(issue.id, issueFieldsFromUpdate(updated));
      } catch (error) {
        onIssueUpdate(issue.id, {
          status: previousStatus,
          updatedAt: previousUpdatedAt,
        });
        toast.error(
          error instanceof IssueConflictError
            ? error.message
            : "Couldn't update status — please try again"
        );
      }
    })();
  };

  const persistAssignee = (issue: Issue, assignee: string | null) => {
    if (assignee === issue.assignee) return;
    const member = memberByName(teamMembers, assignee);
    const nextAssigneeId = assignee === null ? null : member?.id;
    const previous = {
      assignee: issue.assignee,
      assigneeId: issue.assigneeId,
      assigneeInitials: issue.assigneeInitials,
      updatedAt: issue.updatedAt,
    };
    onIssueUpdate(issue.id, {
      assignee,
      assigneeId: nextAssigneeId ?? null,
      assigneeInitials: member?.initials ?? null,
      updatedAt: new Date(),
    });

    if (assignee !== null && nextAssigneeId === undefined) {
      return;
    }

    void (async () => {
      try {
        const updated = await updateMutation.mutateAsync({
          issueId: issue.id,
          input: {
            assigneeId: nextAssigneeId ?? null,
            expectedAssigneeId: issue.assigneeId ?? null,
          },
        });
        onIssueUpdate(issue.id, issueFieldsFromUpdate(updated));
      } catch (error) {
        onIssueUpdate(issue.id, previous);
        toast.error(
          error instanceof IssueConflictError
            ? error.message
            : "Couldn't update assignee — please try again"
        );
      }
    })();
  };

  const handleBulkStatus = (status: IssueStatus) => {
    selectedIds.forEach((id) => {
      const issue = issues.find((item) => item.id === id);
      if (issue) persistStatus(issue, status);
    });
    toast.success(`Updated status for ${selectedIds.size} issues`);
    onSelectedIdsChange(new Set());
  };

  const handleBulkAssign = (assignee: string | null) => {
    selectedIds.forEach((id) => {
      const issue = issues.find((item) => item.id === id);
      if (issue) persistAssignee(issue, assignee);
    });
    toast.success(`Updated assignee for ${selectedIds.size} issues`);
    onSelectedIdsChange(new Set());
  };

  const handleBulkDelete = () => {
    setDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    const ids = [...selectedIds];
    try {
      setDeleting(true);
      await onIssuesDelete(ids);
      onSelectedIdsChange(new Set());
      setDeleteOpen(false);
    } catch {
      // Page handler already surfaced the error.
    } finally {
      setDeleting(false);
    }
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
                      onChange={(status) => persistStatus(issue, status)}
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
                        onChange={(assignee) =>
                          persistAssignee(issue, assignee)
                        }
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
          deleting={deleting}
        />
      )}

      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(e) => {
          if (!e.open && deleting) return;
          setDeleteOpen(e.open);
        }}
        placement="center"
      >
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.surface"
            borderRadius="card"
            maxW="sm"
            w="full"
            mx="4"
            boxShadow="elevated"
            animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
          >
            <Dialog.Header pt="6" px="6" pb="0">
              <Dialog.Title color="fg.primary">
                Delete {selectedIds.size}{" "}
                {selectedIds.size === 1 ? "issue" : "issues"}?
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body px="6" py="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                This cannot be undone.
              </Text>
            </Dialog.Body>
            <Dialog.Footer px="6" pb="6" pt="0" gap="3">
              <Button
                variant="outline"
                borderRadius="control"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                borderRadius="control"
                bg="status.error"
                color="white"
                loading={deleting}
                _hover={{ bg: "red.600" }}
                onClick={() => {
                  void confirmBulkDelete();
                }}
              >
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

export { PAGE_SIZE as ISSUES_PAGE_SIZE };
