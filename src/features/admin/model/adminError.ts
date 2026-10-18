import { isAxiosError } from "axios";
import { ZodError } from "zod";
import { HTTP_STATUS } from "@/shared/constants";

/** Phân loại lỗi để UI không biến 404 không quyền thành danh sách rỗng. */
export type AdminErrorKind = "forbidden" | "badRequest" | "unauthorized" | "invalidData" | "other";

export function classifyAdminError(error: unknown): AdminErrorKind {
  if (error instanceof ZodError) return "invalidData";
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    // BE trả 404 cho người không phải Admin đang hoạt động (SEC-04); 403 xử lý như nhau.
    if (status === HTTP_STATUS.NOT_FOUND || status === HTTP_STATUS.FORBIDDEN) return "forbidden";
    if (status === HTTP_STATUS.BAD_REQUEST) return "badRequest";
    if (status === HTTP_STATUS.UNAUTHORIZED) return "unauthorized";
  }
  return "other";
}
