import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PiChatCircleDots, PiPlus } from "react-icons/pi";

import { STATUS_OPTIONS } from "./issue-filters";
import { type Issue, PRIORITY_DOT_COLOR } from "./issue-types";
import type { IssueFilters, IssueStatus } from "./IssueFilterBar";
import { updateIssueStatusApi } from "./issues-api";
import {
  EASE_OUT,
  interactiveCard,
  stagger,
  transition,
} from "./issues-motion";

const BOARD_STATUSES = STATUS_OPTIONS.filter((s) => s.value !== "cancelled");

interface IssuesBoardViewProps {
  issues: Issue[];
  filters: IssueFilters;
  onIssueClick: (issue: Issue) => void;
  onIssueUpdate: (id: string, patch: Partial<Issue>) => void;
  onQuickAdd: (status: IssueStatus, projectId: string) => void;
  canCreate: boolean;
  /** When set, always show the board for this single project (no filter gate). */
  projectId?: string;
  hideProjectBadge?: boolean;
}

function canShowBoard(
  filters: IssueFilters,
  allowCrossProject: boolean
): boolean {
  if (filters.projectIds.length === 1) return true;
  return allowCrossProject;
}

function BoardGate({
  filters,
  allowCrossProject,
  onAllowCrossProject,
}: {
  filters: IssueFilters;
  allowCrossProject: boolean;
  onAllowCrossProject: (value: boolean) => void;
}) {
  const projectCount = filters.projectIds.length;

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="20"
      px="6"
      borderWidth="1.5px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      animation={`rivet-fade-in-up 0.45s ${EASE_OUT} both`}
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
        Select a project to use the board
      </Text>
      <Text fontSize="sm" color="fg.secondary" maxW="md" mb="6">
        {projectCount === 0
          ? "The board works best with a single project. Use the Project filter above to pick one."
          : `${projectCount} projects selected — pick exactly one project, or enable cross-project view below.`}
      </Text>
      <Checkbox.Root
        checked={allowCrossProject}
        onCheckedChange={(e) => onAllowCrossProject(!!e.checked)}
        size="sm"
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label fontSize="sm" color="fg.secondary">
          Show cross-project board
        </Checkbox.Label>
      </Checkbox.Root>
    </Flex>
  );
}

function BoardCard({
  issue,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  hideProjectBadge = false,
  style,
}: {
  issue: Issue;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  hideProjectBadge?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Box
      draggable
      style={style}
      animation={`rivet-fade-in-up 0.35s ${EASE_OUT} both`}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/issue-id", issue.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="control"
      p="3"
      cursor="grab"
      opacity={isDragging ? 0.5 : 1}
      transform={isDragging ? "rotate(2deg) scale(1.02)" : undefined}
      boxShadow={isDragging ? "elevated" : "subtle"}
      transition={transition.transform}
      _hover={isDragging ? undefined : interactiveCard._hover}
      _active={{ cursor: "grabbing" }}
      onClick={onClick}
    >
      <Box
        boxSize="2"
        borderRadius="full"
        bg={PRIORITY_DOT_COLOR[issue.priority]}
        mb="2"
      />

      <Text
        fontSize="sm"
        fontWeight="medium"
        color="fg.primary"
        lineClamp={2}
        mb="2.5"
        lineHeight="1.4"
      >
        {issue.title}
      </Text>

      <ProjectBadge issue={issue} hidden={hideProjectBadge} />

      <HStack justify="space-between" align="center" mt="3">
        {issue.commentCount > 0 ? (
          <HStack gap="1" color="fg.muted">
            <PiChatCircleDots size={14} />
            <Text fontSize="xs">{issue.commentCount}</Text>
          </HStack>
        ) : (
          <Box />
        )}
        <Flex
          boxSize="6"
          align="center"
          justify="center"
          borderRadius="full"
          borderWidth={issue.assigneeInitials ? "0" : "1px"}
          borderColor="border.default"
          bg={issue.assigneeInitials ? "brand.subtle" : "transparent"}
          color={issue.assigneeInitials ? "accent.default" : "transparent"}
          fontSize="2xs"
          fontWeight="bold"
          title={issue.assignee ?? "Unassigned"}
          flexShrink="0"
        >
          {issue.assigneeInitials ?? ""}
        </Flex>
      </HStack>
    </Box>
  );
}

function ProjectBadge({
  issue,
  hidden = false,
}: {
  issue: Issue;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <Box
      as="span"
      display="inline-block"
      px="2"
      py="0.5"
      borderRadius="badge"
      bg="bg.surfaceHover"
      color="fg.muted"
      fontSize="xs"
      fontWeight="medium"
      maxW="full"
      truncate
    >
      {issue.projectName}
    </Box>
  );
}

function BoardColumn({
  status,
  label,
  issues,
  colIndex,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onIssueClick,
  draggingId,
  onDragStart,
  onDragEnd,
  onQuickAdd,
  canCreate,
  hideProjectBadge = false,
}: {
  status: IssueStatus;
  label: string;
  issues: Issue[];
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (issueId: string) => void;
  onIssueClick: (issue: Issue) => void;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onQuickAdd: (status: IssueStatus) => void;
  canCreate: boolean;
  hideProjectBadge?: boolean;
  colIndex: number;
}) {
  return (
    <Box
      flex="1"
      minW="56"
      maxW="72"
      bg="bg.surface"
      borderWidth="1px"
      borderColor={isDragOver ? "accent.default" : "border.default"}
      borderRadius="card"
      display="flex"
      flexDirection="column"
      maxH="calc(100svh - 16rem)"
      transition={`border-color 0.22s ${EASE_OUT}, box-shadow 0.22s ${EASE_OUT}`}
      boxShadow={
        isDragOver ? "0 0 0 2px var(--chakra-colors-brand-subtle)" : "card"
      }
      animation={`rivet-fade-in-up 0.4s ${EASE_OUT} both`}
      style={{ animationDelay: `${colIndex * 60}ms` }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const issueId = e.dataTransfer.getData("text/issue-id");
        if (issueId) onDrop(issueId);
      }}
    >
      <HStack
        justify="space-between"
        align="center"
        px="3"
        py="3"
        borderBottomWidth="1px"
        borderColor="border.divider"
        flexShrink="0"
      >
        <Text fontSize="sm" fontWeight="semibold" color="fg.primary">
          {label} · {issues.length}
        </Text>
        {canCreate && (
          <IconButton
            aria-label={`Add issue to ${label}`}
            variant="ghost"
            size="xs"
            color="fg.muted"
            borderRadius="control"
            onClick={() => onQuickAdd(status)}
            _hover={{ color: "accent.default", bg: "brand.subtle" }}
          >
            <PiPlus size={16} />
          </IconButton>
        )}
      </HStack>

      <Stack
        gap="2.5"
        p="3"
        overflowY="auto"
        flex="1"
        bg={isDragOver ? "brand.subtle" : "transparent"}
        transition="background 0.15s"
      >
        {issues.map((issue, index) => (
          <BoardCard
            key={issue.id}
            issue={issue}
            onClick={() => onIssueClick(issue)}
            onDragStart={() => onDragStart(issue.id)}
            onDragEnd={onDragEnd}
            isDragging={draggingId === issue.id}
            hideProjectBadge={hideProjectBadge}
            style={stagger(index, 40)}
          />
        ))}
        {issues.length === 0 && (
          <Text fontSize="xs" color="fg.muted" textAlign="center" py="8">
            Drop issues here
          </Text>
        )}
      </Stack>
    </Box>
  );
}

export function IssuesBoardView({
  issues,
  filters,
  onIssueClick,
  onIssueUpdate,
  onQuickAdd,
  canCreate,
  projectId,
  hideProjectBadge = false,
}: IssuesBoardViewProps) {
  const [allowCrossProject, setAllowCrossProject] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(
    null
  );
  const pendingUpdates = useRef(new Set<string>());

  const boardVisible = !!projectId || canShowBoard(filters, allowCrossProject);
  const singleProjectId =
    projectId ??
    (filters.projectIds.length === 1 ? filters.projectIds[0] : undefined);

  const handleStatusChange = useCallback(
    async (issueId: string, newStatus: IssueStatus) => {
      const issue = issues.find((i) => i.id === issueId);
      if (!issue || issue.status === newStatus) return;
      if (pendingUpdates.current.has(issueId)) return;

      const previousStatus = issue.status;
      const previousUpdatedAt = issue.updatedAt;

      pendingUpdates.current.add(issueId);
      onIssueUpdate(issueId, { status: newStatus, updatedAt: new Date() });

      try {
        await updateIssueStatusApi(issueId, newStatus);
      } catch {
        onIssueUpdate(issueId, {
          status: previousStatus,
          updatedAt: previousUpdatedAt,
        });
        toast.error("Couldn't update status — changes reverted");
      } finally {
        pendingUpdates.current.delete(issueId);
      }
    },
    [issues, onIssueUpdate]
  );

  if (!boardVisible) {
    return (
      <BoardGate
        filters={filters}
        allowCrossProject={allowCrossProject}
        onAllowCrossProject={setAllowCrossProject}
      />
    );
  }

  return (
    <Box mx={{ base: "-5", md: "-10" }} px={{ base: "5", md: "10" }} py="2">
      {allowCrossProject && filters.projectIds.length !== 1 && (
        <HStack justify="flex-end" mb="3">
          <Text fontSize="xs" color="fg.muted">
            Cross-project board
          </Text>
          <Button
            variant="ghost"
            size="xs"
            color="fg.muted"
            onClick={() => setAllowCrossProject(false)}
          >
            Use single project
          </Button>
        </HStack>
      )}

      <Flex
        gap="3"
        overflowX="auto"
        pb="4"
        align="flex-start"
        bg="bg.canvas"
        borderRadius="card"
        p="3"
        css={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(79, 70, 229, 0.04) 0%, transparent 45%), radial-gradient(circle at 80% 100%, rgba(8, 145, 178, 0.03) 0%, transparent 40%)",
        }}
      >
        {BOARD_STATUSES.map(({ value, label }, colIndex) => {
          const columnIssues = issues.filter((i) => i.status === value);
          return (
            <BoardColumn
              key={value}
              status={value}
              label={label}
              issues={columnIssues}
              colIndex={colIndex}
              isDragOver={dragOverColumn === value}
              onDragOver={() => setDragOverColumn(value)}
              onDragLeave={() =>
                setDragOverColumn((current) =>
                  current === value ? null : current
                )
              }
              onDrop={(issueId) => {
                setDragOverColumn(null);
                setDraggingId(null);
                void handleStatusChange(issueId, value);
              }}
              onIssueClick={onIssueClick}
              draggingId={draggingId}
              onDragStart={setDraggingId}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverColumn(null);
              }}
              onQuickAdd={(status) => {
                if (singleProjectId) {
                  onQuickAdd(status, singleProjectId);
                }
              }}
              canCreate={canCreate && !!singleProjectId}
              hideProjectBadge={hideProjectBadge || !!projectId}
            />
          );
        })}
      </Flex>
    </Box>
  );
}
