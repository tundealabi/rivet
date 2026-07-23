import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiArrowLeft, PiExport, PiPlusBold, PiSignOut } from "react-icons/pi";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import {
  applyIssueListPreset,
  filtersFromPreset,
  parseIssueListPreset,
} from "../components/dashboard/issue-list-presets";
import { issueDetailPath } from "../components/issues/issue-detail-actions";
import {
  EMPTY_FILTERS,
  filterIssues,
  hasActiveFilters,
  STATUS_OPTIONS,
} from "../components/issues/issue-filters";
import {
  canCreateIssues,
  canDeleteIssues,
} from "../components/issues/issue-permissions";
import { type Issue } from "../components/issues/issue-types";
import {
  IssueFilterBar,
  type IssueFilters,
  type IssuePriority,
  type IssueStatus,
} from "../components/issues/IssueFilterBar";
import {
  fetchIssuesMock,
  refetchIssuesMock,
} from "../components/issues/issues-api";
import {
  EASE_OUT,
  fadeInUp,
  transition,
} from "../components/issues/issues-motion";
import { IssuesBoardView } from "../components/issues/IssuesBoardView";
import {
  IssuesEmptyState,
  IssuesErrorState,
  IssuesFilterEmptyState,
  IssuesRefetchBar,
  IssuesTableSkeleton,
} from "../components/issues/IssuesPageStates";
import { IssuesTableView } from "../components/issues/IssuesTableView";
import { IssuesViewToggle } from "../components/issues/IssuesViewToggle";
import {
  MOCK_CURRENT_USER,
  MOCK_ISSUES,
  MOCK_PROJECTS,
  MOCK_TEAM_MEMBERS,
} from "../components/issues/mock-issues-data";

type ViewMode = "table" | "board";
type LoadState = "loading" | "success" | "error";

const MOCK_ROLE = OrganizationRole.MEMBER;

interface ProjectOption {
  id: string;
  name: string;
  key: string;
  color: string;
}

interface NewIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectOption[];
  onCreate: (issue: Issue) => void;
  nextNumber: number;
  initialProjectId?: string;
  initialStatus?: IssueStatus;
}

function NewIssueDialog({
  open,
  onOpenChange,
  projects,
  onCreate,
  nextNumber,
  initialProjectId,
  initialStatus,
}: NewIssueDialogProps) {
  const [step, setStep] = useState<"project" | "form">("project");
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [status, setStatus] = useState<IssueStatus>("todo");
  const [titleError, setTitleError] = useState("");

  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (initialProjectId) {
        const project = projects.find((p) => p.id === initialProjectId) ?? null;
        setSelectedProject(project);
        setStep(project ? "form" : "project");
      } else {
        setSelectedProject(null);
        setStep("project");
      }
      setStatus(initialStatus ?? "todo");
    }
  }

  const reset = () => {
    setStep("project");
    setSelectedProject(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setTitleError("");
  };

  const handleCreate = () => {
    if (!selectedProject) return;
    if (!title.trim()) {
      setTitleError("Please enter a title");
      return;
    }

    onCreate({
      id: crypto.randomUUID(),
      number: nextNumber,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: MOCK_CURRENT_USER,
      assigneeInitials: "AL",
      reporter: MOCK_CURRENT_USER,
      reporterInitials: "AL",
      projectId: selectedProject.id,
      projectKey: selectedProject.key,
      projectName: selectedProject.name,
      projectColor: selectedProject.color,
      comments: [],
      commentCount: 0,
      activity: [
        {
          id: crypto.randomUUID(),
          type: "created",
          actor: MOCK_CURRENT_USER,
          createdAt: new Date(),
        },
      ],
      labels: [],
      watchers: [MOCK_CURRENT_USER],
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    reset();
    onOpenChange(false);
    toast.success("Issue created");
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) reset();
        onOpenChange(e.open);
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.surface"
          borderRadius="card"
          maxW="md"
          w="full"
          mx="4"
          boxShadow="elevated"
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">
              {step === "project" ? "New issue — choose project" : "New issue"}
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            {step === "project" ? (
              <Stack gap="2">
                <Text fontSize="sm" color="fg.secondary" mb="2">
                  Which project does this issue belong to?
                </Text>
                {projects.map((project, index) => (
                  <HStack
                    key={project.id}
                    gap="3"
                    px="3"
                    py="3"
                    borderRadius="control"
                    borderWidth="1px"
                    borderColor={
                      selectedProject?.id === project.id
                        ? "accent.default"
                        : "border.default"
                    }
                    bg={
                      selectedProject?.id === project.id
                        ? "brand.subtle"
                        : "transparent"
                    }
                    cursor="pointer"
                    transition={transition.base}
                    animation={`rivet-fade-in-up 0.35s ${EASE_OUT} both`}
                    style={{ animationDelay: `${index * 40}ms` }}
                    _hover={{
                      borderColor: "accent.default",
                      transform: "translateY(-1px)",
                      boxShadow: "subtle",
                    }}
                    onClick={() => setSelectedProject(project)}
                  >
                    <Flex
                      boxSize="9"
                      align="center"
                      justify="center"
                      borderRadius="control"
                      bg={project.color}
                      color="white"
                      fontWeight="bold"
                      fontSize="xs"
                      flexShrink="0"
                    >
                      {project.key.slice(0, 2)}
                    </Flex>
                    <Box minW="0">
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="fg.primary"
                      >
                        {project.name}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                        {project.key}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </Stack>
            ) : (
              <Stack gap="4">
                <HStack
                  gap="2"
                  px="3"
                  py="2"
                  borderRadius="control"
                  bg="bg.surfaceHover"
                  borderWidth="1px"
                  borderColor="border.default"
                >
                  <Box
                    boxSize="2.5"
                    borderRadius="sm"
                    bg={selectedProject?.color}
                  />
                  <Text fontSize="sm" color="fg.secondary">
                    {selectedProject?.name}{" "}
                    <Text as="span" fontFamily="mono" color="fg.muted">
                      ({selectedProject?.key})
                    </Text>
                  </Text>
                </HStack>

                <Field.Root invalid={!!titleError}>
                  <Field.Label color="fg.primary">Title</Field.Label>
                  <Input
                    placeholder="What needs to be done?"
                    borderRadius="control"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError && e.target.value.trim())
                        setTitleError("");
                    }}
                    autoFocus
                  />
                  <Field.ErrorText>{titleError}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="fg.primary">
                    Description{" "}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Textarea
                    placeholder="Add more context…"
                    borderRadius="control"
                    rows={3}
                    resize="none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field.Root>

                <HStack gap="4" align="flex-start">
                  <Field.Root flex="1">
                    <Field.Label color="fg.primary">Priority</Field.Label>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        borderRadius="control"
                        value={priority}
                        onChange={(e) =>
                          setPriority(e.target.value as IssuePriority)
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root flex="1">
                    <Field.Label color="fg.primary">Status</Field.Label>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        borderRadius="control"
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as IssueStatus)
                        }
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>
                </HStack>
              </Stack>
            )}
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            {step === "form" && (
              <Button
                variant="ghost"
                borderRadius="control"
                onClick={() => setStep("project")}
              >
                <PiArrowLeft size={16} />
                Back
              </Button>
            )}
            <Box flex="1" />
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {step === "project" ? (
              <Button
                borderRadius="control"
                bg="accent.default"
                color="white"
                _hover={{ bg: "accent.hover" }}
                disabled={!selectedProject}
                onClick={() => setStep("form")}
              >
                Continue
              </Button>
            ) : (
              <Button
                borderRadius="control"
                bg="accent.default"
                color="white"
                _hover={{ bg: "accent.hover" }}
                onClick={handleCreate}
              >
                Create issue
              </Button>
            )}
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function isOpenStatus(status: IssueStatus): boolean {
  return status !== "done" && status !== "cancelled";
}

export default function IssuesPage() {
  const [searchParams] = useSearchParams();
  const listPreset = parseIssueListPreset(searchParams.get("preset"));

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [isRefetching, setIsRefetching] = useState(false);
  const [filters, setFilters] = useState<IssueFilters>(() =>
    listPreset ? filtersFromPreset(listPreset) : EMPTY_FILTERS
  );
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaults, setDialogDefaults] = useState<{
    projectId?: string;
    status?: IssueStatus;
  }>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const logout = useLogout();
  const navigate = useNavigate();

  const loadIssues = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await fetchIssuesMock(MOCK_ISSUES);
      setIssues(data);
      setLoadState("success");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchIssuesMock(MOCK_ISSUES)
      .then((data) => {
        if (cancelled) return;
        setIssues(data);
        setLoadState("success");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setSelectedIds(new Set());
    if (loadState === "success") setIsRefetching(true);
  }

  const [prevListPreset, setPrevListPreset] = useState(listPreset);
  if (prevListPreset !== listPreset) {
    setPrevListPreset(listPreset);
    if (listPreset) setFilters(filtersFromPreset(listPreset));
  }

  useEffect(() => {
    if (loadState !== "success") return;
    let cancelled = false;
    void refetchIssuesMock().finally(() => {
      if (!cancelled) setIsRefetching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filters, loadState]);

  const filteredIssues = useMemo(() => {
    const base = filterIssues(issues, filters, MOCK_CURRENT_USER);
    return applyIssueListPreset(base, listPreset, MOCK_CURRENT_USER);
  }, [issues, filters, listPreset]);

  const openCount = useMemo(
    () => issues.filter((i) => isOpenStatus(i.status)).length,
    [issues]
  );

  const filteredOpenCount = useMemo(
    () => filteredIssues.filter((i) => isOpenStatus(i.status)).length,
    [filteredIssues]
  );

  const filtersActive = hasActiveFilters(filters);

  const nextIssueNumber = useMemo(
    () => Math.max(0, ...issues.map((i) => i.number)) + 1,
    [issues]
  );

  const openNewIssueDialog = (defaults?: {
    projectId?: string;
    status?: IssueStatus;
  }) => {
    setDialogDefaults(defaults ?? {});
    setDialogOpen(true);
  };

  const handleExport = () => {
    toast.success("Export queued — we'll notify you when ready.");
  };

  const handleIssueUpdate = (id: string, patch: Partial<Issue>) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue))
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setDialogDefaults({});
  };

  const handleIssuesDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setIssues((prev) => prev.filter((issue) => !idSet.has(issue.id)));
  };

  const openIssueDetail = (issue: Issue) => {
    void navigate(issueDetailPath(issue.projectId, issue.id));
  };

  const canDelete = canDeleteIssues(MOCK_ROLE);

  const renderContent = () => {
    if (loadState === "loading") {
      return viewMode === "table" ? (
        <IssuesTableSkeleton rows={8} />
      ) : (
        <IssuesTableSkeleton rows={4} />
      );
    }

    if (loadState === "error") {
      return <IssuesErrorState onRetry={() => void loadIssues()} />;
    }

    if (issues.length === 0 && !filtersActive) {
      return (
        <IssuesEmptyState
          onCreate={() => openNewIssueDialog()}
          canCreate={canCreateIssues(MOCK_ROLE)}
        />
      );
    }

    if (filteredIssues.length === 0 && filtersActive) {
      return (
        <IssuesFilterEmptyState onClear={() => setFilters(EMPTY_FILTERS)} />
      );
    }

    if (viewMode === "table") {
      return (
        <IssuesTableView
          key={filteredIssues.map((i) => i.id).join(",")}
          issues={filteredIssues}
          teamMembers={MOCK_TEAM_MEMBERS}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onIssueClick={openIssueDetail}
          onIssueUpdate={handleIssueUpdate}
          onIssuesDelete={handleIssuesDelete}
          canDelete={canDelete}
        />
      );
    }

    return (
      <IssuesBoardView
        issues={filteredIssues}
        filters={filters}
        onIssueClick={openIssueDetail}
        onIssueUpdate={handleIssueUpdate}
        onQuickAdd={(status, projectId) =>
          openNewIssueDialog({ status, projectId })
        }
        canCreate={canCreateIssues(MOCK_ROLE)}
      />
    );
  };

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />

      <Box
        flex="1"
        minW="0"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Flex
          as="header"
          align={{ base: "flex-start", lg: "center" }}
          justify="space-between"
          direction={{ base: "column", lg: "row" }}
          px={{ base: "5", md: "10" }}
          py="5"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
          gap="4"
          flexShrink="0"
          boxShadow="0 1px 0 rgba(0,0,0,0.03)"
          animation={`rivet-fade-in 0.4s ${EASE_OUT} both`}
        >
          <Box>
            <Heading
              size="xl"
              color="fg.primary"
              letterSpacing="-0.03em"
              fontWeight="semibold"
            >
              Issues
            </Heading>
            <Text
              fontSize="sm"
              color="fg.secondary"
              mt="1"
              transition={transition.base}
              key={`${openCount}-${issues.length}-${filteredIssues.length}`}
              animation={`rivet-fade-in 0.25s ${EASE_OUT} both`}
            >
              {filtersActive
                ? `${filteredOpenCount} open · ${filteredIssues.length} of ${issues.length} total`
                : `${openCount} open · ${issues.length} total`}
            </Text>
          </Box>

          <HStack gap="3" flexWrap="wrap">
            <Button
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              fontWeight="medium"
              display={{ base: "inline-flex", md: "none" }}
              _hover={{
                bg: "danger.ghostHover",
                color: "status.error",
                borderColor: "status.error",
              }}
              onClick={logout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>

            <IssuesViewToggle value={viewMode} onChange={setViewMode} />

            <Button
              variant="ghost"
              size="sm"
              borderRadius="control"
              color="fg.secondary"
              fontWeight="medium"
              transition={transition.base}
              _hover={{ bg: "bg.surfaceHover", color: "fg.primary" }}
              onClick={handleExport}
            >
              <PiExport size={16} />
              Export CSV
            </Button>

            {canCreateIssues(MOCK_ROLE) && (
              <Button
                borderRadius="full"
                bg="accent.default"
                color="white"
                fontWeight="semibold"
                transition={transition.base}
                boxShadow="0 2px 8px rgba(79, 70, 229, 0.28)"
                _hover={{
                  bg: "accent.hover",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                }}
                _active={{ transform: "translateY(0)" }}
                onClick={() => openNewIssueDialog()}
              >
                <PiPlusBold /> New issue
              </Button>
            )}
          </HStack>
        </Flex>

        <Box flex="1" overflowY="auto" position="relative">
          <IssuesRefetchBar active={isRefetching} />
          <IssueFilterBar
            filters={filters}
            onChange={setFilters}
            projects={MOCK_PROJECTS}
            teamMembers={MOCK_TEAM_MEMBERS}
            currentUserName={MOCK_CURRENT_USER}
          />

          <Box px={{ base: "5", md: "10" }} py="8">
            <Box key={`${viewMode}-${loadState}`} {...fadeInUp}>
              {renderContent()}
            </Box>
          </Box>
        </Box>
      </Box>

      <NewIssueDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        projects={MOCK_PROJECTS}
        onCreate={(issue) => setIssues((prev) => [issue, ...prev])}
        nextNumber={nextIssueNumber}
        initialProjectId={dialogDefaults.projectId}
        initialStatus={dialogDefaults.status}
      />
    </Flex>
  );
}
