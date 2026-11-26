import { compactButton } from "@/shared/ui/SectionCard";
import type { RecipientDraft } from "../model/recipientDraft";

/**
 * Người nhận được khai trong hồ sơ báo tin mà chưa có trong danh sách. Thông tin do người nộp tự khai nên luật sư phải
 * mở ra nhập nốt (căn cước, ngày sinh, tài sản) rồi mới thêm, hoặc bỏ.
 */
export function SuggestedRecipients({
  suggestions,
  skipped,
  disabled,
  onContinue,
  onDismiss,
}: {
  suggestions: RecipientDraft[];
  /** Người trong hồ sơ không được điền sẵn vì email đã có trong danh sách. */
  skipped: string[];
  disabled: boolean;
  onContinue: (suggestion: RecipientDraft) => void;
  onDismiss: (key: string) => void;
}) {
  if (suggestions.length === 0 && skipped.length === 0) return null;
  return (
    <section aria-label="Người nhận trong hồ sơ báo tin" className="space-y-3 text-sm">
      <h3 className="font-semibold text-heritage-primary">Người nhận trong hồ sơ báo tin</h3>
      {skipped.length > 0 && (
        <p className="leading-6 text-heritage-muted">
          {`Không điền sẵn vì email đã có trong danh sách: ${skipped.join(", ")}.`}
        </p>
      )}
      {suggestions.length > 0 && (
        <>
          <p className="leading-6 text-heritage-muted">
            Người nộp tự khai, chưa có trong biên bản. Nhập nốt rồi thêm, hoặc bỏ.
          </p>
          <ul className="divide-y divide-heritage-border rounded-2xl border border-heritage-border bg-white/70">
            {suggestions.map((suggestion) => (
              <li key={suggestion.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-semibold">{suggestion.fullName || "—"}</p>
                  <p className="break-words text-heritage-muted">
                    {[suggestion.email, suggestion.phone].filter(Boolean).join(" · ") ||
                      "Chưa có email"}
                  </p>
                </div>
                <button
                  type="button"
                  className={compactButton.dark}
                  disabled={disabled}
                  aria-label={`Nhập tiếp ${suggestion.fullName}`}
                  onClick={() => onContinue(suggestion)}
                >
                  Nhập tiếp
                </button>
                <button
                  type="button"
                  className={compactButton.outline}
                  disabled={disabled}
                  aria-label={`Bỏ ${suggestion.fullName}`}
                  onClick={() => onDismiss(suggestion.key)}
                >
                  Bỏ
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
