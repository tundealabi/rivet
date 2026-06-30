import type { ZodIssue } from "zod";

function isZodIssueArray(value: unknown): value is ZodIssue[] {
  return Array.isArray(value);
}

export function extractZodIssues(error: unknown): ZodIssue[] {
  if (typeof error !== "object" || error === null || !("issues" in error)) {
    return [];
  }

  const { issues } = error;
  return isZodIssueArray(issues) ? issues : [];
}

export function flattenZodIssuesToFields(
  issues: ZodIssue[]
): Record<string, { message: string }[]> {
  const fields: Record<string, { message: string }[]> = {};

  for (const issue of issues) {
    const path =
      issue.path.length > 0 ? issue.path.map(String).join(".") : "body";

    fields[path] ??= [];
    fields[path].push({ message: issue.message });
  }

  return fields;
}

export function flattenZodErrorToFields(
  error: unknown
): Record<string, { message: string }[]> {
  return flattenZodIssuesToFields(extractZodIssues(error));
}
