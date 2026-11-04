import { useState } from "react";
import { Check, Copy, Monitor, Smartphone } from "lucide-react";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";

type TemplateKind = "overdue" | "supplement";
type Viewport = "desktop" | "mobile";

interface TemplateContent {
  subject: string;
  kicker: string;
  title: string;
  recipient: string;
  leadParagraphs: string[];
  actionBtn: string;
  actionUrl: string;
  note: string;
}

const TEMPLATES: Record<TemplateKind, TemplateContent> = {
  overdue: {
    subject: "LegacyVault: chủ kho quá hạn điểm danh, cần bạn kiểm tra",
    kicker: "THÔNG BÁO NGƯỜI THỰC HIỆN",
    title: "Chủ kho quá hạn điểm danh — Cần bạn kiểm tra",
    recipient: "Nguyễn Văn Thực Hiện",
    leadParagraphs: [
      "Chủ một kho mà bạn là người thực hiện đã quá hạn điểm danh và hết thời gian chờ.",
      "Vui lòng liên hệ kiểm tra tình trạng của chủ kho. Nếu chủ kho vẫn ổn, bạn có thể điểm danh thay; nếu chủ kho đã mất, hãy mở hồ sơ báo tin trên trang người thực hiện.",
      "Lưu ý quan trọng: Thông báo này không tự động mở kho và không bắt đầu bàn giao di sản.",
    ],
    actionBtn: "Mở trang người thực hiện",
    actionUrl: "https://legacyvault.vn/executor?vault=11112222-3333-4444-5555-666677778888",
    note: "Lưu ý: Để bảo vệ quyền riêng tư, email này không chứa thông tin tài sản hay CCCD của chủ kho.",
  },
  supplement: {
    subject: "LegacyVault: hồ sơ chứng tử cần bổ sung",
    kicker: "HỒ SƠ CHỨNG TỬ",
    title: "Hồ sơ chứng tử cần bổ sung",
    recipient: "Trần Thi Hành",
    leadParagraphs: [
      "Verifier yêu cầu bổ sung hồ sơ chứng tử mã 0000ABCD.",
      "Vui lòng đăng nhập, xem phần cần bổ sung và nộp bản mới trước 17:00 ngày 10/11/2026 (giờ Việt Nam).",
      "Sau thời hạn trên, nếu không có tài liệu bổ sung hợp lệ, hồ sơ có thể bị hủy hoặc từ chối.",
    ],
    actionBtn: "Mở trang Executor",
    actionUrl: "https://legacyvault.vn/executor/claim",
    note: "Email này không chứa nội dung hồ sơ hay thông tin cá nhân của người quá cố.",
  },
};

/**
 * Bảng xem trước mẫu email gửi cho Executor theo chuẩn thiết kế LegacyVault Canvas v119
 * (lấy mẫu chuẩn CheckInReminderEmail của Owner làm thước đo).
 */
export function ExecutorEmailPreviewPanel() {
  const [templateKind, setTemplateKind] = useState<TemplateKind>("overdue");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [copied, setCopied] = useState(false);

  const t = TEMPLATES[templateKind];

  async function handleCopyHtml() {
    const rawHtml = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>${t.subject}</title></head>
<body style="margin:0;padding:0;background-color:#EFECE3;font-family:'Be Vietnam Pro',sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#EFECE3;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:616px;background-color:#FFFFFF;border:1px solid #D9D4C4;border-radius:16px;overflow:hidden;">
        <tr><td bgcolor="#1A4B3B" style="background-color:#1A4B3B;padding:18px 32px;text-align:center;">
          <span style="font-size:20px;font-weight:bold;color:#E0C486;letter-spacing:1px;">LEGACYVAULT</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px 0;font-size:13px;color:#7A5B25;font-weight:bold;">${t.kicker}</p>
          <h1 style="margin:0 0 20px 0;font-size:22px;color:#1A4B3B;">${t.title}</h1>
          <p style="margin:0 0 14px 0;font-size:16px;color:#2B332F;">Xin chào <strong>${t.recipient}</strong>,</p>
          ${t.leadParagraphs.map((p) => `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#2B332F;">${p}</p>`).join("")}
          <div style="margin:24px 0;text-align:center;">
            <a href="${t.actionUrl}" style="display:inline-block;background-color:#E0C486;color:#1A4B3B;padding:14px 28px;border-radius:8px;font-weight:bold;text-decoration:none;">${t.actionBtn}</a>
          </div>
          <p style="margin:20px 0 0 0;border-top:1px solid #E4E0D2;padding-top:16px;font-size:13px;color:#4D4D4B;">${t.note}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    try {
      await navigator.clipboard.writeText(rawHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Bỏ qua nếu clipboard API bị chặn
    }
  }

  return (
    <Panel
      title="Mẫu Email thông báo Executor"
      labelledBy="executor-email-preview-title"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-heritage-border bg-white p-1">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`rounded-md p-1.5 text-xs transition ${
                viewport === "desktop"
                  ? "bg-[#1A4B3B] text-white"
                  : "text-heritage-muted hover:text-black"
              }`}
              title="Xem cỡ máy tính (Desktop)"
              aria-label="Xem cỡ máy tính"
            >
              <Monitor className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`rounded-md p-1.5 text-xs transition ${
                viewport === "mobile"
                  ? "bg-[#1A4B3B] text-white"
                  : "text-heritage-muted hover:text-black"
              }`}
              title="Xem cỡ điện thoại (Mobile)"
              aria-label="Xem cỡ điện thoại"
            >
              <Smartphone className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyHtml}
            className={`${buttonStyles.outline} !min-h-9 !px-3 text-xs`}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Sao chép HTML</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Nút chọn kịch bản */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTemplateKind("overdue")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              templateKind === "overdue"
                ? "bg-[#1A4B3B] text-white shadow-sm"
                : "border border-heritage-border bg-white text-[#2B332F] hover:bg-[#F4F1E6]"
            }`}
          >
            1. Chủ kho quá hạn điểm danh (DMS-05)
          </button>
          <button
            type="button"
            onClick={() => setTemplateKind("supplement")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              templateKind === "supplement"
                ? "bg-[#1A4B3B] text-white shadow-sm"
                : "border border-heritage-border bg-white text-[#2B332F] hover:bg-[#F4F1E6]"
            }`}
          >
            2. Hồ sơ chứng tử cần bổ sung (DEATH-09)
          </button>
          <Chip tone="success" className="ml-auto">
            Canvas v119
          </Chip>
        </div>

        {/* Khung mô phỏng Email */}
        <div className="flex justify-center rounded-2xl bg-[#EFECE3] p-4 sm:p-8">
          <div
            className={`w-full overflow-hidden rounded-2xl border border-[#D9D4C4] bg-white shadow-md transition-all ${
              viewport === "mobile" ? "max-w-[360px]" : "max-w-[580px]"
            }`}
          >
            {/* Header Xanh Rừng */}
            <div className="bg-[#1A4B3B] px-6 py-4 text-center">
              <span className="font-serif text-lg font-bold tracking-widest text-[#E0C486]">
                LEGACYVAULT
              </span>
            </div>

            {/* Nội dung thư */}
            <div className="p-6 sm:p-8">
              <p className="mb-1 text-xs font-bold tracking-wider text-[#7A5B25] uppercase">
                {t.kicker}
              </p>
              <h2 className="mb-4 text-lg font-bold leading-snug text-[#1A4B3B] sm:text-xl">
                {t.title}
              </h2>

              <p className="mb-3 text-sm text-[#2B332F]">
                Xin chào <strong>{t.recipient}</strong>,
              </p>

              <div className="space-y-3">
                {t.leadParagraphs.map((para, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-[#2B332F]">
                    {para}
                  </p>
                ))}
              </div>

              {/* Nút Vàng Kim CTA */}
              <div className="my-6 text-center">
                <a
                  href={t.actionUrl}
                  onClick={(e) => e.preventDefault()}
                  className="inline-block rounded-xl bg-[#E0C486] px-6 py-3 text-sm font-bold text-[#0A281E] shadow-sm transition hover:bg-[#E8CF9B]"
                >
                  {t.actionBtn}
                </a>
              </div>

              {/* Khung link dự phòng */}
              <div className="mb-6 rounded-xl border border-[#D9D4C4] bg-[#FAFAF6] p-3 text-xs text-[#4D4D4B]">
                <p className="mb-1">
                  Nếu nút không bấm được, sao chép liên kết này vào trình duyệt:
                </p>
                <span className="break-all font-mono text-[#1A4B3B] underline">{t.actionUrl}</span>
              </div>

              {/* Ghi chú chân thư */}
              <p className="border-t border-[#E4E0D2] pt-4 text-xs leading-relaxed text-[#4D4D4B]">
                {t.note}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
