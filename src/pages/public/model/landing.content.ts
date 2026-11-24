import { ROUTES } from "@/shared/config/routes.config";

/**
 * Nội dung landing theo Mẫu G "Bông hoa là logo" của bộ thiết kế handoff.
 * Giá và dung lượng chép từ biểu phí SRS §8.1 (khớp trang bảng giá); backend chỉ giới hạn theo
 * dung lượng, không giới hạn số tài sản hay số người nhận. Không phải cam kết đã nghiệm thu.
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
        tag: "02 · Người thực thi",
        title: "Bốn vai, không ai nắm toàn quyền một mình",
        detail:
          "Người nhận gửi yêu cầu kèm giấy tờ, luật sư xét và lập biên bản bàn giao, Người thực thi giữ mã, Người nhận được xác minh danh tính. Hai vai đầu không đọc được nội dung kho.",
        points: [
          "Chủ kho là người duy nhất lập và sửa kho",
          "Người thực thi và luật sư không mở được nội dung",
          "Người nhận chỉ được mở sau khi được xác minh danh tính",
        ],
        visualTitle: "Các vai trong kế hoạch",
        rows: [
          { title: "Chủ kho", detail: "Lập kho, chọn người" },
          { title: "Người thực thi", detail: "Giữ mã, ký biên bản, gửi mã" },
          { title: "Luật sư", detail: "Lập biên bản bàn giao" },
          { title: "Người nhận", detail: "Xác minh rồi tải về" },
        ],
      },
      {
        tag: "03 · Bàn giao",
        title: "Chỉ giao theo biên bản có đủ chữ ký",
        detail:
          "Hệ thống chỉ quản lý tài sản, không làm pháp lý. Luật sư lập biên bản bàn giao, kiểm danh tính người nhận; mỗi người nhận được mở phần của mình khi biên bản có đủ chữ ký luật sư, Người thực thi và của chính người đó, rồi có {grantDays} ngày để tải về.",
        points: [
          "Biên bản bàn giao là căn cứ duy nhất để giao tài sản",
          "Luật sư, Người thực thi và người nhận cùng ký",
          "Người nhận có {grantDays} ngày để tải về",
        ],
        visualTitle: "Từ yêu cầu nhận đến nhận tài sản",
        rows: [
          { title: "Người nhận gửi yêu cầu", detail: "Bắt đầu" },
          { title: "Luật sư lập biên bản", detail: "Bước 1" },
          { title: "Người nhận được xác minh danh tính", detail: "Bước 2" },
          { title: "Ba bên ký biên bản", detail: "Bước 3" },
          { title: "{grantDays} ngày để tải về", detail: "Hoàn tất" },
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
        title: "Người nhận gửi yêu cầu",
        detail: "Khi có việc xảy ra, người nhận gửi yêu cầu kèm giấy tờ.",
      },
      {
        title: "Luật sư lập biên bản",
        detail: "Một luật sư độc lập ghi ai nhận tài sản nào, theo kết quả đã xử lý ở ngoài.",
      },
      {
        title: "Người nhận xác minh danh tính",
        detail: "Luật sư đối chiếu căn cước để đúng người mới nhận được kho.",
      },
      {
        title: "Ba bên ký",
        detail:
          "Luật sư, Người thực thi và người nhận cùng ký biên bản. Đủ chữ ký mới giao tài sản.",
      },
    ],
  },
  how: {
    eyebrow: "Cách hoạt động",
    title: "Bạn sắp đặt một lần. Phần còn lại, nhẹ nhàng.",
    description:
      "Nội dung kho được mã hóa AES-256-GCM trên máy chủ. Người thực thi và luật sư không đọc được nội dung.",
    steps: [
      {
        title: "Lập kho",
        detail: "Chủ kho ghi lại tài sản số, tài liệu và lời nhắn, rồi chọn người nhận.",
      },
      {
        title: "Chỉ định Người thực thi",
        detail:
          "Đề cử một Người thực thi; luật sư do hệ thống phân công khi có yêu cầu nhận. Họ không đọc được nội dung kho.",
      },
      {
        title: "Lập biên bản phân chia",
        detail:
          "Ghi mong muốn của bạn: ai nhận tài sản nào. Luật sư dùng làm bản đầu của biên bản.",
      },
      {
        title: "Bàn giao đúng lúc",
        detail:
          "Có đủ chữ ký luật sư, Người thực thi và người nhận, người đó có {grantDays} ngày để tải về.",
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
        detail: "Người thực thi và luật sư không mở được nội dung kho.",
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
      detail: "eKYC giúp nhận diện Chủ kho, nhưng chưa có giá trị pháp lý như thủ tục công chứng.",
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
