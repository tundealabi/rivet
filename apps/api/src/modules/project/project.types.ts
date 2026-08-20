import { Prisma } from "@/generated/prisma/client";

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

export interface ListProjectsInput {
  archived: boolean;
}

export interface UpdateProjectInput {
  description?: string;
  name?: string;
}

export type ProjectWithCreator = Prisma.ProjectGetPayload<{
  include: {
    createdBy: {
      select: {
        firstName: true;
        lastName: true;
      };
    };
  };
}>;
