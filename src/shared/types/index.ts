// ==============================================================================
// SWP391 - Shared DTOs & Types (Tương thích chuẩn C# ASP.NET Core EF Core)
// ==============================================================================

/**
 * Cấu trúc phân trang chuẩn từ C# Backend (EF Core PaginatedList)
 */
export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Tham số lọc và phân trang gửi lên Backend
 */
export interface PaginationParams {
  pageIndex?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  isAscending?: boolean;
  [key: string]: unknown;
}

/**
 * Định dạng lựa chọn cho Dropdown / Combobox
 */
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Định dạng bọc phản hồi API tổng quát (nếu backend C# dùng Envelope/Result pattern)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}
