import { Grid, GridItem, Skeleton, Stack } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { BillingData } from "../billing/billing-types";
import { issueDetailPath } from "../issues/issue-detail-context";
import type { Issue } from "../issues/issue-types";
import type { PendingInvite } from "../members/member-types";
import { countSeatsUsed } from "../members/member-types";
import { MOCK_MEMBERS } from "../members/mock-members-data";
import type { ProjectSummary } from "../projects/project-types";
import {
  buildOrgActivityFeed,
  buildProjectGlanceItems,
  filterActivityForRole,
  sortMyIssues,
} from "./dashboard-content";
import {
  canCreateProjectFromDashboard,
  canViewDashboardPendingInvites,
  canViewUsageSnapshot,
  usesPersonalActivityFeed,
} from "./dashboard-permissions";
import type { DashboardMention, OrgActivityEvent } from "./dashboard-types";
import { DashboardMentionsSection } from "./DashboardMentionsSection";
import { DashboardMyIssuesSection } from "./DashboardMyIssuesSection";
import { DashboardPendingInvitesSection } from "./DashboardPendingInvitesSection";
import { DashboardProjectsGlanceSection } from "./DashboardProjectsGlanceSection";
import { DashboardRecentActivitySection } from "./DashboardRecentActivitySection";
import { DashboardUsageSnapshot } from "./DashboardUsageSnapshot";
import { issuesPathForPreset } from "./issue-list-presets";

interface DashboardMainGridProps {
  projects: ProjectSummary[];
  issues: Issue[];
  supplementalActivity: OrgActivityEvent[];
  mentions: DashboardMention[];
  pendingInvites: PendingInvite[];
  currentUserName: string;
  role: OrganizationRole;
  billing?: BillingData | null;
  activityLoading?: boolean;
  activityError?: boolean;
  onRetryActivity?: () => void;
  suggestBrowseProjects?: boolean;
}

export function DashboardMainGrid({
  projects,
  issues,
  supplementalActivity,
  mentions,
  pendingInvites,
  currentUserName,
  role,
  billing,
  activityLoading = false,
  activityError = false,
  onRetryActivity,
  suggestBrowseProjects = false,
}: DashboardMainGridProps) {
  const navigate = useNavigate();

  const myIssues = useMemo(
    () => sortMyIssues(issues, currentUserName),
    [issues, currentUserName]
  );

  const activity = useMemo(() => {
    const feed = buildOrgActivityFeed(issues, supplementalActivity, 12);
    if (!usesPersonalActivityFeed(role)) return feed;
    return filterActivityForRole(feed, role, currentUserName, issues);
  }, [issues, supplementalActivity, role, currentUserName]);

  const projectGlance = useMemo(
    () => buildProjectGlanceItems(projects, issues, 5),
    [projects, issues]
  );

  const showPendingInvites =
    canViewDashboardPendingInvites(role) && pendingInvites.length > 0;
  const showMentions = mentions.length > 0;

  const seatsUsed = useMemo(
    () => countSeatsUsed(MOCK_MEMBERS, pendingInvites),
    [pendingInvites]
  );

  const planTier = billing?.subscription.planTier ?? "PRO";

  return (
    <Grid
      templateColumns={{ base: "1fr", lg: "3fr 2fr" }}
      gap={{ base: "5", lg: "6" }}
      mt="6"
      alignItems="start"
    >
      <GridItem minW="0">
        <Stack gap="5">
          <DashboardMyIssuesSection
            issues={myIssues}
            suggestBrowseProjects={suggestBrowseProjects}
            onIssueClick={(issue) =>
              void navigate(issueDetailPath(issue.projectId, issue.id))
            }
            onBrowseOpen={() => void navigate(issuesPathForPreset("open"))}
            onBrowseProjects={() => void navigate("/projects")}
          />
          {activityLoading ? (
            <Skeleton h="72" borderRadius="card" css={shimmerStyle} />
          ) : (
            <DashboardRecentActivitySection
              events={activity}
              error={activityError}
              onRetry={onRetryActivity}
            />
          )}
        </Stack>
      </GridItem>

      <GridItem minW="0">
        <Stack gap="5">
          <DashboardProjectsGlanceSection
            projects={projectGlance}
            canCreate={canCreateProjectFromDashboard(role)}
            onCreateProject={() => void navigate("/projects")}
          />

          {showPendingInvites && (
            <DashboardPendingInvitesSection invites={pendingInvites} />
          )}

          {showMentions && <DashboardMentionsSection mentions={mentions} />}

          {canViewUsageSnapshot(role) && (
            <DashboardUsageSnapshot planTier={planTier} seatsUsed={seatsUsed} />
          )}
        </Stack>
      </GridItem>
    </Grid>
  );
}

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function DashboardMainGridSkeleton() {
  return (
    <Grid
      templateColumns={{ base: "1fr", lg: "3fr 2fr" }}
      gap={{ base: "5", lg: "6" }}
      mt="6"
      alignItems="start"
    >
      <GridItem minW="0">
        <Stack gap="5">
          <Skeleton h="56" borderRadius="card" css={shimmerStyle} />
          <Skeleton h="72" borderRadius="card" css={shimmerStyle} />
        </Stack>
      </GridItem>
      <GridItem minW="0">
        <Skeleton h="48" borderRadius="card" css={shimmerStyle} />
      </GridItem>
    </Grid>
  );
}
