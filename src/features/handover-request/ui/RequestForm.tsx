import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { type HandoverDocuments, EMPTY_DOCUMENTS } from "../model/handoverDocuments";
import { type MyClaim } from "../model/handoverRequest.schema";
import { REQUEST_NOTE_MAX_LENGTH, requestErrors, type RequestErrors } from "../model/requestForm";
import { ErrorText } from "./ErrorText";
import { HandoverDocumentFields } from "./HandoverDocumentFields";

/**
 * Form gửi yêu cầu nằm trong thẻ kho ở trang Nhận tài sản (gửi bằng tài khoản đã đăng nhập). Cùng bố cục, cùng phần giấy
 * tờ, cùng cách báo lỗi và cùng ô cam đoan với form nộp hồ sơ báo tin (ReportForm). Việc gọi API do nơi dùng truyền vào;
 * form lo kiểm tệp, lời nhắn và chống gửi trùng.
 */
export function RequestForm({
  send,
  onSent,
  onCancel,
}: {
  send: (note: string, documents: HandoverDocuments) => Promise<MyClaim>;
  onSent: () => void;
  /** Có thì hiện nút Hủy để thu gọn form, như form nộp hồ sơ. */
  onCancel?: () => void;
}) {
  const id = useId();
  const submit = usePrivateAction();
  // Gửi xong thì nút giữ dấu tích một nhịp rồi mới đổi sang thông báo đã gửi.
  const sent = useSuccessHold();
  const [attested, setAttested] = useState(false);
  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState(EMPTY_DOCUMENTS);
  const [touched, setTouched] = useState(false);
  const busy = submit.pending;

  const draft = { attested, ...documents };
  let errors: RequestErrors = {};
  if (touched) {
    errors = requestErrors(draft);
  }

  const handleSend = () => {
    setTouched(true);
    if (Object.keys(requestErrors(draft)).length > 0) return;
    void submit.execute(
      () => sent.hold(() => send(note, documents)),
      () => onSent(),
    );
  };

  return (
    <form
      noValidate
      className="space-y-6 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <HandoverDocumentFields
        legend="1. Giấy tờ"
        intro="Hệ thống báo cho Chủ tài sản, Người thực thi và phân công một luật sư. Luật sư xét giấy tờ: chấp nhận (lúc này tài sản mới khóa), yêu cầu bổ sung hoặc từ chối có lý do."
        documents={documents}
        errors={errors}
        disabled={busy}
        onChange={setDocuments}
      />

      <label className="block space-y-1 font-semibold">
        Lời nhắn cho luật sư (không bắt buộc)
        <textarea
          className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
          maxLength={REQUEST_NOTE_MAX_LENGTH}
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
        <ActionButton
          type="submit"
          className={buttonStyles.dark}
          pending={busy}
          done={sent.done}
          pendingLabel="Đang gửi…"
          doneLabel="Đã gửi"
        >
          Gửi yêu cầu
        </ActionButton>
        {onCancel && (
          <button type="button" className={buttonStyles.outline} disabled={busy} onClick={onCancel}>
            Hủy
          </button>
        )}
      </div>
      <ErrorText>{submit.error}</ErrorText>
    </form>
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
