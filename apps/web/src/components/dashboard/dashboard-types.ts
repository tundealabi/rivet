export type OrgActivityKind =
  | "issue_created"
  | "issue_closed"
  | "comment_added"
  | "member_joined"
  | "project_created";

export interface OrgActivityEvent {
  id: string;
  kind: OrgActivityKind;
  actor: string;
  actorInitials: string;
  timestamp: Date;
  /** Sentence before the middle dot detail, e.g. "Jane created issue WEB-142" */
  lead: string;
  /** Detail after the dot, e.g. "Fix hero button alignment" */
  detail: string;
  projectKey?: string;
  projectName?: string;
  projectColor?: string;
  href: string;
  /** Issue assignee / reporter — used for personal feed filtering */
  issueAssignee?: string | null;
  issueReporter?: string;
  projectId?: string;
}

export interface DashboardMention {
  id: string;
  author: string;
  issueId: string;
  projectId: string;
  issueKey: string;
  issueTitle: string;
  timestamp: Date;
}

export interface ProjectGlanceItem {
  id: string;
  name: string;
  key: string;
  color: string;
  openCount: number;
  inProgressCount: number;
  donePercent: number;
  lastActiveAt: Date;
}
