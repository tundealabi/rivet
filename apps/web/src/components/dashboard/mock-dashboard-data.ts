import type { Issue } from "../issues/issue-types";
import { seedIssueComments } from "../issues/mock-issue-comments";
import { MOCK_ISSUES } from "../issues/mock-issues-data";
import type { PendingInvite } from "../members/member-types";
import { MOCK_PENDING_INVITES } from "../members/mock-members-data";
import { MOCK_PROJECT_SUMMARIES } from "../projects/mock-projects-data";
import type { ProjectSummary } from "../projects/project-types";
import type { DashboardMention, OrgActivityEvent } from "./dashboard-types";

const GLOBEX_RAW_ISSUES: Omit<
  Issue,
  "comments" | "commentCount" | "activity" | "labels" | "watchers"
>[] = [
  {
    id: "g1",
    number: 12,
    title: "Migrate billing webhooks",
    description: "Move Stripe webhook handlers to the new queue.",
    status: "in_progress",
    priority: "high",
    assignee: "Grace Hopper",
    assigneeInitials: "GH",
    reporter: "Ada Lovelace",
    reporterInitials: "AL",
    projectId: "gp1",
    projectKey: "OPS",
    projectName: "Platform Ops",
    projectColor: "#7C3AED",
    dueDate: new Date("2026-07-25T17:00:00"),
    createdAt: new Date("2026-07-18T09:00:00"),
    updatedAt: new Date("2026-07-22T10:00:00"),
  },
  {
    id: "g2",
    number: 11,
    title: "Audit SSO configuration",
    description: "Verify SAML metadata for enterprise customers.",
    status: "todo",
    priority: "medium",
    assignee: null,
    assigneeInitials: null,
    reporter: "Ada Lovelace",
    reporterInitials: "AL",
    projectId: "gp1",
    projectKey: "OPS",
    projectName: "Platform Ops",
    projectColor: "#7C3AED",
    dueDate: new Date("2026-07-20T17:00:00"),
    createdAt: new Date("2026-07-16T11:00:00"),
    updatedAt: new Date("2026-07-21T14:00:00"),
  },
  {
    id: "g3",
    number: 10,
    title: "Ship onboarding checklist",
    description: "Document first-week tasks for new admins.",
    status: "done",
    priority: "low",
    assignee: "Grace Hopper",
    assigneeInitials: "GH",
    reporter: "Ada Lovelace",
    reporterInitials: "AL",
    projectId: "gp1",
    projectKey: "OPS",
    projectName: "Platform Ops",
    projectColor: "#7C3AED",
    dueDate: null,
    createdAt: new Date("2026-07-10T08:00:00"),
    updatedAt: new Date("2026-07-22T16:30:00"),
  },
];

const GLOBEX_PROJECTS: ProjectSummary[] = [
  {
    id: "gp1",
    name: "Platform Ops",
    key: "OPS",
    color: "#7C3AED",
  },
];

const ACME_SUPPLEMENTAL_ACTIVITY: OrgActivityEvent[] = [
  {
    id: "act-member-1",
    kind: "member_joined",
    actor: "Katherine Johnson",
    actorInitials: "KJ",
    timestamp: new Date("2026-07-21T10:00:00"),
    lead: "Katherine Johnson joined the organization",
    detail: "Acme Inc.",
    href: "/members",
  },
  {
    id: "act-project-1",
    kind: "project_created",
    actor: "Ada Lovelace",
    actorInitials: "AL",
    timestamp: new Date("2026-07-01T09:30:00"),
    lead: "Ada Lovelace created project WEB",
    detail: "Website Redesign",
    projectKey: "WEB",
    projectName: "Website Redesign",
    projectColor: "#16A34A",
    projectId: "p4",
    href: "/projects/p4",
  },
];

const ACME_MENTIONS: DashboardMention[] = [
  {
    id: "m1",
    author: "Grace Hopper",
    issueId: "i3",
    projectId: "p3",
    issueKey: "DS-140",
    issueTitle: "Update button component tokens",
    timestamp: new Date("2026-07-22T15:20:00"),
  },
  {
    id: "m2",
    author: "Alan Turing",
    issueId: "i2",
    projectId: "p2",
    issueKey: "API-141",
    issueTitle: "Add pagination to issues list",
    timestamp: new Date("2026-07-22T09:45:00"),
  },
];

const GREENHOUSE_PROJECTS: ProjectSummary[] = [
  {
    id: "gh1",
    name: "Product Launch",
    key: "LNCH",
    color: "#0891B2",
  },
  {
    id: "gh2",
    name: "Customer Research",
    key: "RSCH",
    color: "#DB2777",
  },
];

export interface OrgDashboardSnapshot {
  projects: ProjectSummary[];
  issues: Issue[];
  trendBaselines: {
    open: number;
    inProgress: number;
    doneThisWeek: number;
    assignedToMe: number;
  };
  supplementalActivity: OrgActivityEvent[];
  mentions: DashboardMention[];
  pendingInvites: PendingInvite[];
}

export function getOrgDashboardSnapshot(orgId: string): OrgDashboardSnapshot {
  switch (orgId) {
    case "org_globex":
      return {
        projects: GLOBEX_PROJECTS,
        issues: GLOBEX_RAW_ISSUES.map(seedIssueComments),
        trendBaselines: {
          open: 4,
          inProgress: 1,
          doneThisWeek: 1,
          assignedToMe: 2,
        },
        supplementalActivity: [],
        mentions: [],
        pendingInvites: [],
      };
    case "org_greenhouse":
      return {
        projects: GREENHOUSE_PROJECTS,
        issues: [],
        trendBaselines: {
          open: 0,
          inProgress: 0,
          doneThisWeek: 0,
          assignedToMe: 0,
        },
        supplementalActivity: [],
        mentions: [],
        pendingInvites: [],
      };
    case "org_side":
      return {
        projects: [],
        issues: [],
        trendBaselines: {
          open: 0,
          inProgress: 0,
          doneThisWeek: 0,
          assignedToMe: 0,
        },
        supplementalActivity: [],
        mentions: [],
        pendingInvites: [],
      };
    default:
      return {
        projects: MOCK_PROJECT_SUMMARIES,
        issues: MOCK_ISSUES,
        trendBaselines: {
          open: 47,
          inProgress: 15,
          doneThisWeek: 19,
          assignedToMe: 5,
        },
        supplementalActivity: ACME_SUPPLEMENTAL_ACTIVITY,
        mentions: ACME_MENTIONS,
        pendingInvites: MOCK_PENDING_INVITES.filter(
          (invite) => invite.status === "pending"
        ),
      };
  }
}
