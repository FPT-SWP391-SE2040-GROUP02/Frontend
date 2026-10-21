/**
 * Nội dung landing theo Mẫu G "Bông hoa là logo" của bộ thiết kế handoff.
 * Giá và dung lượng chép từ biểu phí SRS §8.1 (khớp trang bảng giá); backend chỉ giới hạn theo
 * dung lượng và số suất người nhận, không giới hạn số tài sản. Không phải cam kết đã nghiệm thu.
 */
export const LANDING_CONTENT = {
  brand: "LegacyVault",
  skip: "Đến nội dung chính",
  navLabel: "Điều hướng chính",
  nav: [
    { label: "Ý nghĩa bông hoa", href: "#y-nghia" },
    { label: "Cách hoạt động", href: "#cach-hoat-dong" },
    { label: "Gói dịch vụ", href: "#goi" },
  ],
  login: "Đăng nhập",
  register: "Đăng ký",
  dashboard: "Về dashboard",
  hero: {
    tagline: "Di sản được giao đúng người, đúng lúc.",
    description:
      "Nơi bạn gửi lại tài sản số, giấy tờ và lời nhắn cho người thân. Chỉ trao đi khi đã qua nhiều lớp xác nhận, và bạn vẫn có thể dừng lại.",
    start: "Lập kho của bạn",
    explore: "Xem cách hoạt động",
  },
  meaning: {
    eyebrow: "Vì sao là bông hoa",
    title: "Mỗi vòng là một lớp bảo vệ.",
    description:
      "Biểu tượng của LegacyVault được dệt từ nhiều vòng đường nét chồng lên nhau, như hoa văn trên giấy tờ có giá. Càng nhiều lớp, càng khó đi tắt. Trước khi kho mở ra, mọi bàn giao đều phải đi qua bốn lớp xác nhận.",
    layers: [
      {
        title: "Người thực hiện báo tin",
        detail: "Một người bạn đã chỉ định báo rằng đã đến lúc. Chưa có gì được mở.",
      },
      {
        title: "Người xét duyệt xác nhận",
        detail: "Một người độc lập xem lại hồ sơ rồi mới cho đi tiếp.",
      },
      {
        title: "Người nhận xác minh danh tính",
        detail: "eKYC cơ bản để đúng người mới nhận được kho.",
      },
      {
        title: "72 giờ để phản đối",
        detail: "Bạn, hoặc người thân của bạn, vẫn có thể dừng. Chỉ cần bấm “Tôi còn sống”.",
      },
    ],
  },
  how: {
    eyebrow: "Cách hoạt động",
    title: "Bạn sắp đặt một lần. Phần còn lại, nhẹ nhàng.",
    description:
      "Nội dung kho được mã hóa AES-256-GCM trên máy chủ. Người thực hiện và Người xét duyệt chỉ giữ vai trò xác nhận, không đọc được nội dung.",
    steps: [
      {
        title: "Lập kho",
        detail: "Chủ kho ghi lại tài sản số, tài liệu và lời nhắn, rồi chọn người nhận.",
      },
      {
        title: "Chỉ định người tin cậy",
        detail: "Chọn Người thực hiện và Người xét duyệt. Họ không đọc được nội dung kho.",
      },
      {
        title: "Giữ liên lạc",
        detail: "Hệ thống nhắc định kỳ. Bạn chỉ cần xác nhận mình vẫn ổn.",
      },
      {
        title: "Bàn giao đúng lúc",
        detail: "Qua đủ các lớp xác nhận, người nhận có 7 ngày để tải về.",
      },
    ],
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
        "eKYC giúp nhận diện người nhận, nhưng chưa có giá trị pháp lý như thủ tục công chứng.",
    },
    {
      title: "Không thay thế di chúc",
      detail:
        "LegacyVault giúp trao thông tin và tài sản số. Phân chia tài sản hợp pháp vẫn cần di chúc.",
    },
  ],
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
          "Dung lượng 20 MiB",
          "Lưu trữ nội dung cá nhân, chưa thiết lập kế hoạch bàn giao",
        ],
      },
      {
        name: "XS",
        price: "199.000đ / 365 ngày",
        features: [
          "Dung lượng 200 MiB",
          "Thiết lập kế hoạch bàn giao, điểm danh và quy trình bàn giao",
        ],
      },
      {
        name: "XS Max",
        price: "399.000đ / 365 ngày",
        features: ["Mọi quyền lợi của XS", "Dung lượng 500 MiB", "PDF tổng hợp kế hoạch"],
      },
    ],
  },
  footer: {
    tagline: "Giữ hôm nay, trao mai sau.",
    commitmentTitle: "Cam kết của chúng tôi",
    commitments: [
      "Nói rõ giới hạn.",
      "Bạn luôn dừng được bàn giao.",
      "Không ai nắm toàn quyền một mình.",
    ],
    canTitle: "Làm được",
    can: [
      "Lưu kho, mã hóa AES-256-GCM",
      "Bàn giao qua bốn lớp xác nhận",
      "Gửi lời nhắn đúng lúc",
      "Dừng bàn giao bằng “Tôi còn sống”",
    ],
    cannotTitle: "Chưa làm được",
    cannot: [
      "Thay thế di chúc",
      "Mã hóa đầu cuối",
      "eKYC có giá trị pháp lý",
      "Phân chia tài sản hợp pháp",
    ],
    productTitle: "Sản phẩm",
    productLinks: [
      { label: "Ý nghĩa bông hoa", href: "#y-nghia" },
      { label: "Cách hoạt động", href: "#cach-hoat-dong" },
      { label: "Gói dịch vụ", href: "#goi" },
    ],
    supportTitle: "Hỗ trợ",
    supportItems: ["Hỏi đáp", "Liên hệ"],
    legalTitle: "Pháp lý",
    legalItems: ["Điều khoản", "Quyền riêng tư"],
    sampleNote: "Hình giao diện dùng dữ liệu mẫu.",
    address: "[ĐỊA CHỈ CÔNG TY]",
    legal: "Không phải dịch vụ pháp lý.",
  },
} as const;
