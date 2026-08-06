export interface CreateProjectInput {
  createdById: string;
  description: string;
  key: string;
  name: string;
  organizationId: string;
}

export interface ListProjectsForOrganizationInput {
  organizationId: string;
}

export interface FindProjectByIdInput {
  id: string;
  organizationId: string;
}

export interface UpdateProjectInput {
  description?: string;
  name?: string;
}
