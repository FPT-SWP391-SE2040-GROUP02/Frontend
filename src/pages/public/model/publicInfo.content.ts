/**
 * Nội dung các trang công khai ngoài landing: Hỏi đáp, Liên hệ, Điều khoản, Quyền riêng tư.
 * Số liệu (gói, dung lượng, thời hạn) chép từ landing và biểu phí SRS §8.1; mô tả eKYC khớp luồng Backend
 * (ảnh chỉ xử lý trong bộ nhớ, lượt xác minh lưu 4 số cuối CCCD). Văn bản pháp lý là BẢN NHÁP chưa qua
 * tư vấn pháp lý: các mục "[...]" cần nhóm điền giá trị thật trước khi công bố.
 */

export interface InfoSection {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqGroup {
  title: string;
  items: readonly FaqItem[];
}

/** Giá trị cần nhóm cung cấp; còn ở dạng giữ chỗ nên hiển thị đúng như vậy thay vì bịa số liệu. */
export const CONTACT_PLACEHOLDERS = {
  supportEmail: "legacyvault8386@gmail.com",
  privacyEmail: "legacyvault8386@gmail.com",
  company: "LegacyVault – Nhóm 02, SWP391",
  address:
    "Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh (thuộc TP. Thủ Đức cũ)",
  hours: "8h-22h(Nghỉ thử 7, chủ nhật)",
} as const;

export const PUBLIC_INFO_COMMON = {
  brand: "LegacyVault",
  backToHome: "Về trang chủ",
  navLabel: "Trang thông tin",
  updatedPrefix: "Cập nhật lần cuối:",
  updatedAt: "21/10/2026",
  footerNote: "LegacyVault không phải dịch vụ pháp lý và không thay thế di chúc.",
} as const;

export const FAQ_CONTENT = {
  eyebrow: "Hỗ trợ",
  title: "Câu hỏi thường gặp",
  description: "Những điều người dùng hay hỏi trước khi cất tài sản số vào LegacyVault.",
  groups: [
    {
      title: "Về LegacyVault",
      items: [
        {
          question: "LegacyVault là gì?",
          answer:
            "Là két số để bạn cất thông tin và tài sản số quan trọng, rồi trao lại cho người bạn chọn vào đúng lúc. Hệ thống nhắc bạn xác nhận mình vẫn ổn theo định kỳ; nếu bạn không phản hồi và các lớp xác nhận đều đạt, người nhận mới được bàn giao.",
        },
        {
          question: "LegacyVault có thay thế di chúc không?",
          answer:
            "Không. LegacyVault giúp trao thông tin và tài sản số. Việc phân chia tài sản hợp pháp vẫn cần di chúc hoặc thủ tục pháp lý theo quy định.",
        },
      ],
    },
    {
      title: "Bảo mật và quyền riêng tư",
      items: [
        {
          question: "Nội dung trong kho được bảo vệ thế nào?",
          answer:
            "Nội dung được mã hóa AES-256-GCM phía máy chủ. Đây không phải mã hóa đầu cuối: chúng tôi nói rõ để bạn cân nhắc nội dung nào nên cất.",
        },
        {
          question: "Người thực hiện và người xét duyệt có đọc được nội dung kho không?",
          answer:
            "Không. Họ chỉ tham gia các bước xác nhận và xét duyệt, không có quyền đọc nội dung bên trong kho.",
        },
        {
          question: "Ảnh căn cước và khuôn mặt của tôi có được lưu không?",
          answer:
            "Ảnh chụp chỉ được xử lý để đọc thông tin và so khớp, không lưu thành ảnh trong hệ thống. Kết quả xác minh được lưu kèm 4 số cuối số căn cước. Với chủ kho, thông tin danh tính và mẫu khuôn mặt được lưu ở dạng mã hóa để đối chiếu các lần sau.",
        },
        {
          question: "eKYC trong LegacyVault có giá trị pháp lý không?",
          answer:
            "Không. Đây là xác minh cơ bản để nhận diện người nhận, chưa có giá trị pháp lý như thủ tục công chứng, và chưa xác thực giấy tờ thật hay giả.",
        },
      ],
    },
    {
      title: "Điểm danh và bàn giao",
      items: [
        {
          question: "Điểm danh định kỳ hoạt động ra sao?",
          answer:
            "Bạn chọn chu kỳ 30, 60 hoặc 90 ngày và thời gian chờ 7, 14 hoặc 30 ngày. Quá hạn mà chưa điểm danh, hệ thống vào thời gian chờ, sau đó nhờ Người thực hiện kiểm tra. Thay đổi cấu hình áp dụng từ kỳ sau.",
        },
        {
          question: "Tôi có dừng được bàn giao không?",
          answer:
            "Có. Chỉ cần bấm “Tôi còn sống” trong khi quy trình chưa hoàn tất, hệ thống dừng bàn giao và mở kỳ điểm danh mới.",
        },
        {
          question: "Người nhận có bao lâu để tải nội dung?",
          answer: "Sau khi qua đủ các lớp xác nhận, người nhận có 7 ngày để tải nội dung về.",
        },
      ],
    },
    {
      title: "Gói dịch vụ",
      items: [
        {
          question: "Các gói có gì khác nhau?",
          answer:
            "Free: 0đ, 20 MiB, lưu nội dung cá nhân, chưa thiết lập kế hoạch bàn giao. XS: 199.000đ / 365 ngày, 200 MiB, có kế hoạch bàn giao, điểm danh và quy trình bàn giao. XS Max: 399.000đ / 365 ngày, 500 MiB, kèm PDF tổng hợp kế hoạch.",
        },
        {
          question: "Gói hết hạn thì dữ liệu của tôi thế nào?",
          answer:
            "Hết hạn gói, tài khoản chuyển sang chế độ ân hạn chỉ đọc theo chính sách hiện hành; bạn nên gia hạn trước hạn để không gián đoạn kế hoạch bàn giao.",
        },
      ],
    },
  ],
  stillNeedHelp: "Chưa tìm thấy câu trả lời?",
  contactAction: "Liên hệ hỗ trợ",
} as const;

export const CONTACT_CONTENT = {
  eyebrow: "Hỗ trợ",
  title: "Liên hệ LegacyVault",
  description:
    "Gửi thắc mắc về tài khoản, kế hoạch bàn giao hoặc thanh toán. Vì bảo mật, đừng gửi mật khẩu, mã xác thực hay nội dung trong kho qua email.",
  channels: [
    {
      title: "Hỗ trợ chung",
      detail: "Tài khoản, gói dịch vụ, thanh toán, lỗi kỹ thuật.",
      valueKey: "supportEmail",
    },
    {
      title: "Quyền riêng tư dữ liệu",
      detail: "Yêu cầu xem, sửa, xóa dữ liệu cá nhân hoặc khiếu nại về xử lý dữ liệu.",
      valueKey: "privacyEmail",
    },
  ],
  infoTitle: "Thông tin đơn vị",
  companyLabel: "Đơn vị vận hành",
  addressLabel: "Địa chỉ",
  hoursLabel: "Thời gian hỗ trợ",
  tipsTitle: "Để được hỗ trợ nhanh hơn",
  tips: [
    "Ghi email đăng ký tài khoản (không cần gửi mật khẩu).",
    "Mô tả bước bạn đang làm và thông báo lỗi nhìn thấy.",
    "Đính kèm ảnh chụp màn hình nếu có, che các thông tin nhạy cảm.",
  ],
  faqHint: "Xem trước phần Câu hỏi thường gặp, có thể câu trả lời đã sẵn ở đó.",
  faqAction: "Xem câu hỏi thường gặp",
} as const;

export const TERMS_CONTENT = {
  eyebrow: "Pháp lý",
  title: "Điều khoản sử dụng",
  description:
    "Bản nháp điều khoản sử dụng LegacyVault. Nội dung đang chờ rà soát pháp lý trước khi công bố chính thức.",
  draftNotice:
    "Đây là bản nháp phục vụ giai đoạn phát triển, chưa phải văn bản pháp lý đã được luật sư rà soát.",
  sections: [
    {
      title: "1. Phạm vi dịch vụ",
      paragraphs: [
        "LegacyVault cung cấp két số để lưu trữ thông tin, tài sản số và thiết lập kế hoạch bàn giao cho người bạn chỉ định.",
        "LegacyVault không phải dịch vụ pháp lý, không thay thế di chúc, công chứng hay các thủ tục phân chia tài sản theo quy định pháp luật.",
      ],
    },
    {
      title: "2. Tài khoản và bảo mật",
      paragraphs: [
        "Bạn chịu trách nhiệm về tính chính xác của thông tin đăng ký và việc giữ bí mật thông tin đăng nhập, mã xác thực hai lớp.",
        "Hãy thông báo ngay cho chúng tôi nếu nghi ngờ tài khoản bị truy cập trái phép.",
      ],
    },
    {
      title: "3. Nội dung bạn lưu trữ",
      paragraphs: [
        "Bạn sở hữu nội dung mình lưu và chịu trách nhiệm về tính hợp pháp của nội dung đó.",
        "Nội dung được mã hóa phía máy chủ, chưa phải mã hóa đầu cuối. Bạn cân nhắc nội dung phù hợp trước khi lưu.",
      ],
      bullets: [
        "Không lưu nội dung vi phạm pháp luật hoặc xâm phạm quyền của người khác.",
        "Không dùng dịch vụ để phát tán mã độc hoặc gây hại cho hệ thống.",
      ],
    },
    {
      title: "4. Điểm danh và bàn giao",
      paragraphs: [
        "Bàn giao chỉ diễn ra khi bạn không phản hồi điểm danh và các lớp xác nhận (kiểm tra của Người thực hiện, xét duyệt, xác minh danh tính người nhận) đều đạt.",
        "Bạn có thể dừng bàn giao bằng cách xác nhận “Tôi còn sống” khi quy trình chưa hoàn tất. Người nhận có 7 ngày để tải nội dung sau khi được bàn giao.",
      ],
    },
    {
      title: "5. Xác minh danh tính (eKYC)",
      paragraphs: [
        "eKYC trong LegacyVault là xác minh cơ bản, chưa có giá trị pháp lý như công chứng và chưa xác thực giấy tờ thật hay giả. Bạn cần đồng ý rõ ràng trước khi chụp giấy tờ và khuôn mặt.",
      ],
    },
    {
      title: "6. Gói dịch vụ và thanh toán",
      paragraphs: [
        "Dung lượng, quyền lợi và giá theo biểu phí hiện hành tại trang gói dịch vụ. Gói XS và XS Max tính theo chu kỳ 365 ngày.",
        "Việc hoàn tiền, gia hạn và ân hạn thực hiện theo chính sách được công bố tại thời điểm thanh toán. [CHÍNH SÁCH HOÀN TIỀN: bổ sung]",
      ],
    },
    {
      title: "7. Giới hạn trách nhiệm",
      paragraphs: [
        "Chúng tôi nỗ lực vận hành ổn định nhưng không bảo đảm dịch vụ không gián đoạn. Trong phạm vi pháp luật cho phép, LegacyVault không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.",
      ],
    },
    {
      title: "8. Thay đổi điều khoản và liên hệ",
      paragraphs: [
        "Điều khoản có thể được cập nhật; thay đổi quan trọng sẽ được thông báo trước khi áp dụng. Mọi thắc mắc xin liên hệ qua trang Liên hệ.",
      ],
    },
  ],
} as const;

export const PRIVACY_CONTENT = {
  eyebrow: "Pháp lý",
  title: "Chính sách quyền riêng tư",
  description:
    "Chúng tôi thu thập gì, dùng vào việc gì và bạn kiểm soát dữ liệu của mình ra sao. Bản nháp, chờ rà soát pháp lý.",
  draftNotice:
    "Đây là bản nháp phục vụ giai đoạn phát triển, chưa phải văn bản pháp lý đã được luật sư rà soát.",
  sections: [
    {
      title: "1. Dữ liệu chúng tôi thu thập",
      paragraphs: [
        "Chúng tôi chỉ thu thập dữ liệu cần cho việc vận hành két số và kế hoạch bàn giao.",
      ],
      bullets: [
        "Thông tin tài khoản: họ tên, email, thông tin đăng nhập (mật khẩu được băm, không lưu dạng thô).",
        "Nội dung bạn lưu trong kho, được mã hóa AES-256-GCM phía máy chủ.",
        "Thông tin kế hoạch bàn giao: người nhận, Người thực hiện, Người xét duyệt do bạn chỉ định.",
        "Nhật ký hoạt động phục vụ bảo mật và đối soát.",
        "Dữ liệu thanh toán do cổng thanh toán xử lý; chúng tôi không lưu số thẻ.",
      ],
    },
    {
      title: "2. Dữ liệu eKYC",
      paragraphs: [
        "Chỉ xác minh sau khi bạn đồng ý rõ ràng. Ảnh giấy tờ và ảnh khuôn mặt chỉ dùng để đọc thông tin và so khớp trong phiên xác minh, không được lưu thành ảnh.",
        "Hệ thống lưu kết quả xác minh kèm 4 số cuối số căn cước. Với chủ kho đã xác minh, danh tính và mẫu khuôn mặt được lưu ở dạng mã hóa để đối chiếu các lần sau. Thời gian lưu cụ thể: [THỜI HẠN LƯU TRỮ: bổ sung].",
      ],
    },
    {
      title: "3. Mục đích sử dụng",
      paragraphs: [],
      bullets: [
        "Cung cấp và bảo vệ tài khoản, kho và kế hoạch bàn giao.",
        "Gửi email xác minh, nhắc điểm danh và thông báo bàn giao.",
        "Xác minh người nhận trước khi bàn giao.",
        "Phát hiện gian lận, sự cố bảo mật và tuân thủ nghĩa vụ pháp lý.",
      ],
    },
    {
      title: "4. Chia sẻ dữ liệu",
      paragraphs: [
        "Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ với nhà cung cấp dịch vụ cần thiết (gửi email, thanh toán, hạ tầng) theo hợp đồng bảo mật, hoặc khi pháp luật yêu cầu.",
        "Người nhận chỉ truy cập nội dung được chỉ định cho họ sau khi bàn giao hoàn tất. Người thực hiện và Người xét duyệt không đọc được nội dung kho.",
      ],
    },
    {
      title: "5. Quyền của bạn",
      paragraphs: [
        "Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân, và rút lại sự đồng ý đã cấp. Gửi yêu cầu qua trang Liên hệ; chúng tôi phản hồi trong thời gian hợp lý.",
        "Một số dữ liệu (như nhật ký bảo mật) có thể được giữ lại theo nghĩa vụ pháp lý hoặc để bảo vệ quyền lợi chính đáng.",
      ],
    },
    {
      title: "6. Bảo mật",
      paragraphs: [
        "Chúng tôi áp dụng mã hóa, kiểm soát truy cập theo vai trò và nhật ký kiểm toán. Mã hóa hiện là phía máy chủ, chưa phải mã hóa đầu cuối; không hệ thống nào an toàn tuyệt đối.",
      ],
    },
    {
      title: "7. Cookie",
      paragraphs: [
        "Chúng tôi dùng cookie cần thiết để duy trì phiên đăng nhập và chống giả mạo yêu cầu. Chúng tôi không dùng cookie quảng cáo.",
      ],
    },
    {
      title: "8. Liên hệ về quyền riêng tư",
      paragraphs: ["Đầu mối xử lý dữ liệu cá nhân: xem thông tin tại trang Liên hệ."],
    },
  ],
} as const;
