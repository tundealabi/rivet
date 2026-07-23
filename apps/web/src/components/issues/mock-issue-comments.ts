import {
  activityForIssue,
  labelsForIssue,
  watchersForIssue,
} from "./issue-activity";
import type { Issue, IssueComment } from "./issue-types";

export const MOCK_COMMENTS: Record<string, IssueComment[]> = {
  i1: [
    {
      id: "c1",
      author: "Grace Hopper",
      authorInitials: "GH",
      body: "Reproduced on iOS 17 — crash happens before splash screen finishes.",
      createdAt: new Date("2026-07-21T10:00:00"),
      reactions: [
        { emoji: "👍", count: 2, reactedByMe: true },
        { emoji: "🎉", count: 1, reactedByMe: false },
      ],
    },
    {
      id: "c2",
      author: "Alan Turing",
      authorInitials: "AT",
      body: "Likely related to the offline cache init path. I'll pair with Grace today.",
      createdAt: new Date("2026-07-21T14:30:00"),
      reactions: [{ emoji: "❤️", count: 1, reactedByMe: false }],
    },
    {
      id: "c3",
      author: "Ada Lovelace",
      authorInitials: "AL",
      body: "Let's prioritize this for the next release — blocking QA sign-off.",
      createdAt: new Date("2026-07-22T09:15:00"),
      reactions: [],
    },
  ],
  i2: [
    {
      id: "c4",
      author: "Alan Turing",
      authorInitials: "AT",
      body: "Cursor pagination schema is ready for review in the API branch.",
      createdAt: new Date("2026-07-20T11:00:00"),
      reactions: [{ emoji: "👍", count: 3, reactedByMe: false }],
    },
  ],
  i7: [
    {
      id: "c5",
      author: "Grace Hopper",
      authorInitials: "GH",
      body: "Free tier should be 5 exports/day — confirm with billing spec.",
      createdAt: new Date("2026-07-21T16:00:00"),
      reactions: [],
    },
    {
      id: "c6",
      author: "Ada Lovelace",
      authorInitials: "AL",
      body: "429 responses should include Retry-After header for the upgrade prompt.",
      createdAt: new Date("2026-07-22T07:30:00"),
      reactions: [],
    },
  ],
};

export function commentsForIssue(issueId: string): IssueComment[] {
  return MOCK_COMMENTS[issueId] ?? [];
}

export function seedIssueDetails(
  issue: Omit<
    Issue,
    "comments" | "commentCount" | "activity" | "labels" | "watchers"
  >
): Issue {
  const comments = commentsForIssue(issue.id);
  return {
    ...issue,
    comments,
    commentCount: comments.length,
    activity: activityForIssue(issue.id),
    labels: labelsForIssue(issue.id),
    watchers: watchersForIssue(issue.id),
  };
}

/** @deprecated Use seedIssueDetails */
export function seedIssueComments(
  issue: Omit<
    Issue,
    "comments" | "commentCount" | "activity" | "labels" | "watchers"
  >
): Issue {
  return seedIssueDetails(issue);
}
