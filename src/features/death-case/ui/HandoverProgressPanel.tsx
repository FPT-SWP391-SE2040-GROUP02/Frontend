import { isAxiosError } from "axios";
import { ZodError } from "zod";
import { HTTP_STATUS } from "@/shared/constants";
import type { HandoverProgress } from "../model/handoverProgress.schema";
import { countTurns, sortTurnRows } from "../model/executorTurns";
import { useHandoverProgress } from "../model/useHandoverProgress";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { HandoverTurnRow } from "./HandoverTurnRow";

function errorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === HTTP_STATUS.NOT_FOUND) {
    return "Không tìm thấy hồ sơ, hoặc tài khoản không còn là Người thực thi đang hiệu lực của kho này.";
  }
  if (error instanceof ZodError) {
    return "Dữ liệu tiến độ trả về không đúng định dạng. Báo nhóm Backend kiểm tra hợp đồng API.";
  }
  return "Không tải được tiến độ bàn giao.";
}

function Tile({
  label,
  value,
  caption,
  emphasis,
}: {
  label: string;
  value: number;
  caption?: string;
  /** Ô "Cần bạn làm" khi có việc: viền và nền vàng để nhìn là thấy. */
  emphasis?: boolean;
}) {
  let tone = "border-heritage-border bg-heritage-surface";
  if (emphasis) tone = "border-heritage-gold-soft bg-heritage-warning-bg";
  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <dt className="text-sm text-heritage-muted">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tabular-nums text-heritage-primary">{value}</dd>
      {caption && <p className="mt-2 text-sm text-heritage-muted">{caption}</p>}
    </div>
  );
}

function ProgressBody({
  recordId,
  vaultId,
  data,
}: {
  recordId: string;
  vaultId?: string;
  data: HandoverProgress;
}) {
  const counts = countTurns(data.turns);
  const rows = sortTurnRows(data.turns);
  return (
    <>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Đã nhận xong"
          value={counts.done}
          caption={`trên ${counts.total} người nhận`}
        />
        <Tile label="Cần bạn làm" value={counts.action} emphasis={counts.action > 0} />
        <Tile label="Đang chờ người nhận" value={counts.waiting} />
        <Tile label="Từ chối nhận" value={counts.declined} />
      </dl>
      <ul aria-label="Danh sách người nhận" className="space-y-3">
        {rows.map((row) => (
          <HandoverTurnRow
            key={row.turn.turnId}
            recordId={recordId}
            vaultId={vaultId}
            turn={row.turn}
            progress={row.progress}
          />
        ))}
      </ul>
      <p className="text-sm leading-5 text-heritage-muted">
        Thanh bước của từng người: Mời → Luật sư kiểm danh tính → Ký biên bản (luật sư, Người thực
        thi và người này) → Nhập mã mở gói → Hai bên ký phiếu giao nhận. Mỗi người được mở riêng,
        không chờ người khác.
      </p>
    </>
  );
}

/**
 * Trang Bàn giao của Người thực thi: bốn ô số rồi mỗi người nhận một dòng. Chỉ đọc (trừ gửi mã mở gói qua email
 * do Backend kiểm); không có hạn chót. Quyền và trạng thái do Backend quyết định.
 */
export function HandoverProgressPanel({
  recordId,
  vaultId,
}: {
  recordId: string;
  /** Kho của hồ sơ; có thì ô gửi mã cho phép lấy mã đã nhận trên hệ thống. */
  vaultId?: string;
}) {
  const query = useHandoverProgress(recordId);
  let body;
  if (query.isPending) {
    body = <p role="status">Đang tải tiến độ bàn giao…</p>;
  } else if (query.isError) {
    body = (
      <div role="alert" className="space-y-3">
        <p>{errorMessage(query.error)}</p>
        <button type="button" className={buttonStyles.dark} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  } else if (!query.data.handoverStarted) {
    body = (
      <p role="status">
        Bàn giao chưa bắt đầu. Bàn giao chỉ mở sau khi luật sư chốt biên bản bàn giao.
      </p>
    );
  } else if (query.data.turns.length === 0) {
    body = <p role="status">Hồ sơ đã duyệt nhưng chưa có người nhận nào để bàn giao.</p>;
  } else {
    body = <ProgressBody recordId={recordId} vaultId={vaultId} data={query.data} />;
  }
  return (
    <section aria-labelledby="handover-progress-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="handover-progress-title" className="sr-only">
          Danh sách người nhận
        </h2>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Tải lại tiến độ
        </button>
      </div>
      {body}
    </section>
  );
}
