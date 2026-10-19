/** Nội dung các trạng thái lỗi công khai và lỗi giao diện. */
export const ERROR_PAGE_CONTENT = {
  notFound: {
    code: "404",
    title: "Không tìm thấy trang",
    description:
      "Trang bạn tìm có thể đã được chuyển hoặc đường dẫn chưa đúng. Hãy kiểm tra lại địa chỉ hoặc trở về trang chủ.",
  },
  forbidden: {
    code: "403",
    title: "Bạn chưa có quyền truy cập",
    description:
      "Khu vực này dành cho vai trò khác. Hãy đăng nhập bằng tài khoản phù hợp hoặc trở về trang chủ.",
  },
  server: {
    code: "500",
    title: "Hệ thống đang gặp sự cố",
    description:
      "Chúng tôi chưa thể xử lý yêu cầu lúc này. Bạn có thể tải lại trang hoặc thử lại sau.",
  },
  runtime: {
    code: "!",
    title: "Không thể hiển thị trang",
    description: "Đã xảy ra lỗi khi hiển thị giao diện. Hãy tải lại trang để tiếp tục.",
  },
  brand: "LegacyVault",
  home: "Về trang chủ",
  login: "Đăng nhập",
  reload: "Tải lại trang",
  note: "Dịch vụ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc.",
} as const;
