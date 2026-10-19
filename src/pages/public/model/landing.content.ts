import { Archive, FileText, HeartHandshake, KeyRound, ShieldCheck, Users } from "lucide-react";

/** Nội dung landing chọn lọc từ prototype; không phải cam kết đã nghiệm thu backend. */
export const LANDING_CONTENT = {
  brand: "LegacyVault",
  navLabel: "Điều hướng chính",
  nav: [
    { label: "Cách hoạt động", href: "#cach-hoat-dong" },
    { label: "Vai trò", href: "#vai-tro" },
    { label: "Bảo mật", href: "#bao-mat" },
    { label: "Hỏi đáp", href: "#hoi-dap" },
  ],
  login: "Đăng nhập",
  register: "Tạo tài khoản",
  eyebrow: "Chuẩn bị hôm nay, an tâm ngày mai",
  title: "Điều bạn để lại,",
  titleAccent: "đến đúng người.",
  description:
    "Sắp xếp tài liệu, thông tin truy cập và lời nhắn trong một nơi. Ghi rõ ai sẽ nhận, ai hỗ trợ xác nhận và điều gì cần làm khi đến lúc.",
  start: "Bắt đầu kế hoạch của bạn",
  explore: "Xem cách hoạt động",
  note: "Dịch vụ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc.",
  vault: "Kho của gia đình",
  sample: "Minh họa giao diện",
  organized: "Những điều quan trọng, được sắp xếp.",
  files: [
    { title: "Giấy tờ gia đình", recipient: "Dành cho An và Bình", icon: FileText },
    { title: "Thông tin tài khoản", recipient: "Dành cho An", icon: KeyRound },
    { title: "Lời nhắn gửi các con", recipient: "Dành cho An và Bình", icon: HeartHandshake },
  ],
  vaultFooter: "Người nhận và điều kiện bàn giao được ghi trong kế hoạch.",
  benefits: [
    {
      title: "Một nơi để ghi lại",
      description: "Tài liệu và thông tin quan trọng không còn nằm rải rác.",
      icon: Archive,
    },
    {
      title: "Rõ người, rõ vai trò",
      description: "Phân biệt người nhận với người hỗ trợ xác nhận bàn giao.",
      icon: Users,
    },
    {
      title: "Theo dõi từng bước",
      description: "Biết kế hoạch còn thiếu gì và cần làm gì tiếp theo.",
      icon: ShieldCheck,
    },
  ],
  processEyebrow: "Bắt đầu từ những điều đơn giản",
  processTitle: "Một kế hoạch rõ ràng, từng bước một.",
  steps: [
    {
      number: "01",
      title: "Tạo tài khoản",
      description: "Đăng ký và hoàn tất các bước xác thực tài khoản.",
    },
    {
      number: "02",
      title: "Sắp xếp kho",
      description: "Thêm tài liệu, thông tin truy cập và nội dung muốn giữ lại.",
    },
    {
      number: "03",
      title: "Chỉ định người",
      description: "Ghi rõ người nhận và mời người hỗ trợ theo từng vai trò.",
    },
    {
      number: "04",
      title: "Giữ kế hoạch cập nhật",
      description: "Kiểm tra chỉ định và điểm danh theo lịch của anh, chị.",
    },
  ],
  rolesEyebrow: "Mỗi người một trách nhiệm",
  rolesTitle: "Sự tin cậy bắt đầu từ vai trò rõ ràng.",
  roles: [
    {
      title: "Chủ kho",
      description: "Sắp xếp nội dung và quyết định các chỉ định trong kế hoạch.",
      icon: Archive,
    },
    {
      title: "Người thực hiện",
      description: "Báo tin, cung cấp hồ sơ và hỗ trợ quy trình bàn giao.",
      icon: HeartHandshake,
    },
    {
      title: "Người xét duyệt",
      description: "Kiểm tra hồ sơ theo phạm vi được phép, độc lập với người báo tin.",
      icon: ShieldCheck,
    },
    {
      title: "Người nhận",
      description: "Xác minh danh tính và thực hiện các bước nhận nội dung được chỉ định.",
      icon: Users,
    },
  ],
  securityEyebrow: "Hiểu rõ trước khi trao gửi",
  securityTitle: "Bảo vệ dữ liệu, nói rõ giới hạn.",
  securityDescription:
    "Niềm tin cần thông tin rõ ràng. LegacyVault được thiết kế với quyền truy cập theo vai trò và các bước xác nhận trước khi bàn giao.",
  security: [
    {
      title: "Mã hóa phía máy chủ",
      description:
        "Thiết kế sử dụng AES-256-GCM phía máy chủ. Đây không phải mã hóa đầu cuối hoặc mô hình Zero-Knowledge.",
    },
    {
      title: "Đăng nhập không đồng nghĩa quyền nhận",
      description:
        "Người nhận còn phải xác minh danh tính và hoàn tất các điều kiện của quy trình bàn giao.",
    },
    {
      title: "Điểm danh và phản đối là hai việc riêng",
      description:
        "Điểm danh định kỳ giữ liên lạc với hệ thống; phản đối được xử lý theo trạng thái hồ sơ bàn giao.",
    },
  ],
  securityNote:
    "Sản phẩm đang ở giai đoạn prototype. Các khả năng bảo mật cần được kiểm thử và nghiệm thu khi tích hợp backend.",
  faqEyebrow: "Những điều thường được hỏi",
  faqTitle: "Hiểu rõ rồi mới bắt đầu.",
  faq: [
    {
      question: "LegacyVault có thay thế di chúc không?",
      answer:
        "Không. LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số; không thay thế di chúc, công chứng hay thủ tục thừa kế.",
    },
    {
      question: "Tôi nên bắt đầu bằng những gì?",
      answer:
        "Bắt đầu bằng danh sách tài liệu và thông tin anh, chị muốn sắp xếp, sau đó xác định người nhận. Chỉ đưa dữ liệu nhạy cảm vào hệ thống sau khi hiểu rõ cách bảo vệ và quyền truy cập.",
    },
    {
      question: "Người được mời có thể mở kho ngay không?",
      answer:
        "Lời mời hoặc việc đăng nhập không tự cấp quyền đọc nội dung. Quyền truy cập phụ thuộc vai trò, xác minh danh tính và điều kiện bàn giao.",
    },
    {
      question: "Các gói dịch vụ có gì khác nhau?",
      answer:
        "Xem trang gói dịch vụ để đối chiếu hạn mức và quyền lợi hiện có. Landing page không dùng giá hoặc số liệu minh họa làm cam kết thanh toán.",
    },
  ],
  pricingTitle: "Chọn quy mô phù hợp với kế hoạch.",
  pricingDescription: "Xem các gói dịch vụ và quyền lợi trước khi quyết định.",
  pricingAction: "Xem gói dịch vụ",
  closingTitle: "Bắt đầu bằng một điều quan trọng.",
  closingDescription:
    "Một tài liệu được sắp xếp, một người được chỉ định. Kế hoạch của anh, chị có thể bắt đầu từ đó.",
  footer: "LegacyVault · Dự án SWP391",
  skip: "Đến nội dung chính",
} as const;
