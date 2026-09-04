import { useMutation } from "@tanstack/react-query";

import { createIssue, type CreateIssueInput } from "./issues-api";

export function useCreateIssueMutation(orgId: string) {
  return useMutation({
    mutationFn: (vars: {
      input: CreateIssueInput;
      extras?: { projectColor?: string };
    }) => createIssue(orgId, vars.input, vars.extras),
  });
}
