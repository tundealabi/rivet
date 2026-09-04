import type { IssueResponseWire } from "@rivet/shared/api";
import {
  IssuePriority as IssuePriorityApi,
  IssueStatus as IssueStatusApi,
} from "@rivet/shared/enums";

import { ApiRequestError, authFetch, getStoredUser } from "../../auth-api";
import { colorForProjectId } from "../projects/projects-api";
import type { Issue } from "./issue-types";
import type {
  IssuePriority as IssuePriorityUi,
  IssueStatus as IssueStatusUi,
} from "./IssueFilterBar";

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
  status: IssueStatusUi,
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

const ISSUES_URL = "https://rivet-n8w6.onrender.com/api/v1/issues";

export interface CreateIssueInput {
  assigneeId?: string;
  description: string;
  priority: IssuePriorityUi;
  projectId: string;
  status: IssueStatusUi;
  title: string;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, { message: string }[]>;
  } | null;
}

export class CreateIssueError extends Error {
  readonly fields?: Record<string, { message: string }[]>;

  constructor(message: string, fields?: Record<string, { message: string }[]>) {
    super(message);
    this.name = "CreateIssueError";
    this.fields = fields;
  }
}

function toApiStatus(status: IssueStatusUi): IssueStatusApi {
  return status.toUpperCase() as IssueStatusApi;
}

function toApiPriority(priority: IssuePriorityUi): IssuePriorityApi {
  return priority.toUpperCase() as IssuePriorityApi;
}

function fromApiStatus(status: IssueStatusApi): IssueStatusUi {
  return status.toLowerCase() as IssueStatusUi;
}

function fromApiPriority(priority: IssuePriorityApi): IssuePriorityUi {
  return priority.toLowerCase() as IssuePriorityUi;
}

function personName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function personInitials(firstName: string, lastName: string): string {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

function getStoredUserName(): string {
  const user = getStoredUser();
  if (!user) return "You";
  return personName(user.firstName, user.lastName) || "You";
}

function getStoredUserInitials(): string {
  const user = getStoredUser();
  if (!user) return "?";
  return personInitials(user.firstName, user.lastName);
}

export function mapIssueResponseToIssue(
  dto: IssueResponseWire,
  extras?: { projectColor?: string }
): Issue {
  const reporter = getStoredUserName();
  const reporterInitials = getStoredUserInitials();
  const assignee = dto.assignee
    ? personName(dto.assignee.firstName, dto.assignee.lastName)
    : null;
  const createdAt = new Date(dto.createdAt);

  return {
    id: dto.id,
    number: dto.number,
    title: dto.title,
    description: dto.description,
    status: fromApiStatus(dto.status),
    priority: fromApiPriority(dto.priority),
    assignee,
    assigneeInitials: dto.assignee
      ? personInitials(dto.assignee.firstName, dto.assignee.lastName)
      : null,
    reporter,
    reporterInitials,
    projectId: dto.project.id,
    projectKey: dto.project.key,
    projectName: dto.project.name,
    projectColor: extras?.projectColor ?? colorForProjectId(dto.project.id),
    comments: [],
    commentCount: 0,
    activity: [
      {
        id: crypto.randomUUID(),
        type: "created",
        actor: reporter,
        createdAt,
      },
    ],
    labels: [],
    watchers: [reporter],
    dueDate: null,
    createdAt,
    updatedAt: new Date(dto.updatedAt),
  };
}

/**
 * POST /api/v1/issues
 * Create an issue in a project within the organization from X-ORG-ID.
 */
export async function createIssue(
  orgId: string,
  input: CreateIssueInput,
  extras?: { projectColor?: string }
): Promise<Issue> {
  if (!orgId) {
    throw new CreateIssueError("No organization selected");
  }

  const title = input.title.trim();
  if (!title) {
    throw new CreateIssueError("Issue title is required", {
      title: [{ message: "Issue title is required" }],
    });
  }

  try {
    const response = await authFetch(ISSUES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
      body: JSON.stringify({
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
        description: input.description.trim(),
        priority: toApiPriority(input.priority),
        projectId: input.projectId,
        status: toApiStatus(input.status),
        title,
      }),
    });

    let payload: ApiEnvelope<IssueResponseWire>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueResponseWire>;
    } catch {
      throw new CreateIssueError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't create this issue"
      );
    }

    if (!response.ok || payload.error) {
      throw new CreateIssueError(
        payload.error?.message ?? "Couldn't create this issue",
        payload.error?.fields
      );
    }

    if (!payload.data) {
      throw new CreateIssueError("The server returned an invalid response");
    }

    return mapIssueResponseToIssue(payload.data, extras);
  } catch (error) {
    if (error instanceof CreateIssueError) throw error;
    if (error instanceof ApiRequestError) {
      throw new CreateIssueError(error.message, error.fields);
    }
    throw error;
  }
}

export { LOAD_DELAY_MS, REFETCH_DELAY_MS };
