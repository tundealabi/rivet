import { z } from "zod";

export const IssuesListCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});
