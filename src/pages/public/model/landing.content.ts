import { ROUTES } from "@/shared/config/routes.config";

/**
 * Nội dung landing tám mục. Giá và dung lượng chép từ biểu phí SRS §8.1 (khớp trang bảng giá); backend chỉ
 * giới hạn theo dung lượng, không giới hạn số tài sản hay số người nhận. Không phải cam kết đã nghiệm thu.
 */
export const LANDING_CONTENT = {
  brand: "LegacyVault",
  skip: "Đến nội dung chính",
  navLabel: "Điều hướng chính",
  nav: [
    { label: "Hệ thống", href: "#he-thong" },
    { label: "Cách hoạt động", href: "#cach-hoat-dong" },
    { label: "Bảo mật", href: "#bao-mat" },
    { label: "Gói dịch vụ", href: "#goi" },
    { label: "Câu hỏi", href: "#hoi-dap" },
  ],
  login: "Đăng nhập",
  register: "Đăng ký",
  dashboard: "Về dashboard",
  hero: {
    tagline: "Di sản được giao đúng người, đúng lúc.",
    description:
      "Nơi bạn gửi lại tài sản số, giấy tờ và lời nhắn cho người thân. Khi bạn qua đời, người nhận gửi yêu cầu; luật sư xét giấy tờ, đủ chữ ký mới trao đi.",
    start: "Bắt đầu cất tài sản của bạn",
    explore: "Xem cách hoạt động",
    receiveQuestion: "Người thân đã mất?",
    receiveAction: "Nhận tài sản",
    screen: {
      label: "Hình minh họa danh sách tài sản, dùng dữ liệu mẫu",
      title: "Tài sản của bạn",
      sample: "Dữ liệu mẫu",
      status: "Đã mã hóa",
      stats: [
        { label: "Tài sản", value: "3" },
        { label: "Người nhận", value: "2" },
        { label: "Người thực thi", value: "1" },
      ],
      rows: [
        { title: "Ví tiền mã hóa", recipient: "Người nhận A" },
        { title: "Tài khoản email", recipient: "Người nhận B" },
        { title: "Bản scan giấy tờ", recipient: "Người nhận A" },
      ],
    },
  },
  problem: {
    eyebrow: "Vấn đề",
    title: "Tài sản số của bạn nằm rải rác, và chỉ mình bạn biết chúng ở đâu.",
    /** Cụm chữ được tô vàng khi câu đậm dần. */
    highlights: ["rải rác,", "chỉ mình bạn"],
    description:
      "Mỗi thứ một nơi, mỗi thứ một mật khẩu. Khi bạn không thể tự mở, người thân không biết phải bắt đầu từ đâu, và có thể không biết chúng tồn tại.",
    items: [
      {
        title: "Ví tiền mã hóa",
        detail: "Thông tin ví và ghi chú đi kèm, thứ mất là mất hẳn nếu không ai biết.",
      },
      {
        title: "Tài khoản số",
        detail:
          "Email, mạng xã hội, ngân hàng số và các thông tin đăng nhập mở ra mọi thứ còn lại.",
      },
      {
        title: "Tài liệu số",
        detail: "Giấy tờ, hợp đồng, ảnh chụp và những lời nhắn bạn muốn để lại.",
      },
    ],
    closing: "LegacyVault gom tất cả về một nơi, rồi trao lại đúng người, đúng lúc.",
  },
  features: {
    eyebrow: "Hệ thống",
    title: "Tài sản, những người tin cậy, một quy trình bàn giao.",
    description:
      "Ghi lại một lần, quyết định trao cho ai. Người thực thi và luật sư không đọc được nội dung tài sản.",
    assets: {
      title: "Tài sản số",
      detail: "Ví tiền mã hóa, tài khoản số và tài liệu ở một nơi. Chỉ bạn khai báo và sửa.",
      typing: "Đang ghi lại: ví tiền mã hóa",
    },
    recipients: {
      title: "Người nhận",
      detail: "Gắn từng mục cho từng người nhận.",
      rows: [
        { asset: "Ví tiền mã hóa", recipient: "Người nhận A" },
        { asset: "Tài khoản email", recipient: "Người nhận B" },
        { asset: "Bản scan giấy tờ", recipient: "Người nhận A" },
      ],
    },
    executor: {
      title: "Người thực thi",
      detail: "Giữ mã, ký biên bản và gửi mã. Không mở được nội dung.",
    },
    encryption: {
      title: "Mã hóa AES-256-GCM",
      detail: "Nội dung tài sản được mã hóa trên máy chủ.",
    },
    record: {
      title: "Biên bản phân chia",
      detail: "Ghi mong muốn của bạn: ai nhận tài sản nào. Luật sư dùng làm bản đầu của biên bản.",
    },
  },
  handover: {
    eyebrow: "Cách hoạt động",
    title: "Bạn sắp đặt một lần. Phần còn lại, nhẹ nhàng.",
    description:
      "Hệ thống chỉ quản lý tài sản, không làm pháp lý. Biên bản bàn giao là căn cứ duy nhất để giao tài sản.",
    steps: [
      {
        title: "Người nhận gửi yêu cầu",
        detail: "Khi có việc xảy ra, người nhận gửi yêu cầu kèm giấy tờ.",
        signing: false,
      },
      {
        title: "Luật sư lập phương án chia",
        detail: "Một luật sư độc lập ghi ai nhận tài sản nào, theo kết quả đã xử lý ở ngoài.",
        signing: false,
      },
      {
        title: "Người nhận được xác minh danh tính",
        detail: "Luật sư đối chiếu căn cước để đúng người mới nhận được tài sản.",
        signing: false,
      },
      {
        title: "Ba bên ký biên bản",
        detail:
          "Mỗi người nhận được mở phần của mình khi biên bản có đủ chữ ký luật sư, Người thực thi và của chính người đó.",
        signing: true,
      },
      {
        title: "{grantDays} ngày để tải về",
        detail: "Được mở quyền rồi, người nhận có {grantDays} ngày để tải tài sản về.",
        signing: false,
      },
    ],
    signatures: {
      label: "Minh họa chữ ký ba bên",
      roles: ["Luật sư", "Người thực thi", "Người nhận"],
      seal: "Ký",
      hint: "Bấm từng ô để đóng dấu. Ký trước hay sau đều được.",
      complete: "Đủ ba chữ ký: người nhận được mở phần của mình.",
      reset: "Làm lại",
    },
  },
  trust: {
    eyebrow: "Tin cậy có cơ sở",
    title: "Bảo mật nói thật, không hứa quá.",
    description: "Những gì hệ thống làm được, và cả những gì nó chưa làm.",
    lock: {
      label: "Khóa tài sản (minh họa)",
      file: "Tài liệu mẫu.pdf",
      locked: { tag: "Đang khóa", detail: "Người thực thi và luật sư không đọc được nội dung." },
      open: { tag: "Mở cho người nhận", detail: "Chỉ sau khi xác minh danh tính và đủ chữ ký." },
      hint: "Bấm ổ khóa để xem thử.",
    },
    items: [
      {
        title: "Mã hóa AES-256-GCM",
        detail: "Nội dung tài sản được mã hóa trên máy chủ trước khi lưu.",
      },
      {
        title: "Người xác nhận không đọc được",
        detail: "Người thực thi và luật sư không mở được nội dung tài sản.",
      },
      {
        title: "Ảnh căn cước không lưu",
        detail: "Ảnh chỉ dùng để đọc và so khớp, kết quả lưu kèm số căn cước.",
      },
      {
        title: "Không làm thay pháp lý",
        detail:
          "Hệ thống chỉ giữ và giao tài sản theo biên bản. Di chúc và thủ tục thừa kế làm ở ngoài.",
      },
    ],
    limitsTitle: "Những giới hạn chúng tôi nói rõ",
  },
  honesty: [
    {
      title: "Nói thật về bảo mật",
      detail:
        "Mã hóa phía máy chủ, không phải mã hóa đầu cuối. Chúng tôi nói rõ để bạn chọn nội dung phù hợp.",
    },
    {
      title: "Xác minh ở mức cơ bản",
      detail:
        "eKYC giúp nhận diện Chủ tài sản, nhưng chưa có giá trị pháp lý như thủ tục công chứng.",
    },
    {
      title: "Không thay thế di chúc",
      detail:
        "LegacyVault giúp trao thông tin và tài sản số. Phân chia tài sản hợp pháp vẫn cần di chúc.",
    },
  ],
  faq: {
    eyebrow: "Hỏi đáp",
    title: "Những điều thường được hỏi trước khi bắt đầu.",
    all: "Xem tất cả câu hỏi",
    limit: 6,
  },
  cta: {
    title: "Bắt đầu cất tài sản hôm nay.",
    description:
      "Gói Free cho bạn {freeQuotaMb} MiB để làm quen. Nâng cấp khi sẵn sàng thiết lập kế hoạch bàn giao.",
    primary: "Tạo tài khoản",
    secondary: "Đã có tài khoản? Đăng nhập",
  },
  pricing: {
    eyebrow: "Gói dịch vụ",
    title: "Bắt đầu miễn phí, nâng cấp khi cần.",
    description: "Giá theo biểu phí hiện hành. Gói XS và XS Max tính theo chu kỳ 365 ngày.",
    featuredPlan: "XS Max",
    action: "Tạo tài khoản",
    plans: [
      {
        name: "Free",
        price: "0đ",
        features: [
          "Dung lượng {freeQuotaMb} MiB",
          "Lưu trữ nội dung cá nhân, chưa thiết lập kế hoạch bàn giao",
        ],
      },
      {
        name: "XS",
        price: "199.000đ / 365 ngày",
        features: [
          "Dung lượng 200 MiB",
          "Thiết lập kế hoạch bàn giao, biên bản và quy trình bàn giao",
        ],
      },
      {
        name: "XS Max",
        price: "399.000đ / 365 ngày",
        features: ["Mọi quyền lợi của XS", "Dung lượng 500 MiB"],
      },
    ],
  },
  footer: {
    tagline: "Giữ hôm nay, trao mai sau.",
    commitmentTitle: "Cam kết của chúng tôi",
    commitments: [
      "Nói rõ giới hạn.",
      "Chỉ giao khi đủ chữ ký.",
      "Không ai nắm toàn quyền một mình.",
    ],
    productTitle: "Sản phẩm",
    productLinks: [
      { label: "Hệ thống", href: "#he-thong" },
      { label: "Cách hoạt động", href: "#cach-hoat-dong" },
      { label: "Bảo mật", href: "#bao-mat" },
      { label: "Gói dịch vụ", href: "#goi" },
      { label: "Câu hỏi", href: "#hoi-dap" },
    ],
    supportTitle: "Hỗ trợ",
    supportItems: [
      { label: "Hỏi đáp", to: ROUTES.PUBLIC.FAQ },
      { label: "Liên hệ", to: ROUTES.PUBLIC.CONTACT },
    ],
    legalTitle: "Pháp lý",
    legalItems: [
      { label: "Điều khoản", to: ROUTES.PUBLIC.TERMS },
      { label: "Quyền riêng tư", to: ROUTES.PUBLIC.PRIVACY },
    ],
    sampleNote: "Hình giao diện dùng dữ liệu mẫu.",
    address:
      "Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh (thuộc TP. Thủ Đức cũ)",
    legal: "Không phải dịch vụ pháp lý.",
  },
} as const;
