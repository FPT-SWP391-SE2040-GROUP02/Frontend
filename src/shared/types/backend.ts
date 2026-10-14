/** Metadata ánh xạ Api.Common.PageMeta; số trang bắt đầu từ 1. */
export interface BackendPageMeta {
  /** Trang hiện tại. */
  page: number;
  /** Kích thước trang đã được server áp dụng. */
  pageSize: number;
  /** Tổng số bản ghi phù hợp bộ lọc. */
  totalItems: number;
  /** Tổng số trang. */
  totalPages: number;
}

/** Envelope JSON thành công, không áp dụng cho binary hoặc HTTP 204. */
export interface BackendResponse<T> {
  /** Payload của endpoint. */
  data: T;
}

/** Response danh sách ánh xạ ApiResponse<IReadOnlyList<T>> và PageMeta. */
export interface BackendPageResponse<T> extends BackendResponse<T[]> {
  /** Metadata phân trang bắt buộc ở endpoint danh sách. */
  meta: BackendPageMeta;
}

/** Query ánh xạ Application.Common.Pagination.PageRequest. */
export interface BackendPageRequest {
  /** Trang bắt đầu từ 1; mặc định do server quyết định khi bỏ qua. */
  page?: number;
  /** Kích thước trang; server giới hạn tối đa 100. */
  pageSize?: number;
  /** Cột sắp xếp; dấu trừ đầu chuỗi biểu thị giảm dần. */
  sort?: string;
  /** Từ khóa tìm kiếm. */
  q?: string;
}
