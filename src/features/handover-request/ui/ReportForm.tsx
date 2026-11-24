import { useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { SuggestedRecipient } from "@/entities/handoverRecord";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverReportService } from "../api/handoverReportService";
import {
  filledRecipients,
  MAX_REPORT_RECIPIENTS,
  reportErrors,
  todayInVietnam,
  type ReportErrors,
} from "../model/reportForm";
import { DocumentPicker } from "./DocumentPicker";

const INPUT = "h-11 w-full rounded-xl border border-heritage-border bg-white px-3";
const EMPTY_RECIPIENT: SuggestedRecipient = { fullName: "", email: "", phone: "" };

function ErrorText({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {children}
    </p>
  );
}

/** Các dòng người nhận để luật sư liên hệ nhanh: họ tên, email, số điện thoại. */
function RecipientRows({
  rows,
  disabled,
  onChange,
}: {
  rows: SuggestedRecipient[];
  disabled: boolean;
  onChange: (rows: SuggestedRecipient[]) => void;
}) {
  const update = (index: number, field: keyof SuggestedRecipient, value: string) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          role="group"
          aria-label={`Người nhận ${index + 1}`}
          className="space-y-3 rounded-xl border border-heritage-border bg-white p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-heritage-primary">Người nhận {index + 1}</p>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Bỏ người nhận ${index + 1}`}
              className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-heritage-muted hover:bg-heritage-sunken hover:text-heritage-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="block font-semibold">Họ tên</span>
              <input
                className={INPUT}
                maxLength={200}
                value={row.fullName}
                disabled={disabled}
                onChange={(event) => update(index, "fullName", event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold">Email</span>
              <input
                type="email"
                className={INPUT}
                maxLength={256}
                value={row.email}
                disabled={disabled}
                onChange={(event) => update(index, "email", event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold">Số điện thoại</span>
              <input
                type="tel"
                className={INPUT}
                maxLength={32}
                value={row.phone}
                disabled={disabled}
                onChange={(event) => update(index, "phone", event.target.value)}
              />
            </label>
          </div>
        </div>
      ))}
      {rows.length < MAX_REPORT_RECIPIENTS && (
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={disabled}
          onClick={() => onChange([...rows, EMPTY_RECIPIENT])}
        >
          Thêm người nhận
        </button>
      )}
    </div>
  );
}

/**
 * Biểu mẫu nộp hồ sơ báo tin: người thân không cần được Chủ kho khai từ trước. Người nộp chưa phải người nhận;
 * luật sư xác định người nhận khi lập biên bản.
 */
export function ReportForm({ onSent, onCancel }: { onSent: () => void; onCancel: () => void }) {
  const id = useId();
  const action = usePrivateAction();
  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [attested, setAttested] = useState(false);
  const [note, setNote] = useState("");
  const [deathCertificates, setDeathCertificates] = useState<File[]>([]);
  const [wills, setWills] = useState<File[]>([]);
  const [others, setOthers] = useState<File[]>([]);
  const [recipients, setRecipients] = useState<SuggestedRecipient[]>([EMPTY_RECIPIENT]);
  const [touched, setTouched] = useState(false);
  const busy = action.pending;

  const draft = {
    deceasedFullName: name,
    deceasedCitizenId: citizenId,
    dateOfDeath,
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
          <div className="space-y-1">
            <label htmlFor={`${id}-death`} className="block font-semibold">
              Ngày mất
            </label>
            <input
              id={`${id}-death`}
              type="date"
              min="1900-01-01"
              max={todayInVietnam()}
              className={INPUT}
              value={dateOfDeath}
              disabled={busy}
              aria-invalid={Boolean(errors.dateOfDeath)}
              aria-describedby={errors.dateOfDeath ? `${id}-death-error` : undefined}
              onChange={(event) => setDateOfDeath(event.target.value)}
            />
            <ErrorText id={`${id}-death-error`}>{errors.dateOfDeath}</ErrorText>
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
        />
        <ErrorText>{errors.deathCertificates}</ErrorText>
        <DocumentPicker
          label="Di chúc (bắt buộc)"
          files={wills}
          onChange={setWills}
          disabled={busy}
        />
        <ErrorText>{errors.wills}</ErrorText>
        <DocumentPicker
          label="Giấy tờ khác (nếu có)"
          files={others}
          onChange={setOthers}
          disabled={busy}
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
        <RecipientRows rows={recipients} disabled={busy} onChange={setRecipients} />
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
          <span>Tôi cam đoan thông tin và giấy tờ nộp là thật.</span>
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
