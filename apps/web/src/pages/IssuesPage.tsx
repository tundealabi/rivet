import { Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiExport, PiPlusBold, PiSignOut } from "react-icons/pi";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getCurrentUserName, isSessionExpiredError } from "../auth-api";
import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import { useActiveOrg } from "../components/billing/use-active-org";
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
} from "../components/issues/issue-filters";
import {
  canCreateIssues,
  canDeleteIssues,
} from "../components/issues/issue-permissions";
import { type Issue } from "../components/issues/issue-types";
import {
  IssueFilterBar,
  type IssueFilters,
  type IssueStatus,
} from "../components/issues/IssueFilterBar";
import { refetchIssuesMock } from "../components/issues/issues-api";
import {
  EASE_OUT,
  fadeInUp,
  transition,
} from "../components/issues/issues-motion";
import { issuesQueryKeys } from "../components/issues/issues-query-keys";
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
import { MOCK_TEAM_MEMBERS } from "../components/issues/mock-issues-data";
import { NewIssueDialog } from "../components/issues/NewIssueDialog";
import {
  useDeleteIssueMutation,
  useOrgIssues,
} from "../components/issues/use-issues-queries";
import { useProjectsList } from "../components/projects/use-projects-queries";

type ViewMode = "table" | "board";
type LoadState = "loading" | "success" | "error";

const MOCK_ROLE = OrganizationRole.MEMBER;

function isOpenStatus(status: IssueStatus): boolean {
  return status !== "done" && status !== "cancelled";
}

export default function IssuesPage() {
  const [searchParams] = useSearchParams();
  const listPreset = parseIssueListPreset(searchParams.get("preset"));
  const { orgId } = useActiveOrg();
  const currentUser = getCurrentUserName();
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsList(orgId);
  const projects = projectsQuery.data ?? [];
  const issuesQuery = useOrgIssues(orgId, projects, {
    enabled: projectsQuery.isSuccess,
  });
  const deleteIssueMutation = useDeleteIssueMutation(orgId);
  const issues = useMemo(() => issuesQuery.data ?? [], [issuesQuery.data]);
  const issuesKey = issuesQueryKeys.orgList(
    orgId,
    projects.map((project) => project.id)
  );

  const loadState: LoadState =
    projectsQuery.isError || issuesQuery.isError
      ? "error"
      : !orgId || !projectsQuery.isSuccess || issuesQuery.isPending
        ? "loading"
        : "success";
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

  const setIssues = useCallback(
    (updater: (prev: Issue[]) => Issue[]) => {
      queryClient.setQueryData<Issue[]>(issuesKey, (prev) =>
        updater(prev ?? [])
      );
    },
    [issuesKey, queryClient]
  );

  const loadIssues = useCallback(() => {
    void Promise.all([projectsQuery.refetch(), issuesQuery.refetch()]);
  }, [issuesQuery, projectsQuery]);

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
    const base = filterIssues(issues, filters, currentUser);
    return applyIssueListPreset(base, listPreset, currentUser);
  }, [issues, filters, listPreset, currentUser]);

  const openCount = useMemo(
    () => issues.filter((i) => isOpenStatus(i.status)).length,
    [issues]
  );

  const filteredOpenCount = useMemo(
    () => filteredIssues.filter((i) => isOpenStatus(i.status)).length,
    [filteredIssues]
  );

  const filtersActive = hasActiveFilters(filters);

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
    queryClient.setQueryData<Issue>(
      issuesQueryKeys.detail(orgId, id),
      (prev) => (prev ? { ...prev, ...patch } : prev)
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setDialogDefaults({});
  };

  const handleIssuesDelete = async (ids: string[]) => {
    try {
      const { deleted, errors } = await deleteIssueMutation.mutateAsync(ids);
      if (errors.length > 0) {
        toast.error(`Deleted ${deleted.length} of ${ids.length} issues`);
        return;
      }
      toast.success(
        ids.length === 1 ? "Issue deleted" : `Deleted ${ids.length} issues`
      );
    } catch (error) {
      if (isSessionExpiredError(error)) return;
      toast.error(
        error instanceof Error ? error.message : "Couldn't delete this issue"
      );
      throw error;
    }
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
          <IssuesRefetchBar
            active={
              isRefetching || (issuesQuery.isFetching && !issuesQuery.isPending)
            }
          />
          <IssueFilterBar
            filters={filters}
            onChange={setFilters}
            projects={projects}
            teamMembers={MOCK_TEAM_MEMBERS}
            currentUserName={currentUser}
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
        orgId={orgId}
        projects={projects}
        projectsLoading={projectsQuery.isPending}
        projectsError={projectsQuery.isError}
        onCreated={(issue) =>
          setIssues((prev) =>
            prev.some((item) => item.id === issue.id) ? prev : [issue, ...prev]
          )
        }
        initialProjectId={dialogDefaults.projectId}
        initialStatus={dialogDefaults.status}
      />
    </Flex>
  );
}
