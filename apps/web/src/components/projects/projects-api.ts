import { ApiRequestError, authFetch } from "../../auth-api";
import type { Project } from "./project-types";

const PROJECTS_URL = "https://rivet-n8w6.onrender.com/api/v1/projects";

export const PROJECT_COLORS = [
  "#4F46E5",
  "#0891B2",
  "#DB2777",
  "#D97706",
  "#16A34A",
  "#7C3AED",
];

export interface CreateProjectInput {
  name: string;
  description: string;
}

export interface ProjectResponseDto {
  archivedAt?: string | null;
  createdAt: string;
  description: string;
  id: string;
  key: string;
  name: string;
}

export interface ProjectDetailResponseDto extends ProjectResponseDto {
  createdBy?: string | null;
  isCreator?: boolean;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, { message: string }[]>;
  } | null;
}

export class CreateProjectError extends Error {
  readonly fields?: Record<string, { message: string }[]>;

  constructor(message: string, fields?: Record<string, { message: string }[]>) {
    super(message);
    this.name = "CreateProjectError";
    this.fields = fields;
  }
}

export class FetchProjectsError extends Error {
  constructor(message = "Couldn't load projects") {
    super(message);
    this.name = "FetchProjectsError";
  }
}

export class FetchProjectError extends Error {
  readonly notFound: boolean;

  constructor(message = "Couldn't load this project", notFound = false) {
    super(message);
    this.name = "FetchProjectError";
    this.notFound = notFound;
  }
}

export class ProjectArchiveError extends Error {
  constructor(message = "Couldn't update this project") {
    super(message);
    this.name = "ProjectArchiveError";
  }
}

export class UpdateProjectError extends Error {
  readonly fields?: Record<string, { message: string }[]>;

  constructor(message: string, fields?: Record<string, { message: string }[]>) {
    super(message);
    this.name = "UpdateProjectError";
    this.fields = fields;
  }
}

export class DeleteProjectError extends Error {
  constructor(message = "Couldn't delete this project") {
    super(message);
    this.name = "DeleteProjectError";
  }
}

export interface UpdateProjectInput {
  description?: string;
  name?: string;
}

export function isProjectNotFoundError(error: unknown): boolean {
  return error instanceof FetchProjectError && error.notFound;
}

function colorForProjectId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % PROJECT_COLORS.length;
  }
  return PROJECT_COLORS[hash] ?? PROJECT_COLORS[0];
}

/**
 * List projects for the active org.
 * `archived=true` returns only archived projects; `archived=false` (default)
 * returns only active projects. The two lists are exclusive.
 */
export async function fetchProjects(
  orgId: string,
  archived = false
): Promise<Project[]> {
  if (!orgId) {
    throw new FetchProjectsError("No organization selected");
  }

  try {
    const params = new URLSearchParams({
      archived: archived ? "true" : "false",
    });
    const response = await authFetch(`${PROJECTS_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<ProjectResponseDto[]>;

    try {
      payload = (await response.json()) as ApiEnvelope<ProjectResponseDto[]>;
    } catch {
      throw new FetchProjectsError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't load projects"
      );
    }

    if (!response.ok || payload.error) {
      throw new FetchProjectsError(
        payload.error?.message ?? "Couldn't load projects"
      );
    }

    if (!payload.data) {
      throw new FetchProjectsError("The server returned an invalid response");
    }

    return payload.data.map((dto) => mapProjectResponseToProject(dto));
  } catch (error) {
    if (error instanceof FetchProjectsError) throw error;
    if (error instanceof ApiRequestError) {
      throw new FetchProjectsError(error.message);
    }
    throw error;
  }
}

/**
 * Get a single project by ID in the organization from X-ORG-ID.
 * GET /api/v1/projects/{id}
 */
export async function fetchProject(
  orgId: string,
  projectId: string
): Promise<Project> {
  if (!orgId) {
    throw new FetchProjectError("No organization selected");
  }

  if (!projectId) {
    throw new FetchProjectError("Project not found", true);
  }

  try {
    const response = await authFetch(`${PROJECTS_URL}/${projectId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<ProjectDetailResponseDto>;

    try {
      payload =
        (await response.json()) as ApiEnvelope<ProjectDetailResponseDto>;
    } catch {
      if (response.status === 404) {
        throw new FetchProjectError("Project not found", true);
      }
      throw new FetchProjectError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't load this project"
      );
    }

    if (response.status === 404 || payload.error?.code === "NOT_FOUND") {
      throw new FetchProjectError(
        payload.error?.message ?? "Project not found",
        true
      );
    }

    if (!response.ok || payload.error) {
      throw new FetchProjectError(
        payload.error?.message ?? "Couldn't load this project"
      );
    }

    if (!payload.data) {
      throw new FetchProjectError("The server returned an invalid response");
    }

    return mapProjectResponseToProject(payload.data, {
      createdBy: payload.data.createdBy ?? undefined,
    });
  } catch (error) {
    if (error instanceof FetchProjectError) throw error;
    if (error instanceof ApiRequestError) {
      throw new FetchProjectError(error.message);
    }
    throw error;
  }
}

/**
 * PATCH /api/v1/projects/{id}/archive
 */
export async function archiveProject(
  orgId: string,
  projectId: string
): Promise<Project> {
  return patchProjectArchiveAction(orgId, projectId, "archive");
}

/**
 * PATCH /api/v1/projects/{id}/unarchive
 */
export async function unarchiveProject(
  orgId: string,
  projectId: string
): Promise<Project> {
  return patchProjectArchiveAction(orgId, projectId, "unarchive");
}

/**
 * PATCH /api/v1/projects/{id}
 * Updates name and/or description. Key is immutable.
 */
export async function updateProject(
  orgId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
  if (!orgId) {
    throw new UpdateProjectError("No organization selected");
  }

  if (!projectId) {
    throw new UpdateProjectError("Project not found");
  }

  const body: UpdateProjectInput = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new UpdateProjectError("Project name is required");
    }
    body.name = name;
  }
  if (input.description !== undefined) {
    body.description = input.description.trim() || "No description";
  }

  if (body.name === undefined && body.description === undefined) {
    throw new UpdateProjectError(
      "At least one of name or description is required"
    );
  }

  try {
    const response = await authFetch(`${PROJECTS_URL}/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
      body: JSON.stringify(body),
    });

    let payload: ApiEnvelope<ProjectResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<ProjectResponseDto>;
    } catch {
      throw new UpdateProjectError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't update this project"
      );
    }

    if (!response.ok || payload.error) {
      throw new UpdateProjectError(
        payload.error?.message ?? "Couldn't update this project",
        payload.error?.fields
      );
    }

    if (!payload.data) {
      throw new UpdateProjectError("The server returned an invalid response");
    }

    return mapProjectResponseToProject(payload.data);
  } catch (error) {
    if (error instanceof UpdateProjectError) throw error;
    if (error instanceof ApiRequestError) {
      throw new UpdateProjectError(error.message, error.fields);
    }
    throw error;
  }
}

/**
 * DELETE /api/v1/projects/{id}
 */
export async function deleteProject(
  orgId: string,
  projectId: string
): Promise<void> {
  if (!orgId) {
    throw new DeleteProjectError("No organization selected");
  }

  if (!projectId) {
    throw new DeleteProjectError("Project not found");
  }

  try {
    const response = await authFetch(`${PROJECTS_URL}/${projectId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<ProjectResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<ProjectResponseDto>;
    } catch {
      throw new DeleteProjectError(
        response.ok
          ? "The server returned an invalid response"
          : "Couldn't delete this project"
      );
    }

    if (!response.ok || payload.error) {
      throw new DeleteProjectError(
        payload.error?.message ?? "Couldn't delete this project"
      );
    }
  } catch (error) {
    if (error instanceof DeleteProjectError) throw error;
    if (error instanceof ApiRequestError) {
      throw new DeleteProjectError(error.message);
    }
    throw error;
  }
}

async function patchProjectArchiveAction(
  orgId: string,
  projectId: string,
  action: "archive" | "unarchive"
): Promise<Project> {
  const fallback =
    action === "archive"
      ? "Couldn't archive this project"
      : "Couldn't unarchive this project";

  if (!orgId) {
    throw new ProjectArchiveError("No organization selected");
  }

  if (!projectId) {
    throw new ProjectArchiveError("Project not found");
  }

  try {
    const response = await authFetch(`${PROJECTS_URL}/${projectId}/${action}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-ORG-ID": orgId,
      },
    });

    let payload: ApiEnvelope<ProjectResponseDto>;

    try {
      payload = (await response.json()) as ApiEnvelope<ProjectResponseDto>;
    } catch {
      throw new ProjectArchiveError(
        response.ok ? "The server returned an invalid response" : fallback
      );
    }

    if (!response.ok || payload.error) {
      throw new ProjectArchiveError(payload.error?.message ?? fallback);
    }

    if (!payload.data) {
      throw new ProjectArchiveError("The server returned an invalid response");
    }

    return mapProjectResponseToProject(payload.data);
  } catch (error) {
    if (error instanceof ProjectArchiveError) throw error;
    if (error instanceof ApiRequestError) {
      throw new ProjectArchiveError(error.message);
    }
    throw error;
  }
}

export async function createProjectApi(
  orgId: string,
  input: CreateProjectInput,
  key: string
): Promise<ProjectResponseDto> {
  if (!orgId) {
    throw new CreateProjectError("No organization selected");
  }

  const response = await authFetch(PROJECTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ORG-ID": orgId,
    },
    body: JSON.stringify({
      name: input.name.trim(),
      key,
      description: input.description.trim() || "No description",
    }),
  });

  let payload: ApiEnvelope<ProjectResponseDto>;

  try {
    payload = (await response.json()) as ApiEnvelope<ProjectResponseDto>;
  } catch {
    throw new CreateProjectError(
      response.ok
        ? "The server returned an invalid response"
        : "Unable to create project"
    );
  }

  if (!response.ok || payload.error) {
    const error = payload.error;
    throw new CreateProjectError(
      error?.message ?? "Unable to create project",
      error?.fields
    );
  }

  if (!payload.data) {
    throw new CreateProjectError("The server returned an invalid response");
  }

  return payload.data;
}

export function mapProjectResponseToProject(
  dto: ProjectResponseDto | ProjectDetailResponseDto,
  extras?: { color?: string; createdBy?: string }
): Project {
  const createdByFromDto =
    "createdBy" in dto && typeof dto.createdBy === "string"
      ? dto.createdBy
      : undefined;

  return {
    id: dto.id,
    name: dto.name,
    key: dto.key,
    description: dto.description,
    color: extras?.color ?? colorForProjectId(dto.id),
    status: dto.archivedAt ? "archived" : "active",
    visibility: "public",
    defaultAssignee: null,
    createdBy: extras?.createdBy ?? createdByFromDto ?? "",
    createdAt: new Date(dto.createdAt),
  };
}

function getStoredUserName(): string {
  try {
    const raw = localStorage.getItem("rivet.user");
    if (!raw) return "You";
    const user = JSON.parse(raw) as { firstName?: string; lastName?: string };
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || "You";
  } catch {
    return "You";
  }
}

export async function createProject(
  orgId: string,
  input: CreateProjectInput,
  extras: { key: string; color: string }
): Promise<Project> {
  try {
    const dto = await createProjectApi(orgId, input, extras.key);
    return mapProjectResponseToProject(dto, {
      color: extras.color,
      createdBy: getStoredUserName(),
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new CreateProjectError(error.message, error.fields);
    }
    throw error;
  }
}
