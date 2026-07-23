import type { Issue } from "./issue-types";
import type { IssueStatus } from "./IssueFilterBar";

const LOAD_DELAY_MS = 700;
const REFETCH_DELAY_MS = 350;
const UPDATE_DELAY_MS = 350;

export class CommentRateLimitError extends Error {
  constructor() {
    super("Comment rate limit exceeded");
    this.name = "CommentRateLimitError";
  }
}

export class IssueConflictError extends Error {
  constructor() {
    super("Issue was updated by someone else");
    this.name = "IssueConflictError";
  }
}

/** Simulates fetching issues for the active org. Replace with TanStack Query + API. */
export async function fetchIssuesMock(
  data: Issue[],
  options?: { fail?: boolean }
): Promise<Issue[]> {
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to load issues");
  }
  return data;
}

export async function refetchIssuesMock(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, REFETCH_DELAY_MS));
}

export async function updateIssueStatusApi(
  issueId: string,
  status: IssueStatus,
  options?: { fail?: boolean }
): Promise<void> {
  void issueId;
  void status;
  await new Promise((resolve) => setTimeout(resolve, UPDATE_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to update status");
  }
}

/** Simulates persisting an issue patch. Replace with TanStack mutation + API. */
export async function updateIssuePatchMock(
  issueId: string,
  patch: Partial<Issue>,
  options?: { fail?: boolean; conflict?: boolean }
): Promise<void> {
  void issueId;
  void patch;
  await new Promise((resolve) => setTimeout(resolve, UPDATE_DELAY_MS));
  if (options?.conflict) {
    throw new IssueConflictError();
  }
  if (options?.fail) {
    throw new Error("Failed to update issue");
  }
}

let mockCommentBurst = 0;

/** Simulates comment submission. Replace with TanStack mutation + API. */
export async function submitCommentMock(
  issueId: string,
  body: string,
  options?: { rateLimited?: boolean }
): Promise<void> {
  void issueId;
  void body;
  await new Promise((resolve) => setTimeout(resolve, UPDATE_DELAY_MS));
  mockCommentBurst += 1;
  if (options?.rateLimited || mockCommentBurst > 4) {
    throw new CommentRateLimitError();
  }
}

export function resetMockCommentBurst(): void {
  mockCommentBurst = 0;
}

export { LOAD_DELAY_MS, REFETCH_DELAY_MS };
