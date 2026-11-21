import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import { newRecipientSchema, type HandoverRecord } from "../model/handoverRecord.schema";
import { handoverRecordKeys } from "../model/useHandoverRecord";

const EMPTY = { fullName: "", citizenId: "", dateOfBirth: "", email: "", phone: "" };
type Field = keyof typeof EMPTY;

const INPUT_TYPES: Record<Field, string> = {
  fullName: "text",
  citizenId: "text",
  dateOfBirth: "date",
  email: "email",
  phone: "tel",
};

const LABELS: Record<Field, string> = {
  fullName: "Họ tên",
  citizenId: "Số căn cước (12 số)",
  dateOfBirth: "Ngày sinh",
  email: "Email (nhận thư mời)",
  phone: "Số điện thoại (không bắt buộc)",
};

/**
 * Luật sư thêm người nhận mới chưa có trong kho (ví dụ có tên trong di chúc). Người này nhận thư mời khi chốt biên bản
 * rồi nộp căn cước như các người nhận khác.
 */
export function AddRecipientPanel({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const submit = () => {
    const parsed = newRecipientSchema.safeParse({ ...values, phone: values.phone || undefined });
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as Field] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    void action.execute(
      () => handoverRecordService.addRecipient(record.id, parsed.data),
      (next) => {
        client.setQueryData(handoverRecordKeys.verifier(next.id), next);
        setValues(EMPTY);
        setOpen(false);
      },
    );
  };
  return (
    <Panel title="Thêm người nhận mới" labelledBy="record-add-recipient">
      {!open ? (
        <div className="space-y-3 text-sm">
          <p className="text-heritage-muted">
            Dùng khi giấy tờ cho thấy có người được nhận mà Chủ kho chưa khai trong kho.
          </p>
          <button type="button" className={buttonStyles.outline} onClick={() => setOpen(true)}>
            Thêm người nhận
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(EMPTY) as Field[]).map((field) => (
              <div key={field} className="space-y-1">
                <label htmlFor={`${formId}-${field}`} className="block font-semibold">
                  {LABELS[field]}
                </label>
                <input
                  id={`${formId}-${field}`}
                  type={INPUT_TYPES[field]}
                  inputMode={field === "citizenId" ? "numeric" : undefined}
                  className="h-11 w-full rounded-xl border border-heritage-border bg-white px-3"
                  value={values[field]}
                  disabled={action.pending}
                  aria-invalid={Boolean(errors[field])}
                  aria-describedby={errors[field] ? `${formId}-${field}-error` : undefined}
                  onChange={(event) => setValues({ ...values, [field]: event.target.value })}
                />
                {errors[field] && (
                  <p id={`${formId}-${field}-error`} className="text-destructive">
                    {errors[field]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={action.pending}
              onClick={submit}
            >
              {action.pending ? "Đang thêm…" : "Lưu người nhận"}
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={() => {
                setOpen(false);
                setErrors({});
              }}
            >
              Hủy
            </button>
          </div>
          {action.error && (
            <p role="alert" className="text-destructive">
              {action.error}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
