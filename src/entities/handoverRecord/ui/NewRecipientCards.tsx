import { useId } from "react";
import { X } from "lucide-react";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import {
  RECIPIENT_FIELDS,
  type RecipientDraft,
  type RecipientDraftErrors,
  type RecipientField,
} from "../model/recipientDraft";

const INPUT_TYPES: Record<RecipientField, string> = {
  fullName: "text",
  citizenId: "text",
  dateOfBirth: "date",
  email: "email",
  phone: "tel",
};

const LABELS: Record<RecipientField, string> = {
  fullName: "Họ tên",
  citizenId: "Số căn cước (12 số)",
  dateOfBirth: "Ngày sinh",
  email: "Email (nhận thư mời)",
  phone: "Số điện thoại (không bắt buộc)",
};

/** Một người nhận đang nhập: thông tin theo di chúc và tài sản được nhận. */
function DraftCard({
  draft,
  order,
  assets,
  errors,
  warning,
  disabled,
  onChange,
  onRemove,
}: {
  draft: RecipientDraft;
  order: number;
  assets: HandoverRecord["availableAssets"];
  errors: RecipientDraftErrors;
  warning: string;
  disabled: boolean;
  onChange: (next: RecipientDraft) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const toggle = (assetId: string) => {
    let assetIds = [...draft.assetIds, assetId];
    if (draft.assetIds.includes(assetId)) {
      assetIds = draft.assetIds.filter((item) => item !== assetId);
    }
    onChange({ ...draft, assetIds });
  };
  return (
    <div
      role="group"
      aria-label={`Người nhận mới ${order}`}
      className="space-y-4 rounded-2xl border border-heritage-border bg-white/70 p-5 text-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-heritage-primary">Người nhận mới {order}</p>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Bỏ người nhận mới ${order}`}
          className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-heritage-muted hover:bg-heritage-sunken hover:text-heritage-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50"
          onClick={onRemove}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {warning !== "" && (
        <p className="rounded-xl bg-heritage-warning-bg px-3 py-2 text-heritage-warning">
          {warning}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {RECIPIENT_FIELDS.map((field) => (
          <div key={field} className="space-y-1">
            <label htmlFor={`${id}-${field}`} className="block font-semibold">
              {LABELS[field]}
            </label>
            <input
              id={`${id}-${field}`}
              type={INPUT_TYPES[field]}
              inputMode={field === "citizenId" ? "numeric" : undefined}
              className="h-11 w-full rounded-xl border border-heritage-border bg-white px-3"
              value={draft[field]}
              disabled={disabled}
              aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? `${id}-${field}-error` : undefined}
              onChange={(event) => onChange({ ...draft, [field]: event.target.value })}
            />
            {errors[field] && (
              <p id={`${id}-${field}-error`} className="text-destructive">
                {errors[field]}
              </p>
            )}
          </div>
        ))}
      </div>
      <fieldset className="space-y-2">
        <legend className="font-semibold">Tài sản được nhận</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {assets.map((asset) => (
            <label key={asset.assetId} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-5 cursor-pointer accent-heritage-primary"
                checked={draft.assetIds.includes(asset.assetId)}
                disabled={disabled}
                onChange={() => toggle(asset.assetId)}
              />
              <span>{asset.name}</span>
            </label>
          ))}
        </div>
        {errors.assetIds && <p className="text-destructive">{errors.assetIds}</p>}
      </fieldset>
    </div>
  );
}

/** Các người nhận mới luật sư nhập theo di chúc; hồ sơ báo tin điền sẵn họ tên, email, số điện thoại. */
export function NewRecipientCards({
  drafts,
  errors,
  assets,
  prefilled,
  warnings,
  skipped,
  disabled,
  onChange,
}: {
  drafts: RecipientDraft[];
  errors: Record<string, RecipientDraftErrors>;
  assets: HandoverRecord["availableAssets"];
  prefilled: boolean;
  /** Cảnh báo của từng người đang nhập, theo khóa. */
  warnings: Record<string, string>;
  /** Người trong hồ sơ báo tin không được điền sẵn vì email đã có trong kho. */
  skipped: string[];
  disabled: boolean;
  onChange: (next: RecipientDraft[]) => void;
}) {
  // Chưa nhập ai và hồ sơ cũng không khai ai thì không chiếm chỗ.
  if (drafts.length === 0 && !prefilled && skipped.length === 0) return null;
  return (
    <section aria-label="Người nhận trong di chúc" className="space-y-3">
      <h3 className="font-semibold text-heritage-primary">Người nhận trong di chúc</h3>
      {prefilled && (
        <p className="text-sm leading-6 text-heritage-muted">
          Họ tên, email và số điện thoại điền sẵn do người nộp tự khai. Kiểm lại với giấy tờ.
        </p>
      )}
      {skipped.length > 0 && (
        <p className="text-sm leading-6 text-heritage-muted">
          {`Không điền sẵn vì email đã có trong danh sách: ${skipped.join(", ")}.`}
        </p>
      )}
      {drafts.length > 0 && (
        <p className="text-sm leading-6 text-heritage-muted">
          Người đang nhập chỉ được thêm vào danh sách khi bấm Chốt và gửi thư. Một người không hợp
          lệ thì chưa ai được thêm.
        </p>
      )}
      {drafts.map((draft, index) => (
        <DraftCard
          key={draft.key}
          draft={draft}
          order={index + 1}
          assets={assets}
          errors={errors[draft.key] ?? {}}
          warning={warnings[draft.key] ?? ""}
          disabled={disabled}
          onChange={(next) => onChange(drafts.map((item) => (item.key === next.key ? next : item)))}
          onRemove={() => onChange(drafts.filter((item) => item.key !== draft.key))}
        />
      ))}
    </section>
  );
}
