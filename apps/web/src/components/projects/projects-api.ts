import { ApiRequestError, authFetch } from "../../auth-api";
import type { Project } from "./project-types";

const PROJECTS_URL = "https://rivet-n8w6.onrender.com/api/v1/projects";

export interface CreateProjectInput {
  name: string;
  description: string;
}

export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string;
  createdAt: string;
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

export async function createProjectApi(
  orgId: string,
  input: CreateProjectInput
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
  dto: ProjectResponseDto,
  extras: { key: string; color: string; createdBy: string }
): Project {
  return {
    id: dto.id,
    name: dto.name,
    key: extras.key,
    description: dto.description,
    color: extras.color,
    status: "active",
    visibility: "public",
    defaultAssignee: null,
    createdBy: extras.createdBy,
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
    const dto = await createProjectApi(orgId, input);
    return mapProjectResponseToProject(dto, {
      ...extras,
      createdBy: getStoredUserName(),
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new CreateProjectError(error.message, error.fields);
    }
    throw error;
  }
}
