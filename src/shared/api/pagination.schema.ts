import { z } from "zod";

/** PaginatedList<T> raw từ Backend, không có envelope data/meta. */
export function paginatedListSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    totalCount: z.number().int().nonnegative(),
    pageIndex: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    totalPages: z.number().int().nonnegative(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  });
}

/** Query được validate trước khi gửi tới PaginationRequest C#. */
export const paginationRequestSchema = z.object({
  pageIndex: z.number().int().positive().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  searchTerm: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  isAscending: z.boolean().optional(),
});
