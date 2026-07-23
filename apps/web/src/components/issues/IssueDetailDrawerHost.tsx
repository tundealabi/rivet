import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  issueDetailFullPath,
  projectIssuesForDetail,
  useIssueDetailActions,
} from "./issue-detail-context";
import { IssueDetailDrawer } from "./IssueDetailDrawer";

export function IssueDetailDrawerHost() {
  const { projectId, issueId } = useParams<{
    projectId: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const actions = useIssueDetailActions();

  const issue =
    projectId && issueId
      ? actions.issues.find(
          (candidate) =>
            candidate.id === issueId && candidate.projectId === projectId
        )
      : undefined;

  useEffect(() => {
    if (!projectId || !issueId) return;
    if (!issue) {
      void navigate(`/projects/${projectId}`, { replace: true });
    }
  }, [projectId, issueId, issue, navigate]);

  if (!projectId || !issueId || !issue) return null;

  const close = () => {
    void navigate(`/projects/${projectId}`);
  };

  const goToProject = () => {
    void navigate(`/projects/${projectId}`);
  };

  const expand = () => {
    void navigate(issueDetailFullPath(projectId, issueId));
  };

  return (
    <IssueDetailDrawer
      issue={issue}
      open
      onClose={close}
      onExpand={expand}
      onNavigateToProject={goToProject}
      role={actions.role}
      currentUser={actions.currentUser}
      teamMembers={actions.teamMembers}
      projectIssues={projectIssuesForDetail(actions.issues, projectId)}
      onUpdate={actions.onUpdate}
      onAddComment={actions.onAddComment}
      onAddActivity={actions.onAddActivity}
      onEditComment={actions.onEditComment}
      onDeleteComment={actions.onDeleteComment}
      onToggleReaction={actions.onToggleReaction}
      onDelete={actions.onDelete}
      navigableIssueIds={actions.navigableIssueIds}
      onNavigateToIssue={actions.onNavigateToIssue}
    />
  );
}
