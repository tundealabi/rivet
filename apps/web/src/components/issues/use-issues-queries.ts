import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Issue } from "./issue-types";
import {
  createIssue,
  type CreateIssueInput,
  deleteIssue,
  fetchAllProjectIssues,
  fetchIssue,
  fetchIssuesForProjects,
  fetchIssueSummary,
  isIssueNotFoundError,
  isIssuesNotFoundError,
  issueFieldsFromUpdate,
  updateIssue,
  type UpdateIssueInput,
} from "./issues-api";
import { issuesQueryKeys } from "./issues-query-keys";

function prependIssueInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  issue: Issue
) {
  queryClient.setQueryData(issuesQueryKeys.detail(orgId, issue.id), issue);
  queryClient.setQueriesData<Issue[]>(
    { queryKey: issuesQueryKeys.all(orgId) },
    (prev) => {
      if (!Array.isArray(prev)) return prev;
      if (prev.some((item) => item.id === issue.id)) return prev;
      return [issue, ...prev];
    }
  );
}

function findCachedIssue(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  issueId: string
): Issue | undefined {
  const entries = queryClient.getQueriesData<Issue[]>({
    queryKey: issuesQueryKeys.all(orgId),
  });

  for (const [, data] of entries) {
    if (!Array.isArray(data)) continue;
    const match = data.find((item) => item.id === issueId);
    if (match) return match;
  }

  return undefined;
}

function toIssueList(issues: unknown): Issue[] {
  return issues as Issue[];
}

export function useProjectIssues(
  orgId: string,
  projectId: string | undefined,
  options?: { enabled?: boolean; projectColor?: string }
): UseQueryResult<Issue[]> {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: issuesQueryKeys.projectList(orgId, projectId ?? ""),
    queryFn: async () =>
      toIssueList(
        await fetchAllProjectIssues(
          orgId,
          { projectId: projectId ?? "" },
          { projectColor: options?.projectColor }
        )
      ),
    enabled: Boolean(orgId && projectId) && enabled,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      isIssuesNotFoundError(error) ? false : failureCount < 1,
  });
}

export function useOrgIssues(
  orgId: string,
  projects: { color?: string; id: string }[] | undefined,
  options?: { enabled?: boolean }
) {
  const projectList = projects ?? [];
  const projectIds = projectList.map((project) => project.id);
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: issuesQueryKeys.orgList(orgId, projectIds),
    queryFn: async () =>
      toIssueList(await fetchIssuesForProjects(orgId, projectList)),
    enabled: Boolean(orgId) && enabled,
    refetchOnWindowFocus: true,
  });
}

export function useIssue(
  orgId: string,
  issueId: string | undefined,
  options?: { enabled?: boolean; projectColor?: string }
): UseQueryResult<Issue> {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: issuesQueryKeys.detail(orgId, issueId ?? ""),
    queryFn: () =>
      fetchIssue(orgId, issueId ?? "", {
        projectColor: options?.projectColor,
      }),
    enabled: Boolean(orgId && issueId) && enabled,
    placeholderData: () =>
      issueId ? findCachedIssue(queryClient, orgId, issueId) : undefined,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      isIssueNotFoundError(error) ? false : failureCount < 1,
  });
}

export function useProjectIssueSummary(
  orgId: string,
  projectId: string | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: issuesQueryKeys.summary(orgId, projectId ?? ""),
    queryFn: () => fetchIssueSummary(orgId, projectId ?? ""),
    enabled: Boolean(orgId && projectId) && enabled,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      isIssuesNotFoundError(error) ? false : failureCount < 1,
  });
}

export function useCreateIssueMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      input: CreateIssueInput;
      extras?: { projectColor?: string };
    }) => createIssue(orgId, vars.input, vars.extras),
    onSuccess: (issue) => {
      prependIssueInCaches(queryClient, orgId, issue);
      void queryClient.invalidateQueries({
        queryKey: issuesQueryKeys.all(orgId),
      });
    },
  });
}

function applyUpdatedIssueToCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  issue: Issue
) {
  const patch = issueFieldsFromUpdate(issue);

  queryClient.setQueryData<Issue>(
    issuesQueryKeys.detail(orgId, issue.id),
    (prev) => (prev ? { ...prev, ...patch } : issue)
  );
  queryClient.setQueriesData<Issue[]>(
    { queryKey: issuesQueryKeys.all(orgId) },
    (prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((item) =>
        item.id === issue.id ? { ...item, ...patch } : item
      );
    }
  );
}

export function useUpdateIssueMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      extras?: { projectColor?: string };
      input: UpdateIssueInput;
      issueId: string;
    }) => updateIssue(orgId, vars.issueId, vars.input, vars.extras),
    onSuccess: (issue, vars) => {
      applyUpdatedIssueToCaches(queryClient, orgId, issue);
      if (vars.input.status !== undefined) {
        void queryClient.invalidateQueries({
          queryKey: issuesQueryKeys.summary(orgId, issue.projectId),
        });
      }
    },
  });
}

export interface DeleteIssuesResult {
  deleted: Issue[];
  errors: unknown[];
}

function applyDeletedIssueToCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  issueId: string,
  projectId: string
) {
  queryClient.removeQueries({
    queryKey: issuesQueryKeys.detail(orgId, issueId),
  });
  queryClient.setQueriesData<Issue[]>(
    { queryKey: issuesQueryKeys.all(orgId) },
    (prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.filter((item) => item.id !== issueId);
    }
  );
  void queryClient.invalidateQueries({
    queryKey: issuesQueryKeys.summary(orgId, projectId),
  });
}

export function useDeleteIssueMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueIds: string[]): Promise<DeleteIssuesResult> => {
      const uniqueIds = [...new Set(issueIds)];
      const results = await Promise.allSettled(
        uniqueIds.map((issueId) => deleteIssue(orgId, issueId))
      );

      const deleted: Issue[] = [];
      const errors: unknown[] = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          deleted.push(result.value);
        } else {
          errors.push(result.reason);
        }
      }

      if (deleted.length === 0) {
        throw errors[0] instanceof Error
          ? errors[0]
          : new Error("Couldn't delete this issue");
      }

      return { deleted, errors };
    },
    onSuccess: ({ deleted }) => {
      for (const issue of deleted) {
        applyDeletedIssueToCaches(
          queryClient,
          orgId,
          issue.id,
          issue.projectId
        );
      }
    },
  });
}
