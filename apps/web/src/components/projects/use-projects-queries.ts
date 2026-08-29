import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Project } from "./project-types";
import {
  archiveProject,
  createProject,
  type CreateProjectInput,
  deleteProject,
  fetchProject,
  fetchProjects,
  isProjectNotFoundError,
  unarchiveProject,
  updateProject,
  type UpdateProjectInput,
} from "./projects-api";
import { projectsQueryKeys } from "./projects-query-keys";

function invalidateProjectListQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectsQueryKeys.lists(orgId),
  });
}

/** `archived=false` (default) lists active projects; `archived=true` lists archived only. */
export function useProjectsList(orgId: string, archived = false) {
  return useQuery({
    queryKey: projectsQueryKeys.list(orgId, archived),
    queryFn: () => fetchProjects(orgId, archived),
    enabled: Boolean(orgId),
    refetchOnWindowFocus: true,
  });
}

export function useProject(orgId: string, projectId: string | undefined) {
  return useQuery({
    queryKey: projectsQueryKeys.detail(orgId, projectId ?? ""),
    queryFn: () => fetchProject(orgId, projectId ?? ""),
    enabled: Boolean(orgId && projectId),
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      isProjectNotFoundError(error) ? false : failureCount < 1,
  });
}

export function useCreateProjectMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      input: CreateProjectInput;
      extras: { key: string; color: string };
    }) => createProject(orgId, vars.input, vars.extras),
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(
        projectsQueryKeys.list(orgId, false),
        (prev) => (prev ? [...prev, project] : [project])
      );
      queryClient.setQueryData(
        projectsQueryKeys.detail(orgId, project.id),
        project
      );
      invalidateProjectListQueries(queryClient, orgId);
    },
  });
}

function applyArchivedProjectToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  project: Project,
  archived: boolean
) {
  const next: Project = {
    ...project,
    status: archived ? "archived" : "active",
  };

  queryClient.setQueryData<Project>(
    projectsQueryKeys.detail(orgId, project.id),
    (prev) =>
      prev
        ? {
            ...prev,
            ...next,
            color: prev.color,
            createdBy: prev.createdBy || next.createdBy,
          }
        : next
  );

  queryClient.setQueryData<Project[]>(
    projectsQueryKeys.list(orgId, !archived),
    (prev) => prev?.filter((item) => item.id !== project.id)
  );

  queryClient.setQueryData<Project[]>(
    projectsQueryKeys.list(orgId, archived),
    (prev) => {
      if (!prev) return [next];
      if (prev.some((item) => item.id === project.id)) {
        return prev.map((item) =>
          item.id === project.id ? { ...item, ...next } : item
        );
      }
      return [...prev, next];
    }
  );

  invalidateProjectListQueries(queryClient, orgId);
}

export function useArchiveProjectMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => archiveProject(orgId, projectId),
    onSuccess: (project) => {
      applyArchivedProjectToCache(queryClient, orgId, project, true);
    },
  });
}

export function useUnarchiveProjectMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => unarchiveProject(orgId, projectId),
    onSuccess: (project) => {
      applyArchivedProjectToCache(queryClient, orgId, project, false);
    },
  });
}

function applyUpdatedProjectToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  project: Project
) {
  queryClient.setQueryData<Project>(
    projectsQueryKeys.detail(orgId, project.id),
    (prev) =>
      prev
        ? {
            ...prev,
            ...project,
            color: prev.color,
            createdBy: prev.createdBy || project.createdBy,
          }
        : project
  );

  for (const archived of [false, true] as const) {
    queryClient.setQueryData<Project[]>(
      projectsQueryKeys.list(orgId, archived),
      (prev) =>
        prev?.map((item) =>
          item.id === project.id
            ? { ...item, ...project, color: item.color }
            : item
        )
    );
  }

  invalidateProjectListQueries(queryClient, orgId);
}

function applyDeletedProjectToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  projectId: string
) {
  queryClient.removeQueries({
    queryKey: projectsQueryKeys.detail(orgId, projectId),
  });

  for (const archived of [false, true] as const) {
    queryClient.setQueryData<Project[]>(
      projectsQueryKeys.list(orgId, archived),
      (prev) => prev?.filter((item) => item.id !== projectId)
    );
  }

  invalidateProjectListQueries(queryClient, orgId);
}

export function useUpdateProjectMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { projectId: string } & UpdateProjectInput) =>
      updateProject(orgId, vars.projectId, {
        description: vars.description,
        name: vars.name,
      }),
    onSuccess: (project) => {
      applyUpdatedProjectToCache(queryClient, orgId, project);
    },
  });
}

export function useDeleteProjectMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(orgId, projectId),
    onSuccess: (_data, projectId) => {
      applyDeletedProjectToCache(queryClient, orgId, projectId);
    },
  });
}
