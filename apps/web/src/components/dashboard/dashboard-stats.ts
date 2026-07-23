import type { Issue } from "../issues/issue-types";
import { isIssueOverdue } from "../issues/issue-types";
import { OPEN_STATUSES } from "./issue-list-presets";

export interface StatTrend {
  delta: number;
  direction: "up" | "down" | "flat";
  label: string;
  tone: "positive" | "negative" | "neutral" | "warning";
}

export interface PulseStat {
  value: number;
  trend: StatTrend | null;
  alert?: boolean;
}

export interface DashboardPulseStats {
  open: PulseStat;
  inProgress: PulseStat;
  doneThisWeek: PulseStat;
  fourth: PulseStat;
  fourthLabel: "Overdue" | "Assigned to me";
}

function isWithinDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date.getTime() >= cutoff.getTime();
}

function countOpen(issues: Issue[]): number {
  return issues.filter((issue) => OPEN_STATUSES.includes(issue.status)).length;
}

function countInProgress(issues: Issue[]): number {
  return issues.filter((issue) => issue.status === "in_progress").length;
}

function countDoneThisWeek(issues: Issue[]): number {
  return issues.filter(
    (issue) => issue.status === "done" && isWithinDays(issue.updatedAt, 7)
  ).length;
}

function countOverdue(issues: Issue[]): number {
  return issues.filter((issue) => isIssueOverdue(issue)).length;
}

function countAssignedToMe(issues: Issue[], currentUserName: string): number {
  return issues.filter((issue) => issue.assignee === currentUserName).length;
}

function trendFromDelta(
  delta: number,
  options: {
    invertSentiment?: boolean;
    positiveFraming?: boolean;
    emptyLabel?: string;
  } = {}
): StatTrend {
  const {
    invertSentiment = false,
    positiveFraming = false,
    emptyLabel,
  } = options;

  if (delta === 0) {
    return {
      delta: 0,
      direction: "flat",
      label: emptyLabel ?? "No change from last week",
      tone: "neutral",
    };
  }

  const direction = delta > 0 ? "up" : "down";
  const magnitude = Math.abs(delta);
  const label = `${direction === "up" ? "↑" : "↓"} ${magnitude} from last week`;

  let tone: StatTrend["tone"] = "neutral";
  if (positiveFraming) {
    tone = delta >= 0 ? "positive" : "warning";
  } else if (invertSentiment) {
    tone = delta < 0 ? "positive" : "warning";
  } else {
    tone = delta > 0 ? "warning" : "positive";
  }

  return { delta, direction, label, tone };
}

function overdueTrend(count: number): StatTrend | null {
  if (count === 0) return null;
  return {
    delta: count,
    direction: "up",
    label: "Needs attention",
    tone: "warning",
  };
}

function assignedTrend(count: number, delta: number): StatTrend {
  if (count === 0) {
    return {
      delta: 0,
      direction: "flat",
      label: "Nothing assigned right now",
      tone: "neutral",
    };
  }
  return trendFromDelta(delta, { emptyLabel: "Same as last week" });
}

/** Week-over-week deltas are mocked until historical snapshots exist in the API. */
export interface DashboardTrendBaselines {
  open: number;
  inProgress: number;
  doneThisWeek: number;
  assignedToMe: number;
}

const DEFAULT_TREND_BASELINES: DashboardTrendBaselines = {
  open: 47,
  inProgress: 15,
  doneThisWeek: 19,
  assignedToMe: 5,
};

export function computeDashboardPulseStats(
  issues: Issue[],
  currentUserName: string,
  personalFourthCard: boolean,
  baselines: DashboardTrendBaselines = DEFAULT_TREND_BASELINES
): DashboardPulseStats {
  const open = countOpen(issues);
  const inProgress = countInProgress(issues);
  const doneThisWeek = countDoneThisWeek(issues);
  const overdue = countOverdue(issues);
  const assignedToMe = countAssignedToMe(issues, currentUserName);

  return {
    open: {
      value: open,
      trend: trendFromDelta(open - baselines.open, { invertSentiment: true }),
    },
    inProgress: {
      value: inProgress,
      trend: trendFromDelta(inProgress - baselines.inProgress),
    },
    doneThisWeek: {
      value: doneThisWeek,
      trend: trendFromDelta(doneThisWeek - baselines.doneThisWeek, {
        positiveFraming: true,
      }),
    },
    fourth: personalFourthCard
      ? {
          value: assignedToMe,
          trend: assignedTrend(
            assignedToMe,
            assignedToMe - baselines.assignedToMe
          ),
        }
      : {
          value: overdue,
          trend: overdueTrend(overdue),
          alert: overdue > 0,
        },
    fourthLabel: personalFourthCard ? "Assigned to me" : "Overdue",
  };
}
