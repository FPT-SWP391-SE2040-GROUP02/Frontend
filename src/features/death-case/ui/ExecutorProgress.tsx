import { Link } from "react-router-dom";
import { useExecutorRecord } from "@/entities/handoverRecord";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "../model/deathCase.schema";
import { HandoverProgressPanel } from "./HandoverProgressPanel";

/** Vì sao bàn giao chưa bắt đầu, theo bước của biên bản. */
function notStartedText(status: string | null): string {
  if (status === "DRAFTING")
    return "Luật sư đang lập biên bản. Danh sách người nhận hiện ở đây sau khi biên bản được chốt.";
  return "Chưa có yêu cầu nhận tài sản. Khi người nhận gửi yêu cầu và luật sư chốt biên bản, tiến độ từng người nhận hiện ở đây.";
}

/**
 * Trang Bàn giao của một kho: khi luật sư đã chốt biên bản thì hiện bảng người nhận (và nút gửi mã cho từng người
 * khi lượt của người đó được mở), còn không thì nói rõ bàn giao chưa bắt đầu và dẫn về mục Biên bản bàn giao.
 */
export function ExecutorProgress({ vault }: { vault: ExecutorVault }) {
  const query = useExecutorRecord(vault.vaultId);
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được biên bản hoặc bạn không có quyền trong kho này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data;
  const started =
    record !== null &&
    (record.status !== "DRAFTING" || record.finalizedAt !== null || record.revisionNo > 1);
  if (record && started) {
    return <HandoverProgressPanel recordId={record.id} vaultId={vault.vaultId} />;
  }
  return (
    <Panel title="Bàn giao chưa bắt đầu">
      <p role="status" className="text-sm leading-6">
        {notStartedText(record ? record.status : null)}
      </p>
      <Link className={`${buttonStyles.dark} mt-4`} to={ROUTES.EXECUTOR.REPORT}>
        Đi tới Biên bản bàn giao
      </Link>
    </Panel>
  );
}
