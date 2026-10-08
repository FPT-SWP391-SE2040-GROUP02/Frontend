/** Nội dung mẫu cho cổng người thụ hưởng; tách khỏi DTO và dữ liệu nhận tài sản thật. */
export const RECIPIENT_PORTAL_CONTENT = {
  title: "Những điều được gửi đến bạn",
  description: "Theo dõi hồ sơ, xác minh danh tính và nội dung được bàn giao tại một nơi.",
  preview:
    "Bản xem trước UI · Hồ sơ và nội dung bên dưới là dữ liệu mẫu. Không có tài sản thật được bàn giao.",
  unavailable:
    "Cổng người nhận chưa kết nối dịch vụ hồ sơ. Không có dữ liệu bàn giao thực để hiển thị.",
  variantsLabel: "Trạng thái dữ liệu mẫu",
  variants: [
    { id: "success", label: "Có dữ liệu" },
    { id: "empty", label: "Trống" },
    { id: "loading", label: "Đang tải" },
    { id: "error", label: "Lỗi" },
  ],
  views: {
    overview: "Tổng quan hồ sơ",
    handover: "Bàn giao nội dung",
    content: "Nội dung nhận",
    messages: "Lời nhắn dành cho bạn",
  },
  statuses: ["Hồ sơ mẫu", "Chờ xác minh", "Nội dung đang khóa"],
  sender: "Người gửi mẫu",
  package: "Gói lưu giữ gia đình",
  profile: "Thông tin hồ sơ",
  demoId: "Mã mẫu: DEMO-RECIPIENT-01",
  verify: "Bắt đầu xác minh",
  handover: "Xem bàn giao",
  content: "Xem nội dung",
  messages: "Đọc lời nhắn",
  summary: [
    { label: "Gói được chỉ định", value: "1" },
    { label: "Nội dung mẫu", value: "3" },
    { label: "Lời nhắn mẫu", value: "1" },
  ],
  journey: "Các bước tiếp theo",
  steps: [
    {
      title: "Kiểm tra hồ sơ",
      detail: "Đối chiếu người gửi và thông tin liên hệ trong hồ sơ của bạn.",
    },
    {
      title: "Xác minh danh tính",
      detail: "Chuẩn bị căn cước và thiết bị có camera để thực hiện xác minh.",
    },
    {
      title: "Phản hồi bàn giao",
      detail: "Đọc nội dung và điều kiện được hiển thị trước khi đưa ra lựa chọn.",
    },
  ],
  lockTitle: "Nội dung được giữ kín",
  lockDetail:
    "Bản UI không mở khóa, giải mã hoặc cấp quyền tải dữ liệu. Quyền truy cập phải được xác nhận bởi backend.",
  assets: [
    { title: "Hồ sơ gia đình", kind: "Tài liệu" },
    { title: "Album kỷ niệm", kind: "Tệp tin" },
    { title: "Hướng dẫn quản lý tài khoản", kind: "Thông tin tài khoản" },
  ],
  locked: "Đang khóa",
  download: "Tải nội dung",
  noDownload: "Chưa có quyền tải hoặc dữ liệu thật.",
  decision: "Lựa chọn của người nhận",
  decisionHint:
    "Các nút dưới đây chỉ mở hộp thoại mẫu. Không ghi nhận quyết định hoặc tạo cam kết bàn giao.",
  accept: "Xem hộp thoại nhận",
  reject: "Xem hộp thoại từ chối",
  schedule: "Lịch bàn giao",
  unscheduled: "Chưa có lịch bàn giao thực",
  acceptTitle: "Xác nhận nhận nội dung — mẫu",
  rejectTitle: "Xác nhận từ chối — mẫu",
  dialogDescription:
    "Bạn đang xem cấu trúc hộp thoại. Dịch vụ bàn giao chưa được kết nối; không có quyết định nào được gửi hoặc lưu.",
  dialogDetails:
    "Khi tích hợp, màn này cần hiển thị đúng gói, người gửi, điều kiện và thời hạn từ hồ sơ trước khi cho xác nhận.",
  close: "Đóng bản xem trước",
  noCommit: "Xác nhận thật chưa khả dụng",
  messageTitle: "Một lời nhắn dành cho gia đình",
  messageTag: "Nội dung minh họa",
  messageBody:
    "Mong những kỷ niệm này sẽ luôn là một nơi để gia đình tìm về. Hãy dành thời gian đọc, gìn giữ và chia sẻ chúng cùng nhau.",
  noMessage: "Lời nhắn thật sẽ xuất hiện khi bạn được cấp quyền truy cập.",
  emptyTitle: "Chưa có hồ sơ để hiển thị",
  emptyDetail: "Khi có hồ sơ được liên kết với tài khoản, thông tin sẽ xuất hiện tại đây.",
  loadingTitle: "Đang tải hồ sơ mẫu",
  errorTitle: "Không thể tải hồ sơ — mẫu",
  errorDetail: "Kiểm tra kết nối và thử lại. Đây là trạng thái lỗi minh họa.",
  retry: "Xem lại dữ liệu mẫu",
  home: "Về trang chủ",
} as const;
