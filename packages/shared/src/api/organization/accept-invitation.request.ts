import { z } from "zod";

export const AcceptInvitationByTokenRequestSchema = z.object({
  token: z.string().min(1).describe("Opaque invite token from the invite URL"),
});

export type AcceptInvitationByTokenRequestWire = z.infer<
  typeof AcceptInvitationByTokenRequestSchema
>;

export const InvitationPreviewQuerySchema = z.object({
  token: z.string().min(1).describe("Opaque invite token from the invite URL"),
});

export type InvitationPreviewQueryWire = z.infer<
  typeof InvitationPreviewQuerySchema
>;
