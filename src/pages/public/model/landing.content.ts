import { ROUTES } from "@/shared/config/routes.config";

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
      "Nơi bạn gửi lại tài sản số, giấy tờ và lời nhắn cho người thân. Chỉ trao đi khi đã qua nhiều lớp xác nhận, và bạn vẫn có thể dừng lại.",
    start: "Lập kho của bạn",
    explore: "Xem cách hoạt động",
  },
  problem: {
    eyebrow: "Vấn đề",
    title: "Tài sản số của bạn nằm rải rác, và chỉ mình bạn biết chúng ở đâu.",
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
    closing: "LegacyVault gom tất cả về một kho, rồi trao lại đúng người, đúng lúc.",
  },
  statement: {
    text: "Đây không chỉ là chuyện của sau cùng. Biết mình có gì, để ở đâu và ai được tiếp cận quan trọng ngay từ hôm nay.",
  },
  principles: {
    eyebrow: "Ba nguyên tắc",
    title: "Để trao lại đúng cách, cần ba điều.",
    items: [
      {
        title: "Được ghi lại",
        detail:
          "Thứ chưa ai biết đến thì không thể trao đi. Mọi thứ bắt đầu từ việc ghi lại những gì bạn có.",
      },
      {
        title: "Tìm thấy được",
        detail:
          "Tài sản phải nằm ở một nơi có thể truy ra, thay vì rải qua nhiều ứng dụng và thiết bị.",
      },
      {
        title: "Trao đúng người",
        detail:
          "Quyền truy cập chỉ mở cho người bạn chọn, vào đúng thời điểm và sau khi qua đủ các lớp xác nhận.",
      },
    ],
  },
  pillars: {
    eyebrow: "Hệ thống",
    title: "Một kho, những người tin cậy, một quy trình bàn giao.",
    description: "Ba phần ăn khớp với nhau thành một chuỗi liền mạch.",
    items: [
      {
        tag: "01 · Kho số",
        title: "Nơi cất mọi thứ bạn muốn để lại",
        detail:
          "Ghi lại ví tiền mã hóa, tài khoản số và tài liệu trong một kho duy nhất. Nội dung được mã hóa AES-256-GCM trên máy chủ; bạn quyết định cất gì và trao cho ai.",
        points: [
          "Ba loại tài sản: ví tiền mã hóa, tài khoản số, tài liệu số",
          "Mã hóa AES-256-GCM phía máy chủ",
          "Gắn từng mục cho từng người nhận",
        ],
        visualTitle: "Kho của bạn",
        rows: [
          { title: "Ví tiền mã hóa", detail: "Đã mã hóa" },
          { title: "Tài khoản email", detail: "Đã mã hóa" },
          { title: "Bản scan giấy tờ", detail: "Đã mã hóa" },
        ],
      },
      {
        tag: "02 · Người tin cậy",
        title: "Bốn vai, không ai nắm toàn quyền một mình",
        detail:
          "Người thực hiện báo tin, Người xét duyệt kiểm tra độc lập, Người nhận xác minh danh tính. Hai vai đầu chỉ xác nhận và không đọc được nội dung kho.",
        points: [
          "Chủ kho là người duy nhất lập và sửa kho",
          "Người thực hiện và Người xét duyệt không mở được nội dung",
          "Người nhận chỉ được mở sau khi xác minh eKYC",
        ],
        visualTitle: "Các vai trong kế hoạch",
        rows: [
          { title: "Chủ kho", detail: "Lập kho, chọn người" },
          { title: "Người thực hiện", detail: "Báo tin khi đến lúc" },
          { title: "Người xét duyệt", detail: "Xem lại hồ sơ độc lập" },
          { title: "Người nhận", detail: "Xác minh rồi tải về" },
        ],
      },
      {
        tag: "03 · Bàn giao",
        title: "Chỉ mở khi đủ điều kiện, và bạn vẫn dừng được",
        detail:
          "Hệ thống nhắc bạn xác nhận định kỳ. Khi không có phản hồi và các lớp xác nhận đều đạt, bạn còn 72 giờ để phản đối trước khi người nhận được mở kho, rồi 7 ngày để họ tải về.",
        points: [
          "Nhắc xác nhận định kỳ, chỉ cần báo mình vẫn ổn",
          "72 giờ phản đối bằng nút “Tôi còn sống”",
          "Người nhận có 7 ngày để tải về",
        ],
        visualTitle: "Từ im lặng đến bàn giao",
        rows: [
          { title: "Không phản hồi điểm danh", detail: "Bắt đầu" },
          { title: "Người thực hiện báo tin", detail: "Lớp 1" },
          { title: "Người xét duyệt xác nhận", detail: "Lớp 2" },
          { title: "Người nhận xác minh eKYC", detail: "Lớp 3" },
          { title: "72 giờ để phản đối", detail: "Lớp 4" },
          { title: "7 ngày để tải về", detail: "Hoàn tất" },
        ],
      },
    ],
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
  trust: {
    eyebrow: "Tin cậy có cơ sở",
    title: "Bảo mật nói thật, không hứa quá.",
    description: "Những gì hệ thống làm được, và cả những gì nó chưa làm.",
    items: [
      {
        title: "Mã hóa AES-256-GCM",
        detail: "Nội dung kho được mã hóa trên máy chủ trước khi lưu.",
      },
      {
        title: "Người xác nhận không đọc được",
        detail: "Người thực hiện và Người xét duyệt chỉ có quyền xác nhận, không mở được nội dung.",
      },
      {
        title: "Ảnh căn cước không lưu",
        detail: "Ảnh chỉ dùng để đọc và so khớp, kết quả lưu kèm 4 số cuối số căn cước.",
      },
      {
        title: "Luôn dừng được",
        detail: "Chỉ cần bấm “Tôi còn sống” trong 72 giờ, quá trình bàn giao dừng lại.",
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
        "eKYC giúp nhận diện người nhận, nhưng chưa có giá trị pháp lý như thủ tục công chứng.",
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
    title: "Bắt đầu lập kho hôm nay.",
    description:
      "Gói Free cho bạn 20 MiB để làm quen. Nâng cấp khi sẵn sàng thiết lập kế hoạch bàn giao.",
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
