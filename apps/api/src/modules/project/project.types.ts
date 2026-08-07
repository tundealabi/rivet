export interface CreateProjectInput {
  createdById: string;
  description: string;
  key: string;
  name: string;
  organizationId: string;
}

export interface FindProjectByIdInput {
  id: string;
}

export interface UpdateProjectInput {
  description?: string;
  name?: string;
}
