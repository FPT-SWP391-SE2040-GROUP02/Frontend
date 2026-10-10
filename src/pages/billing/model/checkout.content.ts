/** Nội dung checkout mẫu; không chứa tài khoản ngân hàng, giá hoặc mã thanh toán thực. */
export const CHECKOUT_UI_CONTENT = {
  title: "Thanh toán gói lưu giữ",
  description: "Kiểm tra gói và thông tin đơn hàng trước khi thực hiện thanh toán.",
  summary: "Thông tin đơn hàng",
  plan: "Gói lưu giữ mẫu",
  id: "Mã mẫu: DEMO-ORDER-01",
  price: "Tổng thanh toán",
  waitingPrice: "Chờ giá từ backend",
  qrTitle: "Mã thanh toán",
  qrHint: "Mã QR sẽ xuất hiện khi backend tạo đơn hàng hợp lệ.",
  noQr: "Chưa có mã QR thực",
  notPay: "Bản UI không nhận thanh toán. Không chuyển tiền theo thông tin minh họa.",
  create: "Tạo đơn thanh toán",
  back: "Quay lại bảng giá",
  nav: "Trạng thái thanh toán mẫu",
  states: {
    pending: {
      label: "Chờ thanh toán",
      title: "Đang chờ đơn hàng",
      detail: "Chưa có đơn hàng hoặc giao dịch thật được khởi tạo.",
    },
    paid: {
      label: "Thành công mẫu",
      title: "Ví dụ: thanh toán hoàn tất",
      detail:
        "Đây là giao diện mẫu. Không có thanh toán nào được xác nhận và gói chưa được kích hoạt.",
    },
    failed: {
      label: "Thất bại",
      title: "Ví dụ: chưa thể xác nhận thanh toán",
      detail: "Kiểm tra trạng thái đơn hàng trước khi thử lại để tránh thanh toán trùng.",
    },
    expired: {
      label: "Hết hạn",
      title: "Ví dụ: đơn hàng hết hạn",
      detail: "Đơn mới chỉ được tạo sau khi backend xác nhận trạng thái của đơn cũ.",
    },
  },
} as const;
