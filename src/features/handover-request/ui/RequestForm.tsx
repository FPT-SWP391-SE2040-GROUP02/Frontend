import { useState } from "react";
import { Link } from "react-router-dom";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import {
  documentErrors,
  EMPTY_DOCUMENTS,
  type HandoverDocuments,
} from "../model/handoverDocuments";
import type { MyClaim } from "../model/handoverRequest.schema";
import { HandoverDocumentFields } from "./HandoverDocumentFields";

/** Độ dài tối đa của lời nhắn cho luật sư. */
const NOTE_MAX_LENGTH = 1000;

/** Ba bước người nhận đọc trước khi gửi yêu cầu. */
const REQUEST_STEPS = [
  "Đính kèm giấy chứng tử, di chúc (bắt buộc) và giấy tờ khác nếu có.",
  "Hệ thống báo cho Chủ tài sản, Người thực thi và phân công một luật sư.",
  "Luật sư xét giấy tờ: chấp nhận (lúc này tài sản mới khóa), yêu cầu bổ sung hoặc từ chối có lý do.",
];

/**
 * Form gửi yêu cầu nằm trong thẻ kho ở trang Nhận tài sản (gửi bằng tài khoản đã đăng nhập).
 * Việc gọi API do nơi dùng truyền vào; form lo kiểm giấy tờ (cùng phần với form nộp hồ sơ báo tin), lời nhắn và chống
 * gửi trùng.
 */
export function RequestForm({
  send,
  onSent,
}: {
  send: (note: string, documents: HandoverDocuments) => Promise<MyClaim>;
  onSent: () => void;
}) {
  const submit = usePrivateAction();
  // Gửi xong thì nút giữ dấu tích một nhịp rồi mới đổi sang thông báo đã gửi.
  const sent = useSuccessHold();
  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState(EMPTY_DOCUMENTS);
  const [touched, setTouched] = useState(false);
  const errors = touched ? documentErrors(documents) : {};

  function handleSend() {
    setTouched(true);
    if (Object.keys(documentErrors(documents)).length > 0) return;
    void submit.execute(
      () => sent.hold(() => send(note, documents)),
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
      <HandoverDocumentFields
        legend="Giấy tờ"
        documents={documents}
        errors={errors}
        disabled={submit.pending}
        onChange={setDocuments}
      />
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
          placeholder="Ví dụ: Tôi gửi kèm văn bản phân chia, các bản sao có chứng thực."
          onChange={(event) => setNote(event.target.value)}
        />
        <span className="block text-right text-xs font-normal text-heritage-muted">
          {note.length}/{NOTE_MAX_LENGTH}
        </span>
      </label>
      <div className="space-y-3">
        <ActionButton
          className={`${buttonStyles.dark} w-full`}
          pending={submit.pending}
          done={sent.done}
          pendingLabel="Đang gửi…"
          doneLabel="Đã gửi"
          onClick={handleSend}
        >
          Gửi yêu cầu
        </ActionButton>
        {submit.error && (
          <p role="alert" className="text-sm text-destructive">
            {submit.error}
          </p>
        )}
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
