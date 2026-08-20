import { z } from "zod";

import { COMMENT_BODY_MAX_LENGTH } from "../../constants.js";

export const CreateIssueCommentRequestSchema = z.object({
  body: z.string().min(1).max(COMMENT_BODY_MAX_LENGTH).describe("Comment body"),
});

export type CreateIssueCommentRequestWire = z.infer<
  typeof CreateIssueCommentRequestSchema
>;
