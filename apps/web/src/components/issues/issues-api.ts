import {
  ApiRequestError,
  authFetch,
  getCurrentUserName,
  getStoredUser,
} from "../../auth-api";
import { colorForProjectId } from "../projects/projects-api";
import type { Issue } from "./issue-types";
import type {
  IssuePriority as IssuePriorityUi,
  IssueStatus as IssueStatusUi,
} from "./IssueFilterBar";

const LOAD_DELAY_MS = 700;
const REFETCH_DELAY_MS = 350;
const UPDATE_DELAY_MS = 350;
const LIST_ISSUES_PAGE_SIZE = 100;

type IssueStatusApi =
  "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";

type IssuePriorityApi = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export class CommentRateLimitError extends Error {
  constructor() {
    super("Comment rate limit exceeded");
    this.name = "CommentRateLimitError";
  }
}

export class IssueConflictError extends Error {
  constructor(message = "Issue was updated by someone else") {
    super(message);
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
const LIST_ISSUES_MAX_PAGES = 50;

export interface CreateIssueInput {
  assigneeId?: string;
  description: string;
  priority: IssuePriorityUi;
  projectId: string;
  status: IssueStatusUi;
  title: string;
}

export interface UpdateIssueInput {
  assigneeId?: string | null;
  description?: string;
  expectedAssigneeId?: string | null;
  expectedDescriptionHash?: string;
  expectedStatus?: IssueStatusUi;
  priority?: IssuePriorityUi;
  status?: IssueStatusUi;
  title?: string;
}

export type IssueAssigneeFilter = string;

interface IssueResponseDto {
  assignee: {
    firstName: string;
    id: string;
    lastName: string;
  } | null;
  createdAt: string;
  description: string;
  descriptionHash: string;
  id: string;
  number: number;
  priority: IssuePriorityApi;
  project: {
    id: string;
    key: string;
    name: string;
  };
  status: IssueStatusApi;
  title: string;
  updatedAt: string;
}

export interface ListIssuesInput {
  /** UUID, `me`, or `unassigned`. */
  assigneeId?: IssueAssigneeFilter;
  cursor?: string;
  limit?: number;
  priority?: IssuePriorityUi;
  projectId: string;
  status?: IssueStatusUi;
}

export interface ListIssuesPage {
  issues: Issue[];
  nextCursor: string | null;
}

export interface ListIssuesProjectRef {
  color?: string;
  id: string;
}

export interface IssueSummary {
  byStatus: Record<IssueStatusUi, number>;
  open: number;
  total: number;
}

interface IssueSummaryResponseDto {
  byStatus: Record<IssueStatusApi, number>;
  open: number;
  total: number;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    fields?: Record<string, { message: string }[]>;
  } | null;
  pagination?: {
    limit?: number;
    nextCursor?: string | null;
  };
}

export class CreateIssueError extends Error {
  readonly fields?: Record<string, { message: string }[]>;

  constructor(message: string, fields?: Record<string, { message: string }[]>) {
    super(message);
    this.name = "CreateIssueError";
    this.fields = fields;
  }
}

export class UpdateIssueError extends Error {
  readonly fields?: Record<string, { message: string }[]>;
  readonly code?: string;

  constructor(
    message: string,
    fields?: Record<string, { message: string }[]>,
    code?: string
  ) {
    super(message);
    this.name = "UpdateIssueError";
    this.fields = fields;
    this.code = code;
  }
}

export class FetchIssuesError extends Error {
  readonly notFound: boolean;

  constructor(message = "Couldn't load issues", notFound = false) {
    super(message);
    this.name = "FetchIssuesError";
    this.notFound = notFound;
  }
}

export class FetchIssueError extends Error {
  readonly notFound: boolean;

  constructor(message = "Couldn't load this issue", notFound = false) {
    super(message);
    this.name = "FetchIssueError";
    this.notFound = notFound;
  }
}

export class DeleteIssueError extends Error {
  readonly notFound: boolean;
  readonly code?: string;

  constructor(
    message = "Couldn't delete this issue",
    notFound = false,
    code?: string
  ) {
    super(message);
    this.name = "DeleteIssueError";
    this.notFound = notFound;
    this.code = code;
  }
}

export function isIssuesNotFoundError(error: unknown): boolean {
  return error instanceof FetchIssuesError && error.notFound;
}

export function isIssueNotFoundError(error: unknown): boolean {
  return error instanceof FetchIssueError && error.notFound;
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

function mapIssueSummaryResponse(dto: IssueSummaryResponseDto): IssueSummary {
  return {
    byStatus: {
      backlog: dto.byStatus.BACKLOG,
      todo: dto.byStatus.TODO,
      in_progress: dto.byStatus.IN_PROGRESS,
      in_review: dto.byStatus.IN_REVIEW,
      done: dto.byStatus.DONE,
      cancelled: dto.byStatus.CANCELLED,
    },
    open: dto.open,
    total: dto.total,
  };
}

function personName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function personInitials(firstName: string, lastName: string): string {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

function getStoredUserInitials(): string {
  const user = getStoredUser();
  if (!user) return "?";
  return personInitials(user.firstName, user.lastName);
}

export function mapIssueResponseToIssue(
  dto: IssueResponseDto,
  extras?: { projectColor?: string }
): Issue {
  const reporter = getCurrentUserName();
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
    descriptionHash: dto.descriptionHash,
    status: fromApiStatus(dto.status),
    priority: fromApiPriority(dto.priority),
    assignee,
    assigneeId: dto.assignee?.id ?? null,
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

function buildListIssuesSearchParams(input: ListIssuesInput): URLSearchParams {
  const params = new URLSearchParams({ projectId: input.projectId });

  if (input.cursor) params.set("cursor", input.cursor);
  if (input.limit != null) params.set("limit", String(input.limit));
  if (input.assigneeId) params.set("assigneeId", input.assigneeId);
  if (input.priority) params.set("priority", toApiPriority(input.priority));
  if (input.status) params.set("status", toApiStatus(input.status));

  return params;
}

/**
 * GET /api/v1/issues
 * List issues for a project with cursor pagination.
 */
export async function fetchIssues(
  orgId: string,
  input: ListIssuesInput,
  extras?: { projectColor?: string }
): Promise<ListIssuesPage> {
  if (!orgId) {
    throw new FetchIssuesError("No organization selected");
  }

  if (!input.projectId) {
    throw new FetchIssuesError("Project not found", true);
  }

  try {
    const params = buildListIssuesSearchParams(input);
    const response = await authFetch(`${ISSUES_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<IssueResponseDto[]>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueResponseDto[]>;
    } catch {
      if (response.status === 404) {
        throw new FetchIssuesError("Project not found", true);
      }
      throw new FetchIssuesError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't load issues"
      );
    }

    if (response.status === 404 || payload.error?.code === "NOT_FOUND") {
      throw new FetchIssuesError(
        payload.error?.message ?? "Project not found",
        true
      );
    }

    if (!response.ok || payload.error) {
      throw new FetchIssuesError(
        payload.error?.message ?? "Couldn't load issues"
      );
    }

    if (!payload.data) {
      throw new FetchIssuesError("The server returned an invalid response");
    }

    return {
      issues: payload.data.map((dto) => mapIssueResponseToIssue(dto, extras)),
      nextCursor: payload.pagination?.nextCursor ?? null,
    };
  } catch (error) {
    if (error instanceof FetchIssuesError) throw error;
    if (error instanceof ApiRequestError) {
      throw new FetchIssuesError(error.message);
    }
    throw error;
  }
}

/**
 * GET /api/v1/issues/{id}
 * Get an issue by ID in the organization from X-ORG-ID.
 */
export async function fetchIssue(
  orgId: string,
  issueId: string,
  extras?: { projectColor?: string }
): Promise<Issue> {
  if (!orgId) {
    throw new FetchIssueError("No organization selected");
  }

  if (!issueId) {
    throw new FetchIssueError("Issue not found", true);
  }

  try {
    const response = await authFetch(`${ISSUES_URL}/${issueId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<IssueResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueResponseDto>;
    } catch {
      if (response.status === 404) {
        throw new FetchIssueError("Issue not found", true);
      }
      throw new FetchIssueError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't load this issue"
      );
    }

    if (response.status === 404 || payload.error?.code === "NOT_FOUND") {
      throw new FetchIssueError(
        payload.error?.message ?? "Issue not found",
        true
      );
    }

    if (!response.ok || payload.error) {
      throw new FetchIssueError(
        payload.error?.message ?? "Couldn't load this issue"
      );
    }

    if (!payload.data) {
      throw new FetchIssueError("The server returned an invalid response");
    }

    return mapIssueResponseToIssue(payload.data, extras);
  } catch (error) {
    if (error instanceof FetchIssueError) throw error;
    if (error instanceof ApiRequestError) {
      throw new FetchIssueError(error.message);
    }
    throw error;
  }
}

/**
 * GET /api/v1/issues/summary
 * Issue counts for a project (total, open, by status).
 */
export async function fetchIssueSummary(
  orgId: string,
  projectId: string
): Promise<IssueSummary> {
  console.log("[issues/summary] fetch start", { orgId, projectId });

  if (!orgId) {
    throw new FetchIssuesError("No organization selected");
  }

  if (!projectId) {
    throw new FetchIssuesError("Project not found", true);
  }

  try {
    const params = new URLSearchParams({ projectId });
    const response = await authFetch(
      `${ISSUES_URL}/summary?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-ORG-ID": orgId,
        },
      }
    );

    let payload: ApiEnvelope<IssueSummaryResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueSummaryResponseDto>;
    } catch {
      console.log("[issues/summary] invalid json", { status: response.status });
      if (response.status === 404) {
        throw new FetchIssuesError("Project not found", true);
      }
      throw new FetchIssuesError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't load issue summary"
      );
    }

    console.log("[issues/summary] envelope", payload);
    console.log("[issues/summary] data", payload.data);

    if (response.status === 404 || payload.error?.code === "NOT_FOUND") {
      throw new FetchIssuesError(
        payload.error?.message ?? "Project not found",
        true
      );
    }

    if (!response.ok || payload.error) {
      throw new FetchIssuesError(
        payload.error?.message ?? "Couldn't load issue summary"
      );
    }

    if (!payload.data) {
      throw new FetchIssuesError("The server returned an invalid response");
    }

    return mapIssueSummaryResponse(payload.data);
  } catch (error) {
    console.log("[issues/summary] error", error);
    if (error instanceof FetchIssuesError) throw error;
    if (error instanceof ApiRequestError) {
      throw new FetchIssuesError(error.message);
    }
    throw error;
  }
}

/**
 * Walks cursor pages until the project issue list is exhausted.
 */
export async function fetchAllProjectIssues(
  orgId: string,
  input: Omit<ListIssuesInput, "cursor">,
  extras?: { projectColor?: string }
): Promise<Issue[]> {
  const issues: Issue[] = [];
  let cursor: string | undefined;
  const limit = input.limit ?? LIST_ISSUES_PAGE_SIZE;

  for (let page = 0; page < LIST_ISSUES_MAX_PAGES; page += 1) {
    const result = await fetchIssues(
      orgId,
      { ...input, cursor, limit },
      extras
    );
    issues.push(...result.issues);

    if (!result.nextCursor || result.issues.length === 0) {
      break;
    }

    cursor = result.nextCursor;
  }

  return issues;
}

/**
 * Lists issues across the given projects (newest first).
 */
export async function fetchIssuesForProjects(
  orgId: string,
  projects: ListIssuesProjectRef[],
  filters?: Omit<ListIssuesInput, "cursor" | "projectId">
): Promise<Issue[]> {
  if (projects.length === 0) {
    return [];
  }

  const pages = await Promise.all(
    projects.map((project) =>
      fetchAllProjectIssues(
        orgId,
        { ...filters, projectId: project.id },
        { projectColor: project.color }
      )
    )
  );

  return pages.flat().sort((a, b) => {
    const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (createdDiff !== 0) return createdDiff;
    return b.id.localeCompare(a.id);
  });
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

    let payload: ApiEnvelope<IssueResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueResponseDto>;
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

/** Server-owned fields from PATCH /issues/{id} to merge onto local issue state. */
export function issueFieldsFromUpdate(updated: {
  assignee: string | null;
  assigneeId?: string | null;
  assigneeInitials: string | null;
  description: string;
  descriptionHash?: string;
  priority: IssuePriorityUi;
  status: IssueStatusUi;
  title: string;
  updatedAt: Date;
}): Partial<Issue> {
  return {
    assignee: updated.assignee,
    assigneeId: updated.assigneeId,
    assigneeInitials: updated.assigneeInitials,
    description: updated.description,
    descriptionHash: updated.descriptionHash,
    priority: updated.priority,
    status: updated.status,
    title: updated.title,
    updatedAt: updated.updatedAt,
  };
}

function buildUpdateIssueBody(
  input: UpdateIssueInput
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (input.assigneeId !== undefined) {
    body.assigneeId = input.assigneeId;
    body.expectedAssigneeId = input.expectedAssigneeId ?? null;
  }
  if (input.description !== undefined) {
    body.description = input.description;
    if (input.expectedDescriptionHash !== undefined) {
      body.expectedDescriptionHash = input.expectedDescriptionHash;
    }
  }
  if (input.priority !== undefined) {
    body.priority = toApiPriority(input.priority);
  }
  if (input.status !== undefined) {
    body.status = toApiStatus(input.status);
    if (input.expectedStatus !== undefined) {
      body.expectedStatus = toApiStatus(input.expectedStatus);
    }
  }
  if (input.title !== undefined) {
    body.title = input.title;
  }

  return body;
}

/**
 * PATCH /api/v1/issues/{id}
 * Update an issue in the organization from X-ORG-ID.
 */
export async function updateIssue(
  orgId: string,
  issueId: string,
  input: UpdateIssueInput,
  extras?: { projectColor?: string }
): Promise<Issue> {
  if (!orgId) {
    throw new UpdateIssueError("No organization selected");
  }

  if (!issueId) {
    throw new UpdateIssueError("Issue not found");
  }

  const patch: UpdateIssueInput = { ...input };

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new UpdateIssueError("Issue title is required", {
        title: [{ message: "Issue title is required" }],
      });
    }
    patch.title = title;
  }

  const body = buildUpdateIssueBody(patch);

  if (Object.keys(body).length === 0) {
    throw new UpdateIssueError(
      "At least one of title, description, priority, status, or assigneeId is required"
    );
  }

  try {
    const response = await authFetch(`${ISSUES_URL}/${issueId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
      body: JSON.stringify(body),
    });

    let payload: ApiEnvelope<IssueResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueResponseDto>;
    } catch {
      throw new UpdateIssueError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't update this issue"
      );
    }

    if (payload.error?.code === "ISSUE_CONFLICT") {
      throw new IssueConflictError(
        payload.error.message ?? "Issue was updated by someone else"
      );
    }

    if (response.status === 404 || payload.error?.code === "NOT_FOUND") {
      throw new UpdateIssueError(
        payload.error?.message ?? "Issue not found",
        payload.error?.fields,
        payload.error?.code
      );
    }

    if (!response.ok || payload.error) {
      throw new UpdateIssueError(
        payload.error?.message ?? "Couldn't update this issue",
        payload.error?.fields,
        payload.error?.code
      );
    }

    if (!payload.data) {
      throw new UpdateIssueError("The server returned an invalid response");
    }

    return mapIssueResponseToIssue(payload.data, extras);
  } catch (error) {
    if (error instanceof IssueConflictError) throw error;
    if (error instanceof UpdateIssueError) throw error;
    if (error instanceof ApiRequestError) {
      throw new UpdateIssueError(error.message, error.fields);
    }
    throw error;
  }
}

/**
 * DELETE /api/v1/issues/{id}
 * Delete an issue in the organization from X-ORG-ID.
 */
export async function deleteIssue(
  orgId: string,
  issueId: string,
  extras?: { projectColor?: string }
): Promise<Issue> {
  if (!orgId) {
    throw new DeleteIssueError("No organization selected");
  }

  if (!issueId) {
    throw new DeleteIssueError("Issue not found", true);
  }

  try {
    const response = await authFetch(`${ISSUES_URL}/${issueId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<IssueResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<IssueResponseDto>;
    } catch {
      if (response.status === 404) {
        throw new DeleteIssueError("Issue not found", true);
      }
      throw new DeleteIssueError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't delete this issue"
      );
    }

    if (response.status === 404 || payload.error?.code === "NOT_FOUND") {
      throw new DeleteIssueError(
        payload.error?.message ?? "Issue not found",
        true,
        payload.error?.code
      );
    }

    if (!response.ok || payload.error) {
      throw new DeleteIssueError(
        payload.error?.message ?? "Couldn't delete this issue",
        false,
        payload.error?.code
      );
    }

    if (!payload.data) {
      throw new DeleteIssueError("The server returned an invalid response");
    }

    return mapIssueResponseToIssue(payload.data, extras);
  } catch (error) {
    if (error instanceof DeleteIssueError) throw error;
    if (error instanceof ApiRequestError) {
      throw new DeleteIssueError(error.message);
    }
    throw error;
  }
}

export { LOAD_DELAY_MS, REFETCH_DELAY_MS };
