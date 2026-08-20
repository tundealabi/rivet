export interface InsertStripeEventInput {
  id: string;
  type: string;
}

export type InsertStripeEventResult =
  { outcome: "already_processed" } | { outcome: "created" };
