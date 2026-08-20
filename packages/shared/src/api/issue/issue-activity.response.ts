import { z } from "zod";

import { IssueActivityField } from "../../enums/issue.enum.js";

export const IssueActivityActorSchema = z.object({
  firstName: z.string().describe("Actor first name"),
  id: z.string().uuid().describe("Actor user ID"),
  lastName: z.string().describe("Actor last name"),
});

export type IssueActivityActorWire = z.infer<typeof IssueActivityActorSchema>;

export const IssueActivityResponseSchema = z.object({
  actor: IssueActivityActorSchema.nullable().describe(
    "User who made the change, if the user still exists"
  ),
  createdAt: z.string().datetime().describe("When the field changed"),
  field: z.nativeEnum(IssueActivityField).describe("Issue field that changed"),
  fromValue: z.string().nullable().describe("Value before the change"),
  id: z.string().uuid().describe("Activity row ID"),
  toValue: z.string().nullable().describe("Value after the change"),
});

export type IssueActivityResponseWire = z.infer<
  typeof IssueActivityResponseSchema
>;
