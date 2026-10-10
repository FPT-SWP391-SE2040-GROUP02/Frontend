/** Nội dung quản trị minh họa, không phải dữ liệu kiểm toán hoặc người dùng thật. */
export const ADMIN_UI_CONTENT = {
  title: "Quản trị hệ thống",
  description: "Theo dõi hoạt động, người dùng và dấu vết sự cố của LegacyVault.",
  nav: "Khu vực quản trị",
  tabs: [
    { id: "overview", label: "Tổng quan" },
    { id: "users", label: "Người dùng" },
    { id: "audit", label: "Nhật ký kiểm toán" },
  ],
  stats: [
    { label: "Tài khoản mẫu", value: "3" },
    { label: "Hồ sơ mẫu", value: "1" },
    { label: "Sự kiện mẫu", value: "3" },
  ],
  noData: "Chưa có dữ liệu quản trị thực",
  noDataDetail: "Kết nối dịch vụ quản trị để hiển thị dữ liệu theo quyền của phiên đăng nhập.",
  health: "Trạng thái tích hợp",
  healthDetail:
    "API quản trị, thống kê và audit log chưa kết nối. Các số liệu trên chỉ phục vụ bản xem trước UI.",
  users: "Danh sách người dùng mẫu",
  audit: "Nhật ký mẫu",
  search: "Tìm trong dữ liệu mẫu",
  empty: "Không có kết quả phù hợp",
  columns: ["Tài khoản", "Vai trò", "Trạng thái", "Thao tác"],
  edit: "Quản lý",
  disabled: "Chưa kết nối dịch vụ quản trị",
  userRows: [
    { name: "Chủ kho mẫu", role: "Chủ kho", status: "Hoạt động" },
    { name: "Người nhận mẫu", role: "Người nhận", status: "Chờ xác minh" },
    { name: "Người xét duyệt mẫu", role: "Người xét duyệt", status: "Hoạt động" },
  ],
  auditRows: [
    { time: "09:00 · Dữ liệu mẫu", event: "Đăng nhập", id: "DEMO-AUDIT-01" },
    { time: "09:10 · Dữ liệu mẫu", event: "Tạo hồ sơ", id: "DEMO-AUDIT-02" },
    { time: "09:15 · Dữ liệu mẫu", event: "Yêu cầu xác minh", id: "DEMO-AUDIT-03" },
  ],
  auditColumns: ["Thời điểm mẫu", "Sự kiện mẫu", "Mã tham chiếu mẫu"],
  note: "Các mã DEMO không phải Correlation ID hoặc dấu vết kiểm toán thực.",
} as const;
