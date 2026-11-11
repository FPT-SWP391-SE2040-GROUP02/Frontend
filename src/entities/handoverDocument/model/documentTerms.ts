import type { DocumentKind } from "./handoverDocument.schema";

/**
 * Điều khoản người ký phải đọc và xác nhận trước khi ký biên bản. Phiên bản này khớp HandoverDocumentRules.TermsVersion của Backend;
 * đổi chữ thì đổi cả hai nơi.
 *
 * Chữ viết gọn, dựa trên Điều 615, 620, 621 Bộ luật Dân sự 2015 và hai mẫu văn bản của nhóm. Đây là chữ chờ người có chuyên môn
 * pháp lý rà soát trước khi dùng thật: lời nêu LegacyVault không chịu trách nhiệm chưa chắc có hiệu lực pháp lý.
 */
export const TERMS_VERSION = "terms-2026-11";

export type SignerRole = "recipient" | "verifier";

/** Các ý người ký cần biết, theo vai và theo lựa chọn Chấp nhận hoặc Từ chối. */
export function termsBullets(role: SignerRole, kind: DocumentKind): string[] {
  if (role === "recipient" && kind === "DECLINE") {
    return [
      "Bạn có quyền từ chối, trừ khi nhằm trốn tránh nghĩa vụ tài sản với người khác (Điều 620 BLDS 2015).",
      "Văn bản từ chối gửi cho người quản lý di sản, ở đây là Người thực thi của kho.",
      "Từ chối xong không rút lại được; tài sản của gói không giao cho ai.",
    ];
  }
  if (role === "recipient") {
    return [
      "Bạn chỉ phải thực hiện nghĩa vụ tài sản của Chủ kho trong phạm vi di sản nhận (Điều 615).",
      "Bạn không thuộc trường hợp bị truất quyền hưởng di sản (Điều 621) và chưa từ chối phần này.",
      "Khai sai thì bạn tự chịu trách nhiệm trước pháp luật.",
      "Biên bản này không thay công chứng; thủ tục ngoài đời (đất đai, ngân hàng…) bạn tự làm.",
    ];
  }
  return [
    "Tự kiểm tra thủ công từng mục, đối chiếu ảnh căn cước và giấy chứng tử đã duyệt.",
    "Hệ thống không kiểm tra thay bạn; xác nhận sai thì bạn chịu trách nhiệm trước pháp luật.",
  ];
}

/** Câu người ký tick để ký; luôn nêu rõ đã biết luật và LegacyVault không chịu trách nhiệm thay. */
export function declarationText(role: SignerRole, kind: DocumentKind): string {
  if (role === "verifier") {
    return "Tôi đã tự kiểm tra thủ công từng mục và chịu trách nhiệm trước pháp luật về kết quả. LegacyVault không chịu trách nhiệm thay tôi.";
  }
  const action = kind === "DECLINE" ? "từ chối" : "nhận";
  const extra = kind === "DECLINE" ? ", không nhằm trốn tránh nghĩa vụ tài sản" : "";
  return `Tôi đã đọc các điều khoản trên, cam đoan khai đúng sự thật và tự nguyện ${action}${extra}. LegacyVault chỉ cung cấp công cụ, không chịu trách nhiệm về hậu quả pháp lý của tôi.`;
}

/** Câu ghi chú chung dưới điều khoản. */
export const TERMS_DISCLAIMER =
  "LegacyVault chỉ cung cấp công cụ, không tư vấn pháp lý và không chịu trách nhiệm về nội dung khai hay hậu quả pháp lý.";

/** Hai mục Người xét duyệt tick sau khi kiểm tra thủ công; số mục khớp VERIFIER_CHECK_COUNT. */
export const VERIFIER_CHECKS: readonly string[] = [
  "Tôi đã nhìn ảnh căn cước: họ tên, năm sinh, số căn cước trên ảnh khớp với bảng trên.",
  "Biên bản đúng lựa chọn của người nhận, đúng gói, và người nhận đã ký.",
];

/** Hai câu tick của Người xét duyệt, câu thứ hai nêu rõ lựa chọn Đồng ý nhận hoặc Từ chối nhận của biên bản này. */
export function verifierCheckTexts(kind: DocumentKind): string[] {
  let choice = "Đồng ý nhận";
  if (kind === "DECLINE") choice = "Từ chối nhận";
  return [
    VERIFIER_CHECKS[0] ?? "",
    `Biên bản đúng lựa chọn ${choice}, đúng gói, và người nhận đã ký.`,
  ];
}
