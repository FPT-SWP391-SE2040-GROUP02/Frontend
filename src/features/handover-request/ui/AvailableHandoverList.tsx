import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { RECEIVE_STEP_TITLES, RECEIVE_STEPS_DONE } from "@/entities/handoverRecord";
import { Chip, buttonStyles } from "@/shared/ui/heritageKit";
import type { AvailableHandover } from "../model/handoverRequest.schema";
import {
  availableAction,
  availableStatusLabel,
  availableStep,
  canSendRequestHere,
} from "../model/availablePresentation";
import { useAvailableHandovers } from "../model/useHandoverRequest";
import { InlineRequestForm } from "./InlineRequestForm";
import { ReceiveEmptyState } from "./ReceiveEmptyState";
import { RequestSentNotice } from "./RequestForm";

/** Câu giải thích ngắn khi dòng chưa có nút để bấm. */
function noActionHint(row: AvailableHandover): string {
  if (row.status === "NOT_REQUESTED") {
    return "Chưa gửi được yêu cầu lúc này: kế hoạch của tài sản chưa kích hoạt hoặc việc bàn giao đã hoàn tất.";
  }
  if (row.status === "REJECTED") {
    return "Yêu cầu đã bị từ chối.";
  }
  return "";
}

/** Dòng "Bước x/6" của một kho; rỗng khi kho không ở bước nào. */
function stepLine(row: AvailableHandover): string {
  const step = availableStep(row);
  if (step === null) {
    return "";
  }
  if (step === RECEIVE_STEPS_DONE) {
    return "Đã xong cả 6 bước.";
  }
  return `Bước ${step}/${RECEIVE_STEP_TITLES.length}: ${RECEIVE_STEP_TITLES[step - 1]}`;
}

/** Sáu đoạn tiến trình: đã xong màu xanh, đang làm màu vàng, chưa tới màu viền. Chữ "Bước x/6" bên dưới nói thay. */
function StepBar({ step }: { step: number }) {
  return (
    <div aria-hidden="true" className="flex gap-1.5">
      {RECEIVE_STEP_TITLES.map((title, index) => {
        const number = index + 1;
        let color = "bg-heritage-border";
        if (number < step) color = "bg-heritage-success";
        if (number === step) color = "bg-heritage-gold";
        return (
          <span key={title} className="h-2 flex-1 overflow-hidden rounded-full bg-heritage-border">
            {number <= step && (
              <span
                className={`receive-fill block h-full rounded-full ${color}`}
                style={{ animationDelay: `${120 + index * 40}ms` }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Câu trấn an khi đang chờ bên khác; rỗng khi tới lượt người nhận hoặc đã xong. */
function waitingHint(row: AvailableHandover): string {
  if (row.needsAction) {
    return "";
  }
  if (
    row.status === "REQUEST_PENDING" ||
    row.status === "IN_REVIEW" ||
    row.status === "WAITING_OTHERS"
  ) {
    return "Bạn chưa cần làm gì, có thay đổi sẽ hiện ở đây.";
  }
  return "";
}

/** Hai trạng thái của nút "Gửi yêu cầu": form đang mở hay đã gửi xong (thông báo ở lại dù dòng đã đổi trạng thái). */
function useRequestForm(regionRef: RefObject<HTMLDivElement | null>) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  // Form mở dưới nút bấm, có thể nằm ngoài màn hình: cuộn tới sau khi khung trượt xong một nhịp.
  useEffect(() => {
    if (!open || regionRef.current === null) {
      return;
    }
    const region = regionRef.current;
    if (typeof region.scrollIntoView !== "function") {
      return;
    }
    let behavior: ScrollBehavior = "smooth";
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      behavior = "auto";
    }
    const timer = window.setTimeout(
      () => region.scrollIntoView({ behavior, block: "nearest" }),
      120,
    );
    return () => window.clearTimeout(timer);
  }, [open, regionRef]);

  return { open, setOpen, sent, setSent };
}

function AvailableRow({ row }: { row: AvailableHandover }) {
  const status = availableStatusLabel[row.status];
  const action = availableAction(row);
  const requestHere = canSendRequestHere(row);
  const requestLabel = row.status === "REJECTED" ? "Gửi yêu cầu mới" : "Gửi yêu cầu";
  const regionRef = useRef<HTMLDivElement>(null);
  const form = useRequestForm(regionRef);
  const regionId = useId();
  const step = availableStep(row);
  const progress = stepLine(row);
  let hint = waitingHint(row);
  if (action === null && !requestHere && hint === "") {
    hint = noActionHint(row);
  }
  // Yêu cầu trước bị từ chối là đã đóng: không khóa người nhận, cho gửi yêu cầu mới.
  if (row.status === "REJECTED" && requestHere) {
    hint = "Yêu cầu trước đã bị từ chối và đã đóng. Bạn có thể gửi yêu cầu mới.";
  }
  let notRequestedNote = "";
  if (row.status === "NOT_REQUESTED" && row.needsAction) {
    notRequestedNote = "Đã có yêu cầu nhận tài sản này từ người nhận khác.";
  }
  // Kho cần người nhận làm gì đó: viền vàng và nút đậm; kho đang chờ: viền thường và nút viền.
  let border = "border-heritage-border";
  let actionClass = buttonStyles.outline;
  if (row.needsAction) {
    border = "border-heritage-gold";
    actionClass = buttonStyles.dark;
  }
  return (
    <article
      aria-label={`Tài sản của ${row.ownerName}`}
      className={`space-y-4 rounded-2xl border bg-heritage-surface p-5 shadow-sm ${border}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-heritage-primary">Tài sản của {row.ownerName}</h3>
        <Chip tone={status.tone}>{status.label}</Chip>
      </div>
      {step !== null && (
        <div className="space-y-2">
          <StepBar step={step} />
          <p className="text-sm font-semibold">{progress}</p>
        </div>
      )}
      {notRequestedNote !== "" && <p className="text-sm text-heritage-muted">{notRequestedNote}</p>}
      {row.reviewReason && (
        <p className="text-sm">
          <span className="font-semibold">Lý do của luật sư: </span>
          {row.reviewReason}
        </p>
      )}
      {(hint !== "" || action !== null || requestHere) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 basis-60 text-sm text-heritage-muted">{hint}</p>
          {action !== null && (
            <Link
              to={action.to}
              className={`${actionClass} receive-press`}
              aria-label={`${action.label} - tài sản của ${row.ownerName}`}
            >
              {action.label}
            </Link>
          )}
          {requestHere && (
            <button
              type="button"
              aria-expanded={form.open}
              aria-controls={regionId}
              aria-label={`${requestLabel} - tài sản của ${row.ownerName}`}
              className={`${actionClass} receive-press`}
              onClick={() => form.setOpen((current) => !current)}
            >
              {form.open ? "Thu gọn" : requestLabel}
            </button>
          )}
        </div>
      )}
      {form.sent && <RequestSentNotice />}
      {requestHere && !form.sent && (
        <div
          id={regionId}
          ref={regionRef}
          data-open={form.open}
          inert={!form.open}
          className="receive-collapse receive-collapse-slow"
        >
          <div>
            <div className="border-t border-heritage-border pt-5">
              <InlineRequestForm
                vaultId={row.vaultId}
                onSent={() => form.setSent(true)}
                onCancel={() => form.setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * Danh sách kho được để lại cho tài khoản: mỗi kho một dòng, một nút cho bước tiếp theo.
 * Dòng cần làm nằm trên cùng (hook đã sắp). Đủ bốn trạng thái: đang tải, lỗi có thử lại, rỗng, có dữ liệu.
 */
export function AvailableHandoverList() {
  const query = useAvailableHandovers();
  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải danh sách tài sản được để lại cho bạn…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được danh sách. Kiểm tra kết nối rồi thử lại.</p>
        <button
          type="button"
          className={buttonStyles.dark}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (query.data.length === 0) {
    return <ReceiveEmptyState />;
  }
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-heritage-primary">
        Tài sản được để lại cho bạn ({query.data.length})
      </h2>
      <ul className="space-y-4" aria-label="Tài sản được để lại cho bạn">
        {query.data.map((row, index) => (
          <li
            key={`${row.vaultId}:${row.beneficiaryId}`}
            className="receive-rise"
            style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
          >
            <AvailableRow row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}
