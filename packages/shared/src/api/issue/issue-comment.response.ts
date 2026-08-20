import { z } from "zod";

export const IssueCommentAuthorSchema = z.object({
  firstName: z.string().describe("Author first name"),
  id: z.string().uuid().describe("Author user ID"),
  lastName: z.string().describe("Author last name"),
});

export type IssueCommentAuthorWire = z.infer<typeof IssueCommentAuthorSchema>;

export const IssueCommentResponseSchema = z.object({
  author: IssueCommentAuthorSchema.nullable().describe(
    "Comment author, if the user still exists"
  ),
  body: z.string().describe("Comment body"),
  createdAt: z.string().datetime().describe("Comment creation timestamp"),
  id: z.string().uuid().describe("Comment ID"),
  updatedAt: z.string().datetime().describe("Comment last update timestamp"),
});

export type IssueCommentResponseWire = z.infer<
  typeof IssueCommentResponseSchema
>;
