export interface CreateProjectInput {
  createdById: string;
  description: string;
  name: string;
  organizationId: string;
}

export interface UpdateProjectInput {
  description?: string;
  id: string;
  name?: string;
  organizationId: string;
  userId: string;
}
