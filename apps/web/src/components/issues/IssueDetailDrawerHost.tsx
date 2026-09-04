import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useActiveOrg } from "../billing/use-active-org";
import {
  issueDetailFullPath,
  projectIssuesForDetail,
  useIssueDetailActions,
} from "./issue-detail-actions";
import { IssueDetailDrawer } from "./IssueDetailDrawer";
import { isIssueNotFoundError } from "./issues-api";
import { useIssue } from "./use-issues-queries";

export function IssueDetailDrawerHost() {
  const { projectId, issueId } = useParams<{
    projectId: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const { orgId } = useActiveOrg();
  const actions = useIssueDetailActions();

  const listedIssue =
    projectId && issueId
      ? actions.issues.find(
          (candidate) =>
            candidate.id === issueId && candidate.projectId === projectId
        )
      : undefined;

  const issueQuery = useIssue(orgId, issueId, {
    enabled: Boolean(orgId && issueId),
    projectColor: listedIssue?.projectColor,
  });

  const fetchedIssue =
    issueQuery.data && (!projectId || issueQuery.data.projectId === projectId)
      ? issueQuery.data
      : undefined;

  const issue = listedIssue ?? fetchedIssue;

  const issueMissing =
    Boolean(projectId && issueId) &&
    !issue &&
    !issueQuery.isPending &&
    !issueQuery.isFetching &&
    (isIssueNotFoundError(issueQuery.error) ||
      issueQuery.isSuccess ||
      issueQuery.isError);

  useEffect(() => {
    if (!projectId || !issueId) return;
    if (!issueMissing) return;
    void navigate(`/projects/${projectId}`, { replace: true });
  }, [projectId, issueId, issueMissing, navigate]);

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
