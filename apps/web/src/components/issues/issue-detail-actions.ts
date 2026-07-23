import type { OrganizationRole } from "@rivet/shared";
import { createContext, useContext } from "react";

import type { Issue, IssueActivityEvent, TeamMember } from "./issue-types";

export interface IssueDetailActions {
  issues: Issue[];
  role: OrganizationRole;
  currentUser: string;
  teamMembers: TeamMember[];
  onUpdate: (id: string, patch: Partial<Issue>) => void;
  onAddComment: (issueId: string, body: string) => Promise<void>;
  onAddActivity: (issueId: string, event: IssueActivityEvent) => void;
  onEditComment: (issueId: string, commentId: string, body: string) => void;
  onDeleteComment: (issueId: string, commentId: string) => void;
  onToggleReaction: (issueId: string, commentId: string, emoji: string) => void;
  onDelete: (id: string) => void;
  navigableIssueIds?: string[];
  onNavigateToIssue?: (issueId: string) => void;
}

export const IssueDetailContext = createContext<IssueDetailActions | null>(
  null
);

export function useIssueDetailActions(): IssueDetailActions {
  const ctx = useContext(IssueDetailContext);
  if (!ctx) {
    throw new Error(
      "useIssueDetailActions must be used within IssueDetailProvider"
    );
  }
  return ctx;
}

export function issueDetailPath(projectId: string, issueId: string): string {
  return `/projects/${projectId}/issues/${issueId}`;
}

export function issueDetailFullPath(
  projectId: string,
  issueId: string
): string {
  return `/projects/${projectId}/issues/${issueId}/full`;
}

export function projectIssuesForDetail(
  issues: Issue[],
  projectId: string
): Pick<Issue, "id" | "projectKey" | "number" | "title">[] {
  return issues
    .filter((issue) => issue.projectId === projectId)
    .map(({ id, projectKey, number, title }) => ({
      id,
      projectKey,
      number,
      title,
    }));
}
