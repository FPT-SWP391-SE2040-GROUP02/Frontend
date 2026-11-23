import { useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { filesError, type MyClaim } from "../model/handoverRequest.schema";
import { DocumentPicker } from "./DocumentPicker";

/** Độ dài tối đa của lời nhắn cho luật sư. */
const NOTE_MAX_LENGTH = 1000;

/** Ba bước người nhận đọc trước khi gửi yêu cầu. */
const REQUEST_STEPS = [
  "Đính kèm giấy tờ luật sư cần (ví dụ di chúc, văn bản phân chia, bản án).",
  "Hệ thống khóa kho và báo cho Chủ kho, Người thực thi. Chủ kho còn sống thì hủy được.",
  "Luật sư xét giấy tờ: chấp nhận, yêu cầu bổ sung hoặc từ chối có lý do.",
];

/**
 * Form gửi yêu cầu dùng chung cho hai cách vào: link riêng (token) và tài khoản đã đăng nhập (vaultId).
 * Việc gọi API do nơi dùng truyền vào; form lo kiểm tệp, lời nhắn và chống gửi trùng.
 */
export function RequestForm({
  send,
  onSent,
}: {
  send: (note: string, files: File[]) => Promise<MyClaim>;
  onSent: () => void;
}) {
  const submit = usePrivateAction();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [touched, setTouched] = useState(false);
  const fileError = filesError(files);

  function handleSend() {
    setTouched(true);
    if (fileError) return;
    void submit.execute(
      () => send(note, files),
      () => onSent(),
    );
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-sunken p-4 text-sm leading-6">
        {REQUEST_STEPS.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft text-xs font-semibold text-heritage-primary"
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="space-y-2">
        <DocumentPicker files={files} onChange={setFiles} disabled={submit.pending} />
        {touched && fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>
      <label className="block space-y-2 text-sm font-semibold text-heritage-primary">
        <span className="block">
          Lời nhắn cho luật sư{" "}
          <span className="font-normal text-heritage-muted">(không bắt buộc)</span>
        </span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal text-heritage-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover"
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          disabled={submit.pending}
          placeholder="Ví dụ: Tôi gửi kèm di chúc và văn bản phân chia, bản sao có chứng thực."
          onChange={(event) => setNote(event.target.value)}
        />
        <span className="block text-right text-xs font-normal text-heritage-muted">
          {note.length}/{NOTE_MAX_LENGTH}
        </span>
      </label>
      <div className="space-y-3">
        <button
          type="button"
          className={`${buttonStyles.dark} w-full`}
          disabled={submit.pending}
          onClick={handleSend}
        >
          {submit.pending ? "Đang gửi…" : "Gửi yêu cầu"}
        </button>
        {submit.error && (
          <p role="alert" className="text-sm text-destructive">
            {submit.error}
          </p>
        )}
        <p className="flex gap-2 text-xs leading-5 text-heritage-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Hệ thống chỉ lưu tệp, không kiểm từng ô giấy tờ. Luật sư xác minh ở ngoài hệ thống.
          </span>
        </p>
      </div>
    </div>
  );
}

/** Thông báo sau khi Backend xác nhận đã nhận yêu cầu. */
export function RequestSentNotice() {
  return (
    <div className="space-y-4">
      <Notice tone="success" title="Đã gửi yêu cầu" role="status">
        Luật sư sẽ xét giấy tờ và báo kết quả. Bạn theo dõi ở mục Yêu cầu nhận tài sản trong cổng
        người nhận.
      </Notice>
      <Link className={buttonStyles.dark} to={ROUTES.BENEFICIARY.CLAIM}>
        Mở cổng người nhận
      </Link>
    </div>
  );
}
