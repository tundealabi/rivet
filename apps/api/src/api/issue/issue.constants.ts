import { z } from "zod";

export const IssuesListCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});

export const COMMENT_RATE_LIMIT_MAX = 5;
export const COMMENT_RATE_LIMIT_WINDOW_MS = 10_000;
