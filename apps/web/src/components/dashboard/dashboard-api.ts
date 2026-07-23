import type { Issue } from "../issues/issue-types";
import {
  computeDashboardPulseStats,
  type DashboardPulseStats,
  type DashboardTrendBaselines,
  type PulseStat,
} from "./dashboard-stats";
import type { OrgActivityEvent } from "./dashboard-types";
import type { IssueListPreset } from "./issue-list-presets";
import {
  getOrgDashboardSnapshot,
  type OrgDashboardSnapshot,
} from "./mock-dashboard-data";

const STATS_DELAY_MS = 350;
const ACTIVITY_DELAY_MS = 850;

export interface DashboardStatsPayload {
  stats: DashboardPulseStats;
  issues: Issue[];
  trendBaselines: DashboardTrendBaselines;
}

export interface DashboardActivityPayload {
  issues: Issue[];
  supplementalActivity: OrgActivityEvent[];
}

export type DashboardStatPreset = IssueListPreset | "fourth";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function snapshotForOrg(orgId: string): OrgDashboardSnapshot {
  return getOrgDashboardSnapshot(orgId);
}

/** Fast path — pulse stats for the stat row. */
export async function fetchDashboardStatsMock(
  orgId: string,
  currentUserName: string,
  personalFourthCard: boolean,
  options?: { fail?: boolean; failCard?: DashboardStatPreset }
): Promise<DashboardStatsPayload> {
  await delay(STATS_DELAY_MS);

  if (options?.fail) {
    throw new Error("Failed to load dashboard stats");
  }

  const snapshot = snapshotForOrg(orgId);
  const stats = computeDashboardPulseStats(
    snapshot.issues,
    currentUserName,
    personalFourthCard,
    snapshot.trendBaselines
  );

  if (options?.failCard) {
    const failed = options.failCard;
    if (failed === "open") {
      throw new Error("Failed to load open issues stat");
    }
    if (failed === "in_progress") {
      throw new Error("Failed to load in progress stat");
    }
    if (failed === "done_week") {
      throw new Error("Failed to load completed stat");
    }
    if (failed === "fourth") {
      throw new Error("Failed to load fourth stat");
    }
    if (failed === "overdue" || failed === "assigned_me") {
      throw new Error("Failed to load fourth stat");
    }
  }

  return {
    stats,
    issues: snapshot.issues,
    trendBaselines: snapshot.trendBaselines,
  };
}

/** Heavier path — issues + supplemental events for feed sections. */
export async function fetchDashboardActivityMock(
  orgId: string,
  options?: { fail?: boolean }
): Promise<DashboardActivityPayload> {
  await delay(ACTIVITY_DELAY_MS);

  if (options?.fail) {
    throw new Error("Failed to load dashboard activity");
  }

  const snapshot = snapshotForOrg(orgId);
  return {
    issues: snapshot.issues,
    supplementalActivity: snapshot.supplementalActivity,
  };
}

/** Retry a single stat card without refetching the whole row. */
export async function fetchDashboardStatCardMock(
  orgId: string,
  preset: DashboardStatPreset,
  currentUserName: string,
  personalFourthCard: boolean
): Promise<PulseStat> {
  await delay(280);

  const snapshot = snapshotForOrg(orgId);
  const stats = computeDashboardPulseStats(
    snapshot.issues,
    currentUserName,
    personalFourthCard,
    snapshot.trendBaselines
  );

  switch (preset) {
    case "open":
      return stats.open;
    case "in_progress":
      return stats.inProgress;
    case "done_week":
      return stats.doneThisWeek;
    case "fourth":
    case "assigned_me":
    case "overdue":
      return stats.fourth;
  }
}
