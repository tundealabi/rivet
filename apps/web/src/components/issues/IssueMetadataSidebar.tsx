import {
  Box,
  Button,
  Collapsible,
  Flex,
  HStack,
  IconButton,
  Input,
  Popover,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PiCaretDown, PiCaretUp, PiPlus, PiX } from "react-icons/pi";
import { Link as RouterLink } from "react-router-dom";

import { createActivityEvent } from "./issue-activity";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "./issue-filters";
import {
  formatDateLong,
  formatDueDate,
  formatRelativeTime,
  isIssueOverdue,
  type Issue,
  type IssueActivityEvent,
  type IssueLabel,
  memberByName,
  PRIORITY_DOT_COLOR,
  STATUS_DOT_COLOR,
  type TeamMember,
} from "./issue-types";
import type { IssuePriority, IssueStatus } from "./IssueFilterBar";
import { updateIssuePatchMock, updateIssueStatusApi } from "./issues-api";
import { EASE_OUT, transition } from "./issues-motion";

function SidebarRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      align="center"
      justify="space-between"
      gap="3"
      py="3"
      borderBottomWidth="1px"
      borderColor="border.divider"
      minH="10"
    >
      <Text
        fontSize="xs"
        color="fg.muted"
        fontWeight="medium"
        flexShrink="0"
        minW="20"
      >
        {label}
      </Text>
      <Box flex="1" display="flex" justifyContent="flex-end" minW="0">
        {children}
      </Box>
    </Flex>
  );
}

function Dot({ color }: { color: string }) {
  return <Box boxSize="2" borderRadius="full" bg={color} flexShrink="0" />;
}

function MemberAvatar({
  initials,
  empty,
}: {
  initials?: string | null;
  empty?: boolean;
}) {
  if (empty || !initials) {
    return (
      <Box
        boxSize="5"
        borderRadius="full"
        borderWidth="1px"
        borderColor="border.default"
        borderStyle="dashed"
        flexShrink="0"
      />
    );
  }
  return (
    <Flex
      boxSize="5"
      align="center"
      justify="center"
      borderRadius="full"
      bg="brand.subtle"
      color="accent.default"
      fontSize="2xs"
      fontWeight="bold"
      flexShrink="0"
    >
      {initials}
    </Flex>
  );
}

function RowTrigger({
  editable,
  children,
  onClick,
}: {
  editable: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (!editable) {
    return <>{children}</>;
  }

  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      bg="transparent"
      border="none"
      cursor="pointer"
      p="1"
      m="-1"
      borderRadius="control"
      transition={transition.base}
      _hover={{ bg: "bg.surfaceHover" }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
}

function StatusValue({
  status,
  editable,
  onChange,
  openControl,
}: {
  status: IssueStatus;
  editable: boolean;
  onChange: (status: IssueStatus) => void;
  openControl?: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openControl?.open ?? internalOpen;
  const setOpen = openControl?.onOpenChange ?? setInternalOpen;
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;

  const content = (
    <HStack gap="2" cursor={editable ? "pointer" : "default"}>
      <Dot color={STATUS_DOT_COLOR[status]} />
      <Text fontSize="sm" color="fg.primary">
        {label}
      </Text>
    </HStack>
  );

  if (!editable) return content;

  return (
    <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Popover.Trigger asChild>
        <RowTrigger editable={editable}>{content}</RowTrigger>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderRadius="control"
          borderWidth="1px"
          borderColor="border.default"
          boxShadow="elevated"
          p="1"
          minW="40"
          animation={`rivet-scale-in 0.2s ${EASE_OUT} both`}
        >
          <Stack gap="0.5">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                borderRadius="control"
                onClick={() => {
                  setOpen(false);
                  onChange(option.value);
                }}
              >
                <HStack gap="2">
                  <Dot color={STATUS_DOT_COLOR[option.value]} />
                  <Text>{option.label}</Text>
                </HStack>
              </Button>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

function PriorityValue({
  priority,
  editable,
  onChange,
  openControl,
}: {
  priority: IssuePriority;
  editable: boolean;
  onChange: (priority: IssuePriority) => void;
  openControl?: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openControl?.open ?? internalOpen;
  const setOpen = openControl?.onOpenChange ?? setInternalOpen;
  const label =
    PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;

  const content = (
    <HStack gap="2" cursor={editable ? "pointer" : "default"}>
      <Dot color={PRIORITY_DOT_COLOR[priority]} />
      <Text fontSize="sm" color="fg.primary">
        {label}
      </Text>
    </HStack>
  );

  if (!editable) return content;

  return (
    <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Popover.Trigger asChild>
        <RowTrigger editable={editable}>{content}</RowTrigger>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderRadius="control"
          borderWidth="1px"
          borderColor="border.default"
          boxShadow="elevated"
          p="1"
          minW="36"
          animation={`rivet-scale-in 0.2s ${EASE_OUT} both`}
        >
          <Stack gap="0.5">
            {PRIORITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                borderRadius="control"
                onClick={() => {
                  setOpen(false);
                  onChange(option.value);
                }}
              >
                <HStack gap="2">
                  <Dot color={PRIORITY_DOT_COLOR[option.value]} />
                  <Text>{option.label}</Text>
                </HStack>
              </Button>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

function AssigneePicker({
  assignee,
  assigneeInitials,
  editable,
  teamMembers,
  currentUser,
  onChange,
  openControl,
}: {
  assignee: string | null;
  assigneeInitials: string | null;
  editable: boolean;
  teamMembers: TeamMember[];
  currentUser: string;
  onChange: (name: string | null) => void;
  openControl?: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openControl?.open ?? internalOpen;
  const setOpen = openControl?.onOpenChange ?? setInternalOpen;
  const [search, setSearch] = useState("");

  const filtered = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <HStack gap="2">
      <MemberAvatar initials={assigneeInitials} empty={!assignee} />
      <Text fontSize="sm" color="fg.primary">
        {assignee ?? "Unassigned"}
      </Text>
    </HStack>
  );

  if (!editable) return content;

  const pick = (name: string | null) => {
    setOpen(false);
    setSearch("");
    onChange(name);
  };

  return (
    <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Popover.Trigger asChild>
        <RowTrigger editable={editable}>{content}</RowTrigger>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderRadius="control"
          borderWidth="1px"
          borderColor="border.default"
          boxShadow="elevated"
          p="2"
          minW="52"
          animation={`rivet-scale-in 0.2s ${EASE_OUT} both`}
        >
          <Stack gap="1">
            <Button
              size="sm"
              variant="ghost"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="semibold"
              color="accent.default"
              onClick={() => pick(currentUser)}
            >
              Assign to me
            </Button>
            <Input
              size="sm"
              placeholder="Search members…"
              borderRadius="control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              mb="1"
            />
            <Button
              size="sm"
              variant="ghost"
              justifyContent="flex-start"
              borderRadius="control"
              onClick={() => pick(null)}
            >
              Unassigned
            </Button>
            {filtered.map((member) => (
              <Button
                key={member.name}
                size="sm"
                variant="ghost"
                justifyContent="flex-start"
                borderRadius="control"
                onClick={() => pick(member.name)}
              >
                <HStack gap="2">
                  <MemberAvatar initials={member.initials} />
                  <Text>{member.name}</Text>
                </HStack>
              </Button>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

function LabelPill({
  label,
  editable,
  onRemove,
}: {
  label: IssueLabel;
  editable: boolean;
  onRemove: () => void;
}) {
  return (
    <HStack
      gap="1"
      px="2"
      py="0.5"
      borderRadius="badge"
      bg={label.color}
      fontSize="xs"
      fontWeight="medium"
      color="fg.primary"
    >
      <Text>{label.name}</Text>
      {editable && (
        <IconButton
          aria-label={`Remove ${label.name}`}
          size="2xs"
          variant="ghost"
          minW="auto"
          h="auto"
          p="0"
          onClick={onRemove}
        >
          <PiX size={10} />
        </IconButton>
      )}
    </HStack>
  );
}

function DueDateValue({
  dueDate,
  overdue,
  editable,
  onChange,
}: {
  dueDate: Date | null;
  overdue: boolean;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const color = overdue ? "status.error" : "fg.primary";

  if (!editable) {
    return (
      <Text fontSize="sm" color={color}>
        {dueDate ? formatDueDate(dueDate) : "None"}
      </Text>
    );
  }

  if (editing) {
    return (
      <Input
        type="date"
        size="sm"
        w="auto"
        borderRadius="control"
        fontSize="sm"
        color={color}
        autoFocus
        value={dueDate ? dueDate.toISOString().slice(0, 10) : ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
      />
    );
  }

  return (
    <RowTrigger editable onClick={() => setEditing(true)}>
      <Text fontSize="sm" color={color}>
        {dueDate ? formatDueDate(dueDate) : "None"}
      </Text>
    </RowTrigger>
  );
}

interface IssueMetadataSidebarProps {
  issue: Issue;
  editable: boolean;
  currentUser: string;
  teamMembers: TeamMember[];
  watching: boolean;
  onUpdate: (id: string, patch: Partial<Issue>) => void;
  onAddActivity: (issueId: string, event: IssueActivityEvent) => void;
  onToggleWatch: () => void;
  onNavigateToProject?: () => void;
  collapsible?: boolean;
  pickerOpen?: {
    status: { open: boolean; onOpenChange: (open: boolean) => void };
    priority: { open: boolean; onOpenChange: (open: boolean) => void };
    assignee: { open: boolean; onOpenChange: (open: boolean) => void };
  };
}

export function IssueMetadataSidebar({
  issue,
  editable,
  currentUser,
  teamMembers,
  watching,
  onUpdate,
  onAddActivity,
  onToggleWatch,
  onNavigateToProject,
  collapsible = false,
  pickerOpen,
}: IssueMetadataSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const overdue = isIssueOverdue(issue);

  const changeStatus = (status: IssueStatus) => {
    if (status === issue.status) return;
    const fromStatus = issue.status;
    onUpdate(issue.id, { status, updatedAt: new Date() });
    onAddActivity(
      issue.id,
      createActivityEvent({
        type: "status_changed",
        actor: currentUser,
        fromStatus,
        toStatus: status,
        createdAt: new Date(),
      })
    );
    void (async () => {
      try {
        await updateIssueStatusApi(issue.id, status);
      } catch {
        onUpdate(issue.id, { status: fromStatus, updatedAt: new Date() });
        toast.error("Couldn't update status — please try again");
      }
    })();
  };

  const changePriority = (priority: IssuePriority) => {
    if (priority === issue.priority) return;
    const fromPriority = issue.priority;
    onUpdate(issue.id, { priority, updatedAt: new Date() });
    onAddActivity(
      issue.id,
      createActivityEvent({
        type: "priority_changed",
        actor: currentUser,
        fromPriority,
        toPriority: priority,
        createdAt: new Date(),
      })
    );
    void (async () => {
      try {
        await updateIssuePatchMock(issue.id, { priority });
      } catch {
        onUpdate(issue.id, { priority: fromPriority, updatedAt: new Date() });
        toast.error("Couldn't update priority — please try again");
      }
    })();
  };

  const changeAssignee = (name: string | null) => {
    if (name === issue.assignee) return;
    const member = memberByName(teamMembers, name);
    onUpdate(issue.id, {
      assignee: name,
      assigneeInitials: member?.initials ?? null,
      updatedAt: new Date(),
    });
    onAddActivity(
      issue.id,
      createActivityEvent({
        type: "assignee_changed",
        actor: currentUser,
        fromAssignee: issue.assignee,
        toAssignee: name,
        createdAt: new Date(),
      })
    );
  };

  const changeDueDate = (value: string) => {
    onUpdate(issue.id, {
      dueDate: value ? new Date(value) : null,
      updatedAt: new Date(),
    });
  };

  const addLabel = () => {
    const name = window.prompt("Label name");
    if (!name?.trim()) return;
    const label: IssueLabel = {
      id: crypto.randomUUID(),
      name: name.trim().toLowerCase(),
      color: "#E0E7FF",
    };
    onUpdate(issue.id, {
      labels: [...issue.labels, label],
      updatedAt: new Date(),
    });
    toast.success("Label added");
  };

  const removeLabel = (labelId: string) => {
    onUpdate(issue.id, {
      labels: issue.labels.filter((l) => l.id !== labelId),
      updatedAt: new Date(),
    });
  };

  const sidebarBody = (
    <Box px="4" py="2">
      <SidebarRow label="Status">
        <StatusValue
          status={issue.status}
          editable={editable}
          onChange={changeStatus}
          openControl={pickerOpen?.status}
        />
      </SidebarRow>

      <SidebarRow label="Priority">
        <PriorityValue
          priority={issue.priority}
          editable={editable}
          onChange={changePriority}
          openControl={pickerOpen?.priority}
        />
      </SidebarRow>

      <SidebarRow label="Assignee">
        <AssigneePicker
          assignee={issue.assignee}
          assigneeInitials={issue.assigneeInitials}
          editable={editable}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onChange={changeAssignee}
          openControl={pickerOpen?.assignee}
        />
      </SidebarRow>

      <SidebarRow label="Reporter">
        <HStack gap="2">
          <MemberAvatar initials={issue.reporterInitials} />
          <Text fontSize="sm" color="fg.primary">
            {issue.reporter}
          </Text>
        </HStack>
      </SidebarRow>

      <SidebarRow label="Due date">
        <DueDateValue
          dueDate={issue.dueDate}
          overdue={overdue}
          editable={editable}
          onChange={changeDueDate}
        />
      </SidebarRow>

      <SidebarRow label="Labels">
        <Flex gap="1.5" flexWrap="wrap" justifyContent="flex-end">
          {issue.labels.map((label) => (
            <LabelPill
              key={label.id}
              label={label}
              editable={editable}
              onRemove={() => removeLabel(label.id)}
            />
          ))}
          {editable && (
            <IconButton
              aria-label="Add label"
              size="xs"
              variant="ghost"
              borderRadius="full"
              color="fg.muted"
              onClick={addLabel}
            >
              <PiPlus size={12} />
            </IconButton>
          )}
        </Flex>
      </SidebarRow>

      <SidebarRow label="Project">
        {onNavigateToProject ? (
          <Text
            as="button"
            fontSize="sm"
            color="accent.default"
            fontWeight="medium"
            bg="transparent"
            border="none"
            cursor="pointer"
            onClick={onNavigateToProject}
            _hover={{ textDecoration: "underline" }}
          >
            {issue.projectName}
          </Text>
        ) : (
          <RouterLink to={`/projects/${issue.projectId}`}>
            <Text
              fontSize="sm"
              color="accent.default"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
            >
              {issue.projectName}
            </Text>
          </RouterLink>
        )}
      </SidebarRow>

      <SidebarRow label="Watchers">
        <Stack gap="2" align="flex-end">
          <HStack gap="-1">
            {issue.watchers.slice(0, 4).map((name) => {
              const member = memberByName(teamMembers, name);
              return (
                <MemberAvatar
                  key={name}
                  initials={member?.initials ?? name.slice(0, 2).toUpperCase()}
                />
              );
            })}
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            borderRadius="control"
            color="fg.secondary"
            fontWeight="medium"
            onClick={onToggleWatch}
          >
            {watching ? "Unwatch" : "Watch"}
          </Button>
        </Stack>
      </SidebarRow>

      <SidebarRow label="Created">
        <Text fontSize="sm" color="fg.primary">
          {formatDateLong(issue.createdAt)}
        </Text>
      </SidebarRow>

      <SidebarRow label="Updated">
        <Text fontSize="sm" color="fg.primary">
          {formatRelativeTime(issue.updatedAt)}
        </Text>
      </SidebarRow>
    </Box>
  );

  if (collapsible) {
    return (
      <Box borderBottomWidth="1px" borderColor="border.divider" bg="bg.canvas">
        <Collapsible.Root
          open={mobileOpen}
          onOpenChange={(e) => setMobileOpen(e.open)}
        >
          <Collapsible.Trigger asChild>
            <Button
              w="full"
              variant="ghost"
              justifyContent="space-between"
              borderRadius="0"
              py="3"
              px="4"
              fontWeight="medium"
              color="fg.secondary"
            >
              Details
              {mobileOpen ? <PiCaretUp size={16} /> : <PiCaretDown size={16} />}
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>{sidebarBody}</Collapsible.Content>
        </Collapsible.Root>
      </Box>
    );
  }

  return (
    <Box
      w="full"
      h="full"
      bg="bg.canvas"
      borderLeftWidth={{ lg: "1px" }}
      borderColor="border.divider"
      transition={transition.base}
    >
      {sidebarBody}
    </Box>
  );
}
