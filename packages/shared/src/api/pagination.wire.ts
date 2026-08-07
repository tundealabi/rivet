import { z } from "zod";

import {
  CURSOR_PAGINATION_DEFAULT_LIMIT,
  CURSOR_PAGINATION_MAX_LIMIT,
  OFFSET_PAGINATION_DEFAULT_LIMIT,
  OFFSET_PAGINATION_MAX_LIMIT,
} from "../constants.js";

export interface CursorPaginationInput {
  cursor?: string;
  limit: number;
}

export interface OffsetPaginationInput {
  limit: number;
  page: number;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export interface OffsetPaginatedResult<T> {
  items: T[];
  totalCount: number;
}

export const CursorPaginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(CURSOR_PAGINATION_MAX_LIMIT)
    .default(CURSOR_PAGINATION_DEFAULT_LIMIT),
});

export const OffsetPaginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(OFFSET_PAGINATION_MAX_LIMIT)
    .default(OFFSET_PAGINATION_DEFAULT_LIMIT),
  page: z.coerce.number().int().min(1).default(1),
});

export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;
export type OffsetPaginationQuery = z.infer<typeof OffsetPaginationQuerySchema>;
