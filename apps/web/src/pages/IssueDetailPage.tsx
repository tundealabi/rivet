import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiArrowLeft } from "react-icons/pi";
import { useNavigate, useParams } from "react-router-dom";

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
  fetchIssuesMock,
  submitCommentMock,
} from "../components/issues/issues-api";
import {
  MOCK_CURRENT_USER,
  MOCK_ISSUES,
  MOCK_TEAM_MEMBERS,
} from "../components/issues/mock-issues-data";
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
  const projectQuery = useProject(orgId, projectId);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loadState, setLoadState] = useState<
    "loading" | "success" | "not_found"
  >("loading");

  const projectIssues = useMemo(
    () =>
      MOCK_ISSUES.filter((candidate) => candidate.projectId === projectId).map(
        ({ id, projectKey, number, title }) => ({
          id,
          projectKey,
          number,
          title,
        })
      ),
    [projectId]
  );

  const [prevParams, setPrevParams] = useState({ issueId, projectId });

  if (prevParams.projectId !== projectId || prevParams.issueId !== issueId) {
    setPrevParams({ issueId, projectId });
    setIssue(null);
    setLoadState("loading");
  }

  const projectMissing =
    !projectQuery.isPending &&
    (isProjectNotFoundError(projectQuery.error) || !projectQuery.data);
  const effectiveLoadState =
    !projectId || !issueId || projectMissing ? "not_found" : loadState;

  useEffect(() => {
    if (!projectId || !issueId) return;
    if (projectQuery.isPending) return;
    if (isProjectNotFoundError(projectQuery.error) || !projectQuery.data) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const issues = await fetchIssuesMock(MOCK_ISSUES);
      if (cancelled) return;
      const match = issues.find(
        (candidate) =>
          candidate.id === issueId && candidate.projectId === projectId
      );

      if (!match) {
        setIssue(null);
        setLoadState("not_found");
        return;
      }

      setIssue(match);
      setLoadState("success");
    };

    load().catch(() => {
      if (!cancelled) {
        setIssue(null);
        setLoadState("not_found");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    issueId,
    projectQuery.isPending,
    projectQuery.data,
    projectQuery.error,
  ]);

  const handleUpdate = (id: string, patch: Partial<Issue>) => {
    setIssue((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const handleAddComment = async (targetIssueId: string, body: string) => {
    const tempId = `pending-${crypto.randomUUID()}`;
    setIssue((prev) => {
      if (!prev || prev.id !== targetIssueId) return prev;
      return applyIssueCommentAdd(
        prev,
        body,
        MOCK_CURRENT_USER,
        MOCK_TEAM_MEMBERS,
        { id: tempId, syncStatus: "pending" }
      );
    });

    try {
      await submitCommentMock(targetIssueId, body);
      setIssue((prev) => {
        if (!prev || prev.id !== targetIssueId) return prev;
        return {
          ...prev,
          comments: prev.comments.map((comment) =>
            comment.id === tempId
              ? { ...comment, id: crypto.randomUUID(), syncStatus: undefined }
              : comment
          ),
        };
      });
    } catch (error) {
      if (error instanceof CommentRateLimitError) {
        setIssue((prev) => {
          if (!prev || prev.id !== targetIssueId) return prev;
          const comments = prev.comments.filter((c) => c.id !== tempId);
          return { ...prev, comments, commentCount: comments.length };
        });
        toast.error(
          "You're posting comments quickly — Pro removes this limit.",
          { duration: 5000 }
        );
        throw error;
      }

      setIssue((prev) => {
        if (!prev || prev.id !== targetIssueId) return prev;
        return {
          ...prev,
          comments: prev.comments.map((comment) =>
            comment.id === tempId
              ? { ...comment, syncStatus: "failed" }
              : comment
          ),
        };
      });
      throw error;
    }
  };

  const handleAddActivity = (
    targetIssueId: string,
    event: IssueActivityEvent
  ) => {
    setIssue((prev) => {
      if (!prev || prev.id !== targetIssueId) return prev;
      return applyIssueActivityAdd(prev, event);
    });
  };

  const handleEditComment = (
    targetIssueId: string,
    commentId: string,
    body: string
  ) => {
    setIssue((prev) => {
      if (!prev || prev.id !== targetIssueId) return prev;
      return applyIssueCommentEdit(prev, commentId, body);
    });
  };

  const handleDeleteComment = (targetIssueId: string, commentId: string) => {
    setIssue((prev) => {
      if (!prev || prev.id !== targetIssueId) return prev;
      return applyIssueCommentDelete(prev, commentId);
    });
  };

  const handleToggleReaction = (
    targetIssueId: string,
    commentId: string,
    emoji: string
  ) => {
    setIssue((prev) => {
      if (!prev || prev.id !== targetIssueId) return prev;
      return applyIssueReactionToggle(prev, commentId, emoji);
    });
  };

  const handleDelete = (id: string) => {
    if (issue?.id === id) {
      void navigate(`/projects/${projectId}`);
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
              currentUser={MOCK_CURRENT_USER}
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
