import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import type { DeathCase, ExecutorVault } from "../model/deathCase.schema";
import { useActiveCaseId, useDeathCase } from "../model/useDeathCase";
import { HandoverProgressPanel } from "./HandoverProgressPanel";

/** Vì sao bàn giao chưa bắt đầu, theo trạng thái hồ sơ báo tin. */
function notStartedText(record: DeathCase | null): string {
  if (!record)
    return "Chưa có hồ sơ báo tin. Bàn giao bắt đầu sau khi bạn gửi hồ sơ và Người xét duyệt duyệt.";
  switch (record.status) {
    case "DRAFT":
      return "Hồ sơ đang ở dạng nháp. Hãy hoàn tất và gửi ở mục Báo tin.";
    case "SUPPLEMENT_REQUIRED":
      return "Người xét duyệt cần bổ sung thông tin. Vào mục Báo tin để nộp bản bổ sung.";
    case "SUSPENDED":
      return "Hồ sơ đang tạm dừng. Hệ thống sẽ xử lý tiếp khi đủ điều kiện.";
    case "REJECTED":
      return "Hồ sơ bị từ chối. Xem lý do ở mục Báo tin.";
    case "UNDER_REVIEW":
      return "Hồ sơ đã gửi và đang chờ Người xét duyệt. Bàn giao bắt đầu sau khi hồ sơ được duyệt.";
    case "APPROVED_FOR_HANDOVER":
      return "";
  }
}

/**
 * Trang Bàn giao của một kho: khi hồ sơ báo tin đã được duyệt thì hiện bảng người nhận,
 * còn không thì nói rõ bàn giao chưa bắt đầu và dẫn về mục Báo tin.
 */
export function ExecutorProgress({ vault }: { vault: ExecutorVault }) {
  const caseId = useActiveCaseId(vault);
  const query = useDeathCase(caseId);
  if (caseId && query.isPending) return <p role="status">Đang tải hồ sơ…</p>;
  if (caseId && query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được hồ sơ hoặc bạn không có quyền trong kho này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data ?? null;
  if (caseId && record && record.status === "APPROVED_FOR_HANDOVER") {
    return <HandoverProgressPanel caseId={caseId} />;
  }
  return (
    <Panel title="Bàn giao chưa bắt đầu">
      <p role="status" className="text-sm leading-6">
        {notStartedText(record)}
      </p>
      <Link className={`${buttonStyles.gold} mt-4`} to={ROUTES.EXECUTOR.REPORT}>
        Đi tới Báo tin
      </Link>
    </Panel>
  );
}
