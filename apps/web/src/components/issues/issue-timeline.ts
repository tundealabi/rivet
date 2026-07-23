import type { IssueActivityEvent, IssueComment } from "./issue-types";

export type TimelineItem =
  | { kind: "activity"; data: IssueActivityEvent }
  | { kind: "comment"; data: IssueComment };

export function buildTimeline(
  activity: IssueActivityEvent[],
  comments: IssueComment[]
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...activity.map((data) => ({ kind: "activity" as const, data })),
    ...comments.map((data) => ({ kind: "comment" as const, data })),
  ];
  return items.sort(
    (a, b) => a.data.createdAt.getTime() - b.data.createdAt.getTime()
  );
}
