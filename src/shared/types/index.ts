// ==============================================================================
// SWP391 - Shared DTOs & Types (Tương thích chuẩn C# ASP.NET Core EF Core)
// ==============================================================================

/**
 * @description Cấu trúc phân trang chuẩn từ C# Backend (EF Core PaginatedList<T>).
 * @template T Kiểu dữ liệu của các phần tử trong danh sách
 */
export interface PaginatedList<T> {
  /** Mảng chứa các bản ghi của trang hiện tại */
  items: T[];
  /** Tổng số bản ghi trong toàn bộ bảng dữ liệu */
  totalCount: number;
  /** Chỉ số trang hiện tại (bắt đầu từ 1) */
  pageIndex: number;
  /** Số lượng bản ghi trên một trang */
  pageSize: number;
  /** Tổng số trang tính toán được */
  totalPages: number;
  /** Cờ cho biết có trang trước đó hay không */
  hasPreviousPage: boolean;
  /** Cờ cho biết có trang kế tiếp hay không */
  hasNextPage: boolean;
}

/**
 * @description Tham số lọc, tìm kiếm và phân trang chuẩn gửi lên Backend ASP.NET Core.
 */
export interface PaginationParams {
  /** Chỉ số trang muốn lấy (bắt đầu từ 1) */
  pageIndex?: number;
  /** Số lượng bản ghi muốn lấy trên mỗi trang */
  pageSize?: number;
  /** Từ khóa tìm kiếm toàn văn */
  searchTerm?: string;
  /** Tên cột cần sắp xếp */
  sortBy?: string;
  /** Thứ tự sắp xếp (true: Tăng dần ASC, false: Giảm dần DESC) */
  isAscending?: boolean;
  /** Các tham số lọc bổ sung tùy chọn khác */
  [key: string]: unknown;
}

/**
 * @description Cấu trúc phần tử lựa chọn chuẩn cho Dropdown / Select / Combobox.
 */
export interface SelectOption {
  /** Nhãn hiển thị cho người dùng */
  label: string;
  /** Giá trị thực tế của option */
  value: string | number;
  /** Trạng thái vô hiệu hóa tùy chọn */
  disabled?: boolean;
  /** Dữ liệu bổ sung đính kèm tùy chọn (nếu có) */
  data?: Record<string, unknown>;
}

/**
 * @description Định dạng bọc phản hồi API tổng quát (nếu backend C# dùng Envelope/Result pattern).
 * @template T Kiểu dữ liệu payload trả về trong trường data
 */
export interface ApiResponse<T = unknown> {
  /** Trạng thái thực thi thành công hay thất bại */
  success: boolean;
  /** Thông điệp từ máy chủ */
  message?: string;
  /** Dữ liệu payload phản hồi */
  data: T;
  /** Danh sách các lỗi chi tiết (nếu có) */
  errors?: string[];
}
