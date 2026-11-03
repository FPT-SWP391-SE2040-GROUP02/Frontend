import { useId } from "react";
import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react";

interface CitizenIdDiffGridProps {
  /** Số CCCD do Executor khai báo */
  declaredId: string | null | undefined;
  /** Số CCCD đã được xác minh qua eKYC lưu trong kho */
  verifiedId: string | null | undefined;
}

/**
 * Thẻ đối chiếu trực quan từng ký tự của 12 số CCCD giữa bản khai báo và dữ liệu eKYC gốc.
 * Giúp Verifier phát hiện ngay tức thì vị trí sai lệch (nếu có).
 */
export function CitizenIdDiffGrid({ declaredId, verifiedId }: CitizenIdDiffGridProps) {
  const labelId = useId();
  const declared = (declaredId ?? "").trim();
  const verified = (verifiedId ?? "").trim();

  // Đảm bảo đối chiếu trên 12 vị trí chuẩn CCCD Việt Nam
  const positions = Array.from({ length: 12 }, (_, index) => {
    const decChar = declared[index] ?? "";
    const verChar = verified[index] ?? "";
    const hasBoth = Boolean(decChar && verChar);
    const matches = hasBoth && decChar === verChar;
    const isMismatch = hasBoth && decChar !== verChar;
    const isMissing = !decChar || !verChar;

    return {
      index,
      displayPos: index + 1,
      decChar,
      verChar,
      matches,
      isMismatch,
      isMissing,
    };
  });

  const totalDeclaredDigits = declared.length;
  const totalVerifiedDigits = verified.length;
  const hasMismatch = positions.some((p) => p.isMismatch);
  const isExact12Match =
    totalDeclaredDigits === 12 && totalVerifiedDigits === 12 && !hasMismatch;

  return (
    <div
      aria-labelledby={labelId}
      className="space-y-3 rounded-xl border border-heritage-border bg-white/70 p-4 dark:bg-black/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={labelId} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heritage-muted">
          <span>Đối chiếu 12 số CCCD</span>
        </h4>
        {isExact12Match ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e1f2e9] px-2.5 py-0.5 text-xs font-semibold text-[#1f7a55] dark:bg-[#10382a] dark:text-[#62d2a2]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            12/12 số khớp tuyệt đối
          </span>
        ) : hasMismatch ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fbe5e2] px-2.5 py-0.5 text-xs font-semibold text-[#a32119] dark:bg-[#401a17] dark:text-[#ff9189]">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            Phát hiện số không khớp
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fbefd2] px-2.5 py-0.5 text-xs font-semibold text-[#8a5a0b] dark:bg-[#3a2d10] dark:text-[#efc56f]">
            Thiếu dữ liệu đối chiếu
          </span>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[420px] space-y-2">
          {/* Hàng nhãn vị trí 1 -> 12 */}
          <div className="grid grid-cols-[110px_repeat(12,1fr)] items-center gap-1 text-center text-[10px] font-semibold text-heritage-muted">
            <span className="text-left font-normal">Vị trí</span>
            {positions.map((p) => (
              <span key={`pos-${p.index}`}>{p.displayPos}</span>
            ))}
          </div>

          {/* Hàng CCCD Người khai báo */}
          <div className="grid grid-cols-[110px_repeat(12,1fr)] items-center gap-1">
            <span className="truncate text-xs font-medium text-heritage-muted" title="Người khai báo">
              Người khai:
            </span>
            {positions.map((p) => (
              <div
                key={`dec-${p.index}`}
                className={`flex h-8 items-center justify-center rounded-md border font-mono text-sm font-semibold tabular-nums transition-colors ${
                  p.isMismatch
                    ? "border-[#a32119]/50 bg-[#fbe5e2] text-[#a32119] dark:border-[#ff9189]/60 dark:bg-[#401a17] dark:text-[#ff9189]"
                    : p.matches
                      ? "border-[#1f7a55]/40 bg-[#e1f2e9] text-[#1f7a55] dark:border-[#62d2a2]/50 dark:bg-[#10382a] dark:text-[#62d2a2]"
                      : "border-dashed border-heritage-border bg-heritage-surface/50 text-heritage-muted"
                }`}
                title={`Vị trí ${p.displayPos}: ${p.decChar || "Trống"}`}
              >
                {p.decChar || "—"}
              </div>
            ))}
          </div>

          {/* Hàng CCCD eKYC trong Vault */}
          <div className="grid grid-cols-[110px_repeat(12,1fr)] items-center gap-1">
            <span className="truncate text-xs font-medium text-heritage-muted" title="eKYC trong Vault">
              eKYC Vault:
            </span>
            {positions.map((p) => (
              <div
                key={`ver-${p.index}`}
                className={`flex h-8 items-center justify-center rounded-md border font-mono text-sm font-semibold tabular-nums transition-colors ${
                  p.isMismatch
                    ? "border-[#a32119]/50 bg-[#fbe5e2] text-[#a32119] dark:border-[#ff9189]/60 dark:bg-[#401a17] dark:text-[#ff9189]"
                    : p.matches
                      ? "border-[#1f7a55]/40 bg-[#e1f2e9] text-[#1f7a55] dark:border-[#62d2a2]/50 dark:bg-[#10382a] dark:text-[#62d2a2]"
                      : "border-dashed border-heritage-border bg-heritage-surface/50 text-heritage-muted"
                }`}
                title={`Vị trí ${p.displayPos}: ${p.verChar || "Trống"}`}
              >
                {p.verChar || "—"}
              </div>
            ))}
          </div>

          {/* Hàng ký hiệu kiểm tra (Tick / Cross) */}
          <div className="grid grid-cols-[110px_repeat(12,1fr)] items-center gap-1 text-center">
            <span className="text-left text-[11px] text-heritage-muted">Kết quả:</span>
            {positions.map((p) => (
              <div key={`res-${p.index}`} className="flex justify-center">
                {p.matches ? (
                  <Check className="size-3.5 text-[#1f7a55] dark:text-[#62d2a2]" aria-label="Khớp" />
                ) : p.isMismatch ? (
                  <X className="size-3.5 text-[#a32119] dark:text-[#ff9189]" aria-label="Sai lệch" />
                ) : (
                  <span className="text-xs text-heritage-muted" aria-label="Chưa xác minh">·</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasMismatch && (
        <p className="text-xs text-[#a32119] dark:text-[#ff9189]">
          ⚠️ Lưu ý: Có sự sai lệch giữa số CCCD do Người thực hiện khai và dữ liệu eKYC của Chủ kho. Hãy kiểm tra kỹ bản scan giấy tờ trước khi phê duyệt.
        </p>
      )}
    </div>
  );
}
