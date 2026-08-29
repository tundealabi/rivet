import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Outlet, useMatch, useNavigate, useParams } from "react-router-dom";

import { isSessionExpiredError } from "../auth-api";
import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import { useActiveOrg } from "../components/billing/use-active-org";
import { issueDetailPath } from "../components/issues/issue-detail-actions";
import { IssueDetailProvider } from "../components/issues/issue-detail-context";
import {
  applyIssueActivityAdd,
  applyIssueCommentAdd,
  applyIssueCommentDelete,
  applyIssueCommentEdit,
  applyIssueReactionToggle,
} from "../components/issues/issue-detail-mutations";
import {
  EMPTY_FILTERS,
  filterIssues,
  hasActiveFilters,
} from "../components/issues/issue-filters";
import { canDeleteIssues } from "../components/issues/issue-permissions";
import {
  type Issue,
  type IssueActivityEvent,
} from "../components/issues/issue-types";
import {
  IssueFilterBar,
  type IssueFilters,
  type IssuePriority,
  type IssueStatus,
} from "../components/issues/IssueFilterBar";
import {
  CommentRateLimitError,
  fetchIssuesMock,
  refetchIssuesMock,
  submitCommentMock,
} from "../components/issues/issues-api";
import { EASE_OUT, fadeInUp } from "../components/issues/issues-motion";
import { IssuesBoardView } from "../components/issues/IssuesBoardView";
import {
  IssuesErrorState,
  IssuesFilterEmptyState,
  IssuesRefetchBar,
  IssuesTableSkeleton,
  ProjectIssuesEmptyState,
} from "../components/issues/IssuesPageStates";
import { IssuesTableView } from "../components/issues/IssuesTableView";
import { IssueStatusSelect } from "../components/issues/IssueStatusSelect";
import {
  type IssuesViewMode,
  IssuesViewToggle,
} from "../components/issues/IssuesViewToggle";
import {
  MOCK_CURRENT_USER,
  MOCK_ISSUES,
  MOCK_TEAM_MEMBERS,
} from "../components/issues/mock-issues-data";
import {
  canCreateProjectIssues,
  canManageProject,
} from "../components/projects/project-permissions";
import { computeProjectStats } from "../components/projects/project-stats";
import type { Project } from "../components/projects/project-types";
import { ProjectDetailHeader } from "../components/projects/ProjectDetailHeader";
import {
  type ProjectDetailTab,
  ProjectDetailTabs,
} from "../components/projects/ProjectDetailTabs";
import { ProjectOverviewTab } from "../components/projects/ProjectOverviewTab";
import {
  ProjectDetailLoadingSkeleton,
  ProjectLoadErrorState,
  ProjectNotFoundState,
} from "../components/projects/ProjectPageStates";
import {
  isProjectNotFoundError,
  type UpdateProjectInput,
} from "../components/projects/projects-api";
import { projectsQueryKeys } from "../components/projects/projects-query-keys";
import { ProjectSettingsTab } from "../components/projects/ProjectSettingsTab";
import {
  useArchiveProjectMutation,
  useDeleteProjectMutation,
  useProject,
  useUnarchiveProjectMutation,
  useUpdateProjectMutation,
} from "../components/projects/use-projects-queries";

type ProjectLoadState = "loading" | "success" | "not_found" | "error";
type IssuesLoadState = "loading" | "success" | "error";

const MOCK_ROLE = OrganizationRole.ADMIN;

interface ProjectNewIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onCreate: (issue: Issue) => void;
  nextNumber: number;
  initialStatus?: IssueStatus;
}

function ProjectNewIssueDialog({
  open,
  onOpenChange,
  project,
  onCreate,
  nextNumber,
  initialStatus,
}: ProjectNewIssueDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [status, setStatus] = useState<IssueStatus>("todo");
  const [titleError, setTitleError] = useState("");

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setStatus(initialStatus ?? "todo");
  }

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setTitleError("");
  };

  const handleCreate = () => {
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
      projectId: project.id,
      projectKey: project.key,
      projectName: project.name,
      projectColor: project.color,
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
            <Dialog.Title color="fg.primary">New issue</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
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
                <Box boxSize="2.5" borderRadius="sm" bg={project.color} />
                <Text fontSize="sm" color="fg.secondary">
                  {project.name}{" "}
                  <Text as="span" fontFamily="mono" color="fg.muted">
                    ({project.key})
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
                    if (titleError && e.target.value.trim()) setTitleError("");
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
                  <IssueStatusSelect value={status} onChange={setStatus} />
                </Field.Root>
              </HStack>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              _hover={{ bg: "accent.hover" }}
              onClick={handleCreate}
            >
              Create issue
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const issueMatch = useMatch("/projects/:projectId/issues/:issueId");
  const issueId = issueMatch?.params.issueId;
  const navigate = useNavigate();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { orgId, orgsStatus } = useActiveOrg();
  const projectQuery = useProject(orgId, projectId);
  const project = projectQuery.data ?? null;
  const archiveMutation = useArchiveProjectMutation(orgId);
  const unarchiveMutation = useUnarchiveProjectMutation(orgId);
  const updateMutation = useUpdateProjectMutation(orgId);
  const deleteMutation = useDeleteProjectMutation(orgId);
  const archivePending =
    archiveMutation.isPending || unarchiveMutation.isPending;
  const deletePending = deleteMutation.isPending;

  const projectLoadState: ProjectLoadState = !projectId
    ? "not_found"
    : orgsStatus === "loading" ||
        (Boolean(orgId) && projectQuery.isPending && !project)
      ? "loading"
      : isProjectNotFoundError(projectQuery.error)
        ? "not_found"
        : projectQuery.isError
          ? "error"
          : project
            ? "success"
            : orgId
              ? "loading"
              : "error";

  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoadState, setIssuesLoadState] =
    useState<IssuesLoadState>("loading");
  const [isRefetching, setIsRefetching] = useState(false);
  const [filters, setFilters] = useState<IssueFilters>(EMPTY_FILTERS);
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("issues");
  const [viewMode, setViewMode] = useState<IssuesViewMode>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<IssueStatus | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const canEdit = canManageProject(MOCK_ROLE);
  const canCreate = canCreateProjectIssues(MOCK_ROLE);
  const canManage = canManageProject(MOCK_ROLE);
  const canDelete = canDeleteIssues(MOCK_ROLE);

  // Reset issue state when navigating between projects.
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);
  if (trackedProjectId !== projectId) {
    setTrackedProjectId(projectId);
    setIssues([]);
    setIssuesLoadState("loading");
    setSelectedIds(new Set());
  }

  const retryProject = () => {
    void projectQuery.refetch();
  };

  // Guard the settings tab when the viewer can't manage the project.
  if (activeTab === "settings" && !canManage) {
    setActiveTab("issues");
  }

  const [trackedIssueId, setTrackedIssueId] = useState(issueId);
  if (trackedIssueId !== issueId) {
    setTrackedIssueId(issueId);
    if (issueId) setActiveTab("issues");
  }

  const loadIssues = useCallback(() => {
    if (!projectId) return;
    fetchIssuesMock(MOCK_ISSUES)
      .then((data) => {
        setIssues(data.filter((issue) => issue.projectId === projectId));
        setIssuesLoadState("success");
      })
      .catch(() => setIssuesLoadState("error"));
  }, [projectId]);

  const retryIssues = () => {
    setIssuesLoadState("loading");
    loadIssues();
  };

  useEffect(() => {
    if (projectLoadState !== "success") return;
    loadIssues();
  }, [projectLoadState, loadIssues]);

  const projectStats = useMemo(() => computeProjectStats(issues), [issues]);

  const filteredIssues = useMemo(
    () => filterIssues(issues, filters, MOCK_CURRENT_USER),
    [issues, filters]
  );

  const filtersActive = hasActiveFilters(filters);

  const handleFiltersChange = useCallback(
    (next: IssueFilters) => {
      setFilters(next);
      setSelectedIds(new Set());
      if (issuesLoadState === "success") {
        setIsRefetching(true);
        void refetchIssuesMock().finally(() => setIsRefetching(false));
      }
    },
    [issuesLoadState]
  );

  const nextIssueNumber = useMemo(
    () => Math.max(0, ...issues.map((i) => i.number)) + 1,
    [issues]
  );

  const openNewIssueDialog = (status?: IssueStatus) => {
    setDialogStatus(status);
    setDialogOpen(true);
  };

  const openIssueDetail = (issue: Issue) => {
    void navigate(issueDetailPath(issue.projectId, issue.id));
  };

  const patchIssue = (id: string, updater: (issue: Issue) => Issue) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? updater(issue) : issue))
    );
  };

  const handleIssueUpdate = (id: string, patch: Partial<Issue>) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue))
    );
  };

  const handleIssuesDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setIssues((prev) => prev.filter((issue) => !idSet.has(issue.id)));
    if (issueId && idSet.has(issueId)) {
      void navigate(`/projects/${projectId}`);
    }
  };

  const handleAddComment = async (targetIssueId: string, body: string) => {
    const tempId = `pending-${crypto.randomUUID()}`;
    patchIssue(targetIssueId, (issue) =>
      applyIssueCommentAdd(issue, body, MOCK_CURRENT_USER, MOCK_TEAM_MEMBERS, {
        id: tempId,
        syncStatus: "pending",
      })
    );

    try {
      await submitCommentMock(targetIssueId, body);
      patchIssue(targetIssueId, (issue) => ({
        ...issue,
        comments: issue.comments.map((comment) =>
          comment.id === tempId
            ? { ...comment, id: crypto.randomUUID(), syncStatus: undefined }
            : comment
        ),
      }));
    } catch (error) {
      if (error instanceof CommentRateLimitError) {
        patchIssue(targetIssueId, (issue) => ({
          ...issue,
          comments: issue.comments.filter((comment) => comment.id !== tempId),
          commentCount: issue.comments.filter((c) => c.id !== tempId).length,
        }));
        toast.error(
          "You're posting comments quickly — Pro removes this limit.",
          { duration: 5000 }
        );
        throw error;
      }

      patchIssue(targetIssueId, (issue) => ({
        ...issue,
        comments: issue.comments.map((comment) =>
          comment.id === tempId ? { ...comment, syncStatus: "failed" } : comment
        ),
      }));
      throw error;
    }
  };

  const handleAddActivity = (
    targetIssueId: string,
    event: IssueActivityEvent
  ) => {
    patchIssue(targetIssueId, (issue) => applyIssueActivityAdd(issue, event));
  };

  const handleEditComment = (
    targetIssueId: string,
    commentId: string,
    body: string
  ) => {
    patchIssue(targetIssueId, (issue) =>
      applyIssueCommentEdit(issue, commentId, body)
    );
  };

  const handleDeleteComment = (targetIssueId: string, commentId: string) => {
    patchIssue(targetIssueId, (issue) =>
      applyIssueCommentDelete(issue, commentId)
    );
  };

  const handleToggleReaction = (
    targetIssueId: string,
    commentId: string,
    emoji: string
  ) => {
    patchIssue(targetIssueId, (issue) =>
      applyIssueReactionToggle(issue, commentId, emoji)
    );
  };

  const handleProjectChange = (patch: Partial<Project>) => {
    if (!projectId) return;
    queryClient.setQueryData<Project>(
      projectsQueryKeys.detail(orgId, projectId),
      (prev) => (prev ? { ...prev, ...patch } : prev)
    );
  };

  const handleMutationError = (error: unknown, fallback: string) => {
    if (isSessionExpiredError(error)) return;
    toast.error(error instanceof Error ? error.message : fallback);
  };

  const handleUpdateProject = async (input: UpdateProjectInput) => {
    if (!projectId) return;
    try {
      await updateMutation.mutateAsync({ projectId, ...input });
    } catch (error) {
      handleMutationError(error, "Couldn't update this project");
      throw error;
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || deletePending) return;
    try {
      await deleteMutation.mutateAsync(projectId);
      toast.success("Project deleted");
      void navigate("/projects");
    } catch (error) {
      handleMutationError(error, "Couldn't delete this project");
      throw error;
    }
  };

  const handleArchiveProject = (navigateAway = false) => {
    if (!projectId || archivePending) return;
    archiveMutation.mutate(projectId, {
      onSuccess: () => {
        toast.success("Project archived");
        if (navigateAway) {
          void navigate("/projects");
        }
      },
      onError: (error) =>
        handleMutationError(error, "Couldn't archive project"),
    });
  };

  const handleRestoreProject = () => {
    if (!projectId || archivePending) return;
    unarchiveMutation.mutate(projectId, {
      onSuccess: () => {
        toast.success("Project unarchived");
      },
      onError: (error) =>
        handleMutationError(error, "Couldn't unarchive this project"),
    });
  };

  const renderIssuesContent = () => {
    if (issuesLoadState === "loading") {
      return viewMode === "table" ? (
        <IssuesTableSkeleton rows={6} flat />
      ) : (
        <IssuesTableSkeleton rows={3} flat />
      );
    }

    if (issuesLoadState === "error") {
      return <IssuesErrorState onRetry={retryIssues} />;
    }

    if (issues.length === 0 && !filtersActive) {
      return (
        <ProjectIssuesEmptyState
          onCreate={() => openNewIssueDialog()}
          canCreate={canCreate}
        />
      );
    }

    if (filteredIssues.length === 0 && filtersActive) {
      return (
        <IssuesFilterEmptyState
          onClear={() => handleFiltersChange(EMPTY_FILTERS)}
        />
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
          hideProjectColumn
        />
      );
    }

    return (
      <IssuesBoardView
        issues={filteredIssues}
        filters={filters}
        projectId={projectId}
        hideProjectBadge
        onIssueClick={openIssueDetail}
        onIssueUpdate={handleIssueUpdate}
        onQuickAdd={(_status, _projectId) => openNewIssueDialog(_status)}
        canCreate={canCreate}
      />
    );
  };

  const renderTabContent = () => {
    if (!project) return null;

    if (activeTab === "overview") {
      return (
        <Box px={{ base: "5", md: "10" }} py="8">
          <ProjectOverviewTab
            project={project}
            issues={issues}
            teamMembers={MOCK_TEAM_MEMBERS}
          />
        </Box>
      );
    }

    if (activeTab === "settings") {
      return (
        <Box px={{ base: "5", md: "10" }} py="8">
          <ProjectSettingsTab
            project={project}
            role={MOCK_ROLE}
            teamMembers={MOCK_TEAM_MEMBERS}
            onProjectChange={handleProjectChange}
            onArchive={() => handleArchiveProject(true)}
            onRestore={handleRestoreProject}
            onDelete={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onSwitchToIssues={() => setActiveTab("issues")}
            archivePending={archivePending}
            deletePending={deletePending}
            updatePending={updateMutation.isPending}
          />
        </Box>
      );
    }

    return (
      <>
        <Flex
          align="center"
          justify="flex-end"
          px={{ base: "5", md: "10" }}
          py="3"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
        >
          <IssuesViewToggle value={viewMode} onChange={setViewMode} />
        </Flex>

        <IssuesRefetchBar active={isRefetching} />
        <IssueFilterBar
          filters={filters}
          onChange={handleFiltersChange}
          projects={[]}
          teamMembers={MOCK_TEAM_MEMBERS}
          currentUserName={MOCK_CURRENT_USER}
          hideProjectFilter
        />

        <Box px={{ base: "5", md: "10" }} py="8">
          <Box key={`${viewMode}-${issuesLoadState}`} {...fadeInUp}>
            {renderIssuesContent()}
          </Box>
        </Box>
      </>
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
        {projectLoadState === "loading" && <ProjectDetailLoadingSkeleton />}

        {projectLoadState === "error" && (
          <Box px={{ base: "5", md: "10" }} py="8">
            <ProjectLoadErrorState onRetry={retryProject} />
          </Box>
        )}

        {projectLoadState === "not_found" && (
          <Box px={{ base: "5", md: "10" }} py="8">
            <ProjectNotFoundState />
          </Box>
        )}

        {projectLoadState === "success" && project && (
          <IssueDetailProvider
            value={{
              issues,
              role: MOCK_ROLE,
              currentUser: MOCK_CURRENT_USER,
              teamMembers: MOCK_TEAM_MEMBERS,
              onUpdate: handleIssueUpdate,
              onAddComment: handleAddComment,
              onAddActivity: handleAddActivity,
              onEditComment: handleEditComment,
              onDeleteComment: handleDeleteComment,
              onToggleReaction: handleToggleReaction,
              onDelete: (id) => handleIssuesDelete([id]),
              navigableIssueIds: filteredIssues.map((issue) => issue.id),
              onNavigateToIssue: (id) => {
                if (projectId) {
                  void navigate(issueDetailPath(projectId, id));
                }
              },
            }}
          >
            <ProjectDetailHeader
              project={project}
              stats={projectStats}
              statsLoading={issuesLoadState === "loading"}
              canEdit={canEdit}
              canCreateIssue={canCreate}
              canManage={canManage}
              onLogout={logout}
              onProjectChange={handleProjectChange}
              onUpdateProject={handleUpdateProject}
              onNewIssue={() => openNewIssueDialog()}
              onDeleteProject={handleDeleteProject}
              onArchive={() => handleArchiveProject()}
              onRestore={handleRestoreProject}
              archivePending={archivePending}
              deletePending={deletePending}
            />

            <ProjectDetailTabs
              value={activeTab}
              onChange={setActiveTab}
              showSettings={canManage}
            />

            <Box flex="1" overflowY="auto" position="relative">
              {renderTabContent()}
            </Box>

            <Outlet />

            <ProjectNewIssueDialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setDialogStatus(undefined);
              }}
              project={project}
              onCreate={(issue) => setIssues((prev) => [issue, ...prev])}
              nextNumber={nextIssueNumber}
              initialStatus={dialogStatus}
            />
          </IssueDetailProvider>
        )}
      </Box>
    </Flex>
  );
}
