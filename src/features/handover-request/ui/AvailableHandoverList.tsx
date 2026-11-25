import { Link } from "react-router-dom";
import { RECEIVE_STEP_TITLES, RECEIVE_STEPS_DONE } from "@/entities/handoverRecord";
import { Chip, buttonStyles } from "@/shared/ui/heritageKit";
import type { AvailableHandover } from "../model/handoverRequest.schema";
import {
  availableAction,
  availableStatusLabel,
  availableStep,
} from "../model/availablePresentation";
import { useAvailableHandovers } from "../model/useHandoverRequest";
import { ReceiveEmptyState } from "./ReceiveEmptyState";

/** Câu giải thích ngắn khi dòng chưa có nút để bấm. */
function noActionHint(row: AvailableHandover): string {
  if (row.status === "NOT_REQUESTED") {
    return "Chưa gửi được yêu cầu lúc này: kế hoạch của kho chưa kích hoạt hoặc việc bàn giao đã hoàn tất.";
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

function AvailableRow({ row }: { row: AvailableHandover }) {
  const status = availableStatusLabel[row.status];
  const action = availableAction(row);
  const step = availableStep(row);
  const progress = stepLine(row);
  let hint = waitingHint(row);
  if (action === null && hint === "") {
    hint = noActionHint(row);
  }
  let notRequestedNote = "";
  if (row.status === "NOT_REQUESTED" && row.needsAction) {
    notRequestedNote = "Đã có yêu cầu nhận tài sản cho kho này từ người nhận khác.";
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
      aria-label={`Kho của ${row.ownerName}`}
      className={`space-y-4 rounded-2xl border bg-heritage-surface p-5 shadow-sm ${border}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-heritage-primary">Kho của {row.ownerName}</h3>
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
      {(hint !== "" || action !== null) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 basis-60 text-sm text-heritage-muted">{hint}</p>
          {action !== null && (
            <Link
              to={action.to}
              className={`${actionClass} receive-press`}
              aria-label={`${action.label} - kho của ${row.ownerName}`}
            >
              {action.label}
            </Link>
          )}
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
        Đang tải danh sách kho được để lại cho bạn…
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
        Kho được để lại cho bạn ({query.data.length})
      </h2>
      <ul className="space-y-4" aria-label="Kho được để lại cho bạn">
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
