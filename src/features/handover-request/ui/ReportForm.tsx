import { useId, useState, type ReactNode } from "react";
import type { SuggestedRecipient } from "@/entities/handoverRecord";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverReportService } from "../api/handoverReportService";
import { filledRecipients, reportErrors, type ReportErrors } from "../model/reportForm";
import { DocumentPicker } from "./DocumentPicker";
import { RecipientRows } from "./RecipientRows";

const INPUT = "h-11 w-full rounded-xl border border-heritage-border bg-white px-3";

function ErrorText({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {children}
    </p>
  );
}

/**
 * Biểu mẫu nộp hồ sơ báo tin: người thân không cần được Chủ tài sản khai từ trước. Người nộp chưa phải người nhận;
 * luật sư xác định người nhận khi lập biên bản.
 */
export function ReportForm({ onSent, onCancel }: { onSent: () => void; onCancel: () => void }) {
  const id = useId();
  const action = usePrivateAction();
  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [attested, setAttested] = useState(false);
  const [note, setNote] = useState("");
  const [deathCertificates, setDeathCertificates] = useState<File[]>([]);
  const [wills, setWills] = useState<File[]>([]);
  const [others, setOthers] = useState<File[]>([]);
  // Dòng người nhận do RecipientRows giữ (kèm hoạt ảnh); ở đây chỉ nhận bản dữ liệu để kiểm và gửi.
  const [recipients, setRecipients] = useState<SuggestedRecipient[]>([]);
  const [touched, setTouched] = useState(false);
  const busy = action.pending;

  const draft = {
    deceasedFullName: name,
    deceasedCitizenId: citizenId,
    attested,
    recipients,
    deathCertificates,
    wills,
    others,
  };
  let errors: ReportErrors = {};
  if (touched) errors = reportErrors(draft);

  const send = () => {
    setTouched(true);
    if (Object.keys(reportErrors(draft)).length > 0) return;
    void action.execute(
      () =>
        handoverReportService.submit({ ...draft, note, recipients: filledRecipients(recipients) }),
      onSent,
    );
  };

  return (
    <form
      noValidate
      className="space-y-6 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <fieldset className="space-y-3">
        <legend className="font-serif text-xl text-heritage-primary">1. Người đã mất</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor={`${id}-name`} className="block font-semibold">
              Họ tên người mất
            </label>
            <input
              id={`${id}-name`}
              className={INPUT}
              maxLength={200}
              value={name}
              disabled={busy}
              aria-invalid={Boolean(errors.deceasedFullName)}
              aria-describedby={errors.deceasedFullName ? `${id}-name-error` : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            <ErrorText id={`${id}-name-error`}>{errors.deceasedFullName}</ErrorText>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-citizen`} className="block font-semibold">
              Số căn cước người mất (12 số)
            </label>
            <input
              id={`${id}-citizen`}
              inputMode="numeric"
              autoComplete="off"
              className={INPUT}
              maxLength={12}
              value={citizenId}
              disabled={busy}
              aria-invalid={Boolean(errors.deceasedCitizenId)}
              aria-describedby={errors.deceasedCitizenId ? `${id}-citizen-error` : undefined}
              onChange={(event) => setCitizenId(event.target.value)}
            />
            <ErrorText id={`${id}-citizen-error`}>{errors.deceasedCitizenId}</ErrorText>
          </div>
        </div>
        <p className="text-heritage-muted">Ghi đúng như trên giấy chứng tử.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-xl text-heritage-primary">2. Giấy tờ</legend>
        <DocumentPicker
          label="Giấy chứng tử (bắt buộc)"
          files={deathCertificates}
          onChange={setDeathCertificates}
          disabled={busy}
          reserved={wills.length + others.length}
        />
        <ErrorText>{errors.deathCertificates}</ErrorText>
        <DocumentPicker
          label="Di chúc (bắt buộc)"
          files={wills}
          onChange={setWills}
          disabled={busy}
          reserved={deathCertificates.length + others.length}
        />
        <ErrorText>{errors.wills}</ErrorText>
        <DocumentPicker
          label="Giấy tờ khác (nếu có)"
          files={others}
          onChange={setOthers}
          disabled={busy}
          reserved={deathCertificates.length + wills.length}
        />
        <ErrorText>{errors.files}</ErrorText>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-serif text-xl text-heritage-primary">
          3. Những người nhận bạn biết
        </legend>
        <p className="leading-6 text-heritage-muted">
          Không bắt buộc. Luật sư dùng email và số điện thoại này để liên hệ, sau khi đã kiểm lại.
        </p>
        <RecipientRows disabled={busy} onChange={setRecipients} />
        <ErrorText>{errors.recipients}</ErrorText>
      </fieldset>

      <label className="block space-y-1 font-semibold">
        Lời nhắn cho luật sư (không bắt buộc)
        <textarea
          className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
          maxLength={1000}
          value={note}
          disabled={busy}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="space-y-1">
        <label className="flex cursor-pointer items-start gap-3 leading-6">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-heritage-primary"
            checked={attested}
            disabled={busy}
            aria-invalid={Boolean(errors.attested)}
            aria-describedby={errors.attested ? `${id}-attested-error` : undefined}
            onChange={(event) => setAttested(event.target.checked)}
          />
          <span>Tôi cam đoan thông tin, giấy tờ nộp là thật.</span>
        </label>
        <ErrorText id={`${id}-attested-error`}>{errors.attested}</ErrorText>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonStyles.dark} disabled={busy}>
          {busy ? "Đang nộp…" : "Nộp hồ sơ"}
        </button>
        <button type="button" className={buttonStyles.outline} disabled={busy} onClick={onCancel}>
          Hủy
        </button>
      </div>
      <ErrorText>{action.error}</ErrorText>
    </form>
  );
}
