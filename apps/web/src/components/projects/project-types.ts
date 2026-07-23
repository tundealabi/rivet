export type ProjectStatus = "active" | "archived";
export type ProjectVisibility = "public" | "private";

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  defaultAssignee: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  color: string;
}
