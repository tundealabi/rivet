import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Input,
  InputGroup,
  Popover,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { PiCaretDown, PiMagnifyingGlass, PiX } from "react-icons/pi";

import { useColorModeValue } from "../theme/color-mode";
import { EASE_OUT, transition } from "./issues-motion";

export type IssueStatus =
  "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";

export type IssuePriority = "low" | "medium" | "high" | "critical";

export type AssigneeFilterValue = string;

export interface IssueFilters {
  search: string;
  projectIds: string[];
  statuses: IssueStatus[];
  priorities: IssuePriority[];
  assignees: AssigneeFilterValue[];
}

export const EMPTY_FILTERS: IssueFilters = {
  search: "",
  projectIds: [],
  statuses: [],
  priorities: [],
  assignees: [],
};

export const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<IssueStatus, string>;

const PRIORITY_LABELS = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.value, o.label])
) as Record<IssuePriority, string>;

function toggleValue<T extends string>(selected: T[], value: T): T[] {
  return selected.includes(value)
    ? selected.filter((v) => v !== value)
    : [...selected, value];
}

function FilterTrigger({ label, count }: { label: string; count: number }) {
  return (
    <Button
      variant="outline"
      size="sm"
      h="9"
      px="3"
      borderRadius="control"
      borderColor="border.default"
      bg="bg.surface"
      color="fg.secondary"
      fontWeight="medium"
      fontSize="sm"
      transition={transition.base}
      _hover={{ bg: "bg.surfaceHover" }}
    >
      {label}
      {count > 0 ? ` (${count})` : ""}
      <PiCaretDown size={14} />
    </Button>
  );
}

function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
  shortcuts,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  shortcuts?: { value: T; label: string }[];
}) {
  return (
    <Popover.Root positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Box as="span" display="inline-flex">
          <FilterTrigger label={label} count={selected.length} />
        </Box>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          boxShadow="hover"
          p="2"
          minW="48"
          zIndex="popover"
        >
          <Stack gap="0.5">
            {shortcuts?.map((item) => (
              <Checkbox.Root
                key={item.value}
                size="sm"
                px="2"
                py="1.5"
                borderRadius="control"
                checked={selected.includes(item.value)}
                onCheckedChange={() =>
                  onChange(toggleValue(selected, item.value))
                }
                _hover={{ bg: "bg.surfaceHover" }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.primary"
                >
                  {item.label}
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
            {shortcuts && shortcuts.length > 0 && (
              <Box h="px" bg="border.default" my="1" />
            )}
            {options.map((option) => (
              <Checkbox.Root
                key={option.value}
                size="sm"
                px="2"
                py="1.5"
                borderRadius="control"
                checked={selected.includes(option.value)}
                onCheckedChange={() =>
                  onChange(toggleValue(selected, option.value))
                }
                _hover={{ bg: "bg.surfaceHover" }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize="sm" color="fg.secondary">
                  {option.label}
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

function buildFilterChips(
  filters: IssueFilters,
  projectNames: Record<string, string>,
  onChange: (filters: IssueFilters) => void
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.search.trim()) {
    chips.push({
      key: "search",
      label: `Search: ${filters.search.trim()}`,
      onRemove: () => onChange({ ...filters, search: "" }),
    });
  }

  for (const id of filters.projectIds) {
    chips.push({
      key: `project-${id}`,
      label: projectNames[id] ?? id,
      onRemove: () =>
        onChange({
          ...filters,
          projectIds: filters.projectIds.filter((p) => p !== id),
        }),
    });
  }

  for (const status of filters.statuses) {
    chips.push({
      key: `status-${status}`,
      label: STATUS_LABELS[status],
      onRemove: () =>
        onChange({
          ...filters,
          statuses: filters.statuses.filter((s) => s !== status),
        }),
    });
  }

  for (const priority of filters.priorities) {
    chips.push({
      key: `priority-${priority}`,
      label: PRIORITY_LABELS[priority],
      onRemove: () =>
        onChange({
          ...filters,
          priorities: filters.priorities.filter((p) => p !== priority),
        }),
    });
  }

  for (const assignee of filters.assignees) {
    const label =
      assignee === "__me__"
        ? "Assigned to me"
        : assignee === "__unassigned__"
          ? "Unassigned"
          : assignee;
    chips.push({
      key: `assignee-${assignee}`,
      label,
      onRemove: () =>
        onChange({
          ...filters,
          assignees: filters.assignees.filter((a) => a !== assignee),
        }),
    });
  }

  return chips;
}

export function hasActiveFilters(filters: IssueFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.projectIds.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0
  );
}

interface IssueFilterBarProps {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
  projects: { id: string; name: string }[];
  teamMembers: { name: string }[];
  currentUserName: string;
  hideProjectFilter?: boolean;
}

export function IssueFilterBar({
  filters,
  onChange,
  projects,
  teamMembers,
  currentUserName,
  hideProjectFilter = false,
}: IssueFilterBarProps) {
  const stickyBarBg = useColorModeValue(
    "rgba(255, 255, 255, 0.85)",
    "rgba(24, 24, 27, 0.85)"
  );

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const chips = buildFilterChips(filters, projectNames, onChange);
  const active = hasActiveFilters(filters);

  const assigneeShortcuts = [
    { value: "__me__" as const, label: "Assigned to me" },
    { value: "__unassigned__" as const, label: "Unassigned" },
  ];

  const assigneeOptions = teamMembers
    .filter((m) => m.name !== currentUserName)
    .map((m) => ({ value: m.name, label: m.name }));

  return (
    <Box
      position="sticky"
      top="0"
      zIndex="10"
      bg={stickyBarBg}
      backdropFilter="blur(10px)"
      borderBottomWidth="1px"
      borderColor="border.default"
    >
      <Flex
        align="center"
        gap="2"
        px={{ base: "5", md: "10" }}
        py="3"
        overflowX="auto"
        flexWrap={{ base: "nowrap", lg: "wrap" }}
      >
        <InputGroup
          maxW={{ base: "44", md: "56" }}
          flexShrink="0"
          startElement={
            <Box color="fg.muted" lineHeight="0" pl="1">
              <PiMagnifyingGlass size={16} />
            </Box>
          }
        >
          <Input
            size="sm"
            h="9"
            placeholder="Search issues..."
            borderRadius="control"
            borderColor="border.default"
            bg="bg.surface"
            transition={transition.base}
            _focusVisible={{
              borderColor: "accent.default",
              boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.12)",
            }}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </InputGroup>

        {!hideProjectFilter && (
          <MultiSelectDropdown
            label="Project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            selected={filters.projectIds}
            onChange={(projectIds) => onChange({ ...filters, projectIds })}
          />
        )}

        <MultiSelectDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.statuses}
          onChange={(statuses) => onChange({ ...filters, statuses })}
        />

        <MultiSelectDropdown
          label="Priority"
          options={PRIORITY_OPTIONS}
          selected={filters.priorities}
          onChange={(priorities) => onChange({ ...filters, priorities })}
        />

        <MultiSelectDropdown
          label="Assignee"
          shortcuts={assigneeShortcuts}
          options={assigneeOptions}
          selected={filters.assignees}
          onChange={(assignees) => onChange({ ...filters, assignees })}
        />

        {active && (
          <Button
            variant="ghost"
            size="sm"
            h="9"
            px="2"
            color="fg.muted"
            fontWeight="medium"
            fontSize="sm"
            flexShrink="0"
            animation={`rivet-fade-in 0.2s ${EASE_OUT} both`}
            transition={transition.base}
            _hover={{ color: "fg.secondary" }}
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear filters
          </Button>
        )}
      </Flex>

      {chips.length > 0 && (
        <HStack gap="2" px={{ base: "5", md: "10" }} pb="3" flexWrap="wrap">
          {chips.map((chip, index) => (
            <HStack
              key={chip.key}
              gap="1"
              px="2.5"
              py="1"
              borderRadius="badge"
              borderWidth="1px"
              borderColor="border.default"
              bg="bg.surfaceHover"
              fontSize="xs"
              color="fg.secondary"
              animation={`rivet-chip-in 0.25s ${EASE_OUT} both`}
              style={{ animationDelay: `${index * 40}ms` }}
              transition={transition.base}
              _hover={{ borderColor: "accent.default" }}
            >
              <Text>{chip.label}</Text>
              <Button
                variant="ghost"
                size="2xs"
                minW="auto"
                h="auto"
                p="0"
                color="fg.muted"
                aria-label={`Remove ${chip.label} filter`}
                onClick={chip.onRemove}
                _hover={{ color: "fg.primary", bg: "transparent" }}
              >
                <PiX size={12} />
              </Button>
            </HStack>
          ))}
        </HStack>
      )}
    </Box>
  );
}

export interface FilterableIssue {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string | null;
  projectId: string;
}

export function filterIssues<T extends FilterableIssue>(
  issues: T[],
  filters: IssueFilters,
  currentUserName: string
): T[] {
  const query = filters.search.trim().toLowerCase();

  return issues.filter((issue) => {
    if (query) {
      const haystack = `${issue.title} ${issue.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (
      filters.projectIds.length > 0 &&
      !filters.projectIds.includes(issue.projectId)
    ) {
      return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(issue.status)
    ) {
      return false;
    }

    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(issue.priority)
    ) {
      return false;
    }

    if (filters.assignees.length > 0) {
      const matches = filters.assignees.some((value) => {
        if (value === "__me__") return issue.assignee === currentUserName;
        if (value === "__unassigned__") return issue.assignee === null;
        return issue.assignee === value;
      });
      if (!matches) return false;
    }

    return true;
  });
}
