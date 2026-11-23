import { Link } from "react-router-dom";
import { Chip, buttonStyles } from "@/shared/ui/heritageKit";
import type { AvailableHandover } from "../model/handoverRequest.schema";
import { availableAction, availableStatusLabel } from "../model/availablePresentation";
import { useAvailableHandovers } from "../model/useHandoverRequest";

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

function AvailableRow({ row }: { row: AvailableHandover }) {
  const status = availableStatusLabel[row.status];
  const action = availableAction(row);
  let hint = "";
  if (action === null) {
    hint = noActionHint(row);
  }
  let notRequestedNote = "";
  if (row.status === "NOT_REQUESTED" && row.needsAction) {
    notRequestedNote = "Đã có yêu cầu nhận tài sản cho kho này từ người nhận khác.";
  }
  return (
    <article
      aria-label={`Kho của ${row.ownerName}`}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-heritage-border bg-white/70 p-5"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-heritage-primary">Kho của {row.ownerName}</h3>
          <Chip tone={status.tone}>{status.label}</Chip>
          {row.needsAction && <Chip tone="warning">Cần bạn làm</Chip>}
        </div>
        {notRequestedNote !== "" && (
          <p className="text-sm text-heritage-muted">{notRequestedNote}</p>
        )}
        {row.reviewReason && (
          <p className="text-sm">
            <span className="font-semibold">Lý do của luật sư: </span>
            {row.reviewReason}
          </p>
        )}
        {hint !== "" && <p className="text-sm text-heritage-muted">{hint}</p>}
      </div>
      {action !== null && (
        <Link
          to={action.to}
          className={row.needsAction ? buttonStyles.dark : buttonStyles.outline}
          aria-label={`${action.label} - kho của ${row.ownerName}`}
        >
          {action.label}
        </Link>
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
    return (
      <div className="space-y-2 rounded-2xl border border-heritage-border bg-white/70 p-5">
        <p className="font-semibold text-heritage-primary">
          Hiện tại bạn chưa là người nhận của kho nào
        </p>
        <p className="text-sm leading-6 text-heritage-muted">
          Một kho sẽ hiện ở đây khi Chủ kho khai đúng email đã xác minh của bạn làm người nhận và
          kích hoạt kế hoạch bàn giao.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-4" aria-label="Kho được để lại cho bạn">
      {query.data.map((row) => (
        <li key={`${row.vaultId}:${row.beneficiaryId}`}>
          <AvailableRow row={row} />
        </li>
      ))}
    </ul>
  );
}
