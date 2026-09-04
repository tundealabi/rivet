import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiArrowLeft } from "react-icons/pi";
import { useNavigate, useParams } from "react-router-dom";

import { getCurrentUserName, isSessionExpiredError } from "../auth-api";
import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import { useActiveOrg } from "../components/billing/use-active-org";
import { issueDetailPath } from "../components/issues/issue-detail-actions";
import {
  applyIssueActivityAdd,
  applyIssueCommentAdd,
  applyIssueCommentDelete,
  applyIssueCommentEdit,
  applyIssueReactionToggle,
} from "../components/issues/issue-detail-mutations";
import type {
  Issue,
  IssueActivityEvent,
} from "../components/issues/issue-types";
import { IssueDetailContent } from "../components/issues/IssueDetailContent";
import {
  CommentRateLimitError,
  isIssueNotFoundError,
  submitCommentMock,
} from "../components/issues/issues-api";
import { MOCK_TEAM_MEMBERS } from "../components/issues/mock-issues-data";
import {
  useDeleteIssueMutation,
  useIssue,
  useProjectIssues,
} from "../components/issues/use-issues-queries";
import { ProjectNotFoundState } from "../components/projects/ProjectPageStates";
import { isProjectNotFoundError } from "../components/projects/projects-api";
import { useProject } from "../components/projects/use-projects-queries";

const MOCK_ROLE = OrganizationRole.MEMBER;

export default function IssueDetailPage() {
  const { projectId, issueId } = useParams<{
    projectId: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const logout = useLogout();
  const { orgId } = useActiveOrg();
  const currentUser = getCurrentUserName();
  const projectQuery = useProject(orgId, projectId);
  const issueQuery = useIssue(orgId, issueId, {
    enabled: Boolean(orgId && issueId),
    projectColor: projectQuery.data?.color,
  });
  const issuesQuery = useProjectIssues(orgId, projectId, {
    enabled: Boolean(orgId && projectId && projectQuery.data),
    projectColor: projectQuery.data?.color,
  });
  const deleteIssueMutation = useDeleteIssueMutation(orgId);

  const listedIssue = useMemo(
    () =>
      issuesQuery.data?.find(
        (candidate) =>
          candidate.id === issueId && candidate.projectId === projectId
      ) ?? null,
    [issuesQuery.data, issueId, projectId]
  );
  const remoteIssue = useMemo(() => {
    if (!issueQuery.data || issueQuery.data.projectId !== projectId) {
      return null;
    }

    const projectColor = projectQuery.data?.color;
    if (projectColor && issueQuery.data.projectColor !== projectColor) {
      return { ...issueQuery.data, projectColor };
    }

    return issueQuery.data;
  }, [issueQuery.data, projectId, projectQuery.data?.color]);
  const [editedIssue, setEditedIssue] = useState<Issue | null>(null);

  if (editedIssue && (!issueId || editedIssue.id !== issueId)) {
    setEditedIssue(null);
  }

  const issue = editedIssue ?? listedIssue ?? remoteIssue;

  const projectIssues = useMemo(
    () =>
      (issuesQuery.data ?? []).map(({ id, projectKey, number, title }) => ({
        id,
        projectKey,
        number,
        title,
      })),
    [issuesQuery.data]
  );

  const projectMissing =
    !projectQuery.isPending &&
    (isProjectNotFoundError(projectQuery.error) || !projectQuery.data);
  const issueMissing =
    isIssueNotFoundError(issueQuery.error) ||
    (issueQuery.isSuccess &&
      !issueQuery.isPlaceholderData &&
      (!issueQuery.data || issueQuery.data.projectId !== projectId));
  const effectiveLoadState =
    !projectId || !issueId || projectMissing || issueMissing
      ? "not_found"
      : projectQuery.isPending || (!issue && issueQuery.isPending)
        ? "loading"
        : issueQuery.isError || !issue
          ? "not_found"
          : "success";

  const handleUpdate = (id: string, patch: Partial<Issue>) => {
    setEditedIssue((prev) => {
      const base = prev ?? listedIssue ?? remoteIssue;
      return base && base.id === id ? { ...base, ...patch } : prev;
    });
  };

  const patchListedIssue = (
    targetIssueId: string,
    updater: (issue: Issue) => Issue
  ) => {
    setEditedIssue((prev) => {
      const base = prev ?? listedIssue ?? remoteIssue;
      if (!base || base.id !== targetIssueId) return prev;
      return updater(base);
    });
  };

  const handleAddComment = async (targetIssueId: string, body: string) => {
    const tempId = `pending-${crypto.randomUUID()}`;
    patchListedIssue(targetIssueId, (issue) =>
      applyIssueCommentAdd(issue, body, currentUser, MOCK_TEAM_MEMBERS, {
        id: tempId,
        syncStatus: "pending",
      })
    );

    try {
      await submitCommentMock(targetIssueId, body);
      patchListedIssue(targetIssueId, (issue) => ({
        ...issue,
        comments: issue.comments.map((comment) =>
          comment.id === tempId
            ? { ...comment, id: crypto.randomUUID(), syncStatus: undefined }
            : comment
        ),
      }));
    } catch (error) {
      if (error instanceof CommentRateLimitError) {
        patchListedIssue(targetIssueId, (issue) => {
          const comments = issue.comments.filter((c) => c.id !== tempId);
          return { ...issue, comments, commentCount: comments.length };
        });
        toast.error(
          "You're posting comments quickly — Pro removes this limit.",
          { duration: 5000 }
        );
        throw error;
      }

      patchListedIssue(targetIssueId, (issue) => ({
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
    patchListedIssue(targetIssueId, (issue) =>
      applyIssueActivityAdd(issue, event)
    );
  };

  const handleEditComment = (
    targetIssueId: string,
    commentId: string,
    body: string
  ) => {
    patchListedIssue(targetIssueId, (issue) =>
      applyIssueCommentEdit(issue, commentId, body)
    );
  };

  const handleDeleteComment = (targetIssueId: string, commentId: string) => {
    patchListedIssue(targetIssueId, (issue) =>
      applyIssueCommentDelete(issue, commentId)
    );
  };

  const handleToggleReaction = (
    targetIssueId: string,
    commentId: string,
    emoji: string
  ) => {
    patchListedIssue(targetIssueId, (issue) =>
      applyIssueReactionToggle(issue, commentId, emoji)
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIssueMutation.mutateAsync([id]);
      toast.success("Issue deleted");
      void navigate(`/projects/${projectId}`);
    } catch (error) {
      if (isSessionExpiredError(error)) return;
      toast.error(
        error instanceof Error ? error.message : "Couldn't delete this issue"
      );
      throw error;
    }
  };

  const collapseToDrawer = () => {
    if (projectId && issueId) {
      void navigate(issueDetailPath(projectId, issueId));
    }
  };

  const backToProject = () => {
    if (projectId) {
      void navigate(`/projects/${projectId}`);
    } else {
      void navigate("/projects");
    }
  };

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />

      <Box flex="1" minW="0" display="flex" flexDirection="column">
        <Flex
          align="center"
          gap="3"
          px={{ base: "5", md: "10" }}
          py="4"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
        >
          <Button
            variant="ghost"
            size="sm"
            borderRadius="control"
            color="fg.secondary"
            onClick={backToProject}
          >
            <PiArrowLeft size={16} />
            Back to project
          </Button>
        </Flex>

        {effectiveLoadState === "loading" && (
          <Box px={{ base: "5", md: "10" }} py="10">
            <Text color="fg.muted" fontSize="sm">
              Loading issue…
            </Text>
          </Box>
        )}

        {effectiveLoadState === "not_found" && (
          <Box px={{ base: "5", md: "10" }} py="8">
            <ProjectNotFoundState />
          </Box>
        )}

        {effectiveLoadState === "success" && issue && (
          <Box flex="1" overflowY="auto">
            <IssueDetailContent
              issue={issue}
              variant="page"
              role={MOCK_ROLE}
              currentUser={currentUser}
              teamMembers={MOCK_TEAM_MEMBERS}
              projectIssues={projectIssues}
              onUpdate={handleUpdate}
              onAddComment={handleAddComment}
              onAddActivity={handleAddActivity}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onToggleReaction={handleToggleReaction}
              onDelete={handleDelete}
              onClose={backToProject}
              onCollapse={collapseToDrawer}
              onNavigateToProject={backToProject}
            />
          </Box>
        )}
      </Box>
    </Flex>
  );
}
