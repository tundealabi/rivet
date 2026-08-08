export interface CreateProjectInput {
  createdById: string;
  description: string;
  key: string;
  name: string;
}

export interface ListProjectsInput {
  archived: boolean;
}

export interface UpdateProjectInput {
  description?: string;
  id: string;
  name?: string;
}
