import { Link } from "react-router-dom";
import { Check, Lock, X } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDateTime } from "@/shared/lib/dateFormat";
import type { ExecutorVault } from "../model/deathCase.schema";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { executorTodo, type CaseStatus } from "../model/executorTodo";
import { EXECUTOR_ALLOWED, EXECUTOR_DENIED } from "../model/executorPermissions";
import { useDeathCase } from "../model/useDeathCase";
import { useExecutorPackages } from "../model/useExecutorPackages";
import { useHandoverProgress } from "../model/useHandoverProgress";
import { OverdueCard } from "./OverdueCard";
import { VaultJourney } from "./VaultJourney";

/** Hai thẻ gọn dưới cùng chỉ lấy vài dòng đầu của danh sách quyền hạn đầy đủ. */
const SHORT_LIST_SIZE = 3;

/** Tóm tắt hướng dẫn của Chủ kho và số tài sản giao cho Người thực thi quản lý việc bàn giao. */
function GuideAndAssetsCard({ vault }: { vault: ExecutorVault }) {
  const packages = useExecutorPackages(vault.vaultId);
  let assetCount = 0;
  let packageCount = 0;
  if (packages.isSuccess) {
    packageCount = packages.data.length;
    for (const item of packages.data) {
      assetCount += item.assets.length;
    }
  }
  let lead = `${vault.ownerFullName} chưa để lại hướng dẫn bàn giao`;
  if (vault.executorNote) lead = `${vault.ownerFullName} để lại hướng dẫn bàn giao`;
  let summary = `${lead}.`;
  if (packages.isSuccess) {
    summary = `${lead} và giao bạn ${assetCount} tài sản trong ${packageCount} gói.`;
  }
  return (
    <Panel title="Hướng dẫn và tài sản">
      <p className="text-sm leading-6">{summary}</p>
      <Link className={`${buttonStyles.outline} mt-4`} to={ROUTES.EXECUTOR.ASSETS}>
        Xem tài sản và hướng dẫn
      </Link>
    </Panel>
  );
}

function CanAndCannotCard() {
  return (
    <Panel title="Bạn làm được / không làm được">
      <ul className="space-y-2 text-sm">
        {EXECUTOR_ALLOWED.slice(0, SHORT_LIST_SIZE).map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
            <span>
              <span className="sr-only">Làm được: </span>
              {item}
            </span>
          </li>
        ))}
        {EXECUTOR_DENIED.slice(0, SHORT_LIST_SIZE).map((item) => (
          <li key={item} className="flex items-start gap-2 text-heritage-muted">
            <X className="mt-0.5 size-4 shrink-0 text-[#A32119]" aria-hidden="true" />
            <span>
              <span className="sr-only">Không làm được: </span>
              {item}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-sm text-heritage-muted">
        <Lock className="size-3.5" aria-hidden="true" />
        Bạn chỉ báo tin và theo dõi, không xem được nội dung kho.
      </p>
    </Panel>
  );
}

/**
 * Tổng quan một kho Người thực thi đang phụ trách: việc quan trọng nhất ngay lúc này, kho đang ở đâu (3 bước của cả kho),
 * rồi hai thẻ gọn. Tiến độ từng người nhận nằm ở trang Bàn giao.
 */
export function ExecutorOverview({ vault }: { vault: ExecutorVault }) {
  const hasCase = Boolean(vault.openDeathCaseId);
  const record = useDeathCase(vault.openDeathCaseId).data ?? null;
  const approved = record?.status === "APPROVED_FOR_HANDOVER";
  const progress =
    useHandoverProgress(vault.openDeathCaseId ?? "", hasCase && approved).data ?? null;

  let caseStatus: CaseStatus | null = null;
  if (record) caseStatus = record.status;
  const todo = executorTodo({ vault, caseStatus, progress });
  const showLastCheckIn = !hasCase && !vault.checkInOverdue && Boolean(vault.lastOwnerCheckInAt);

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="executor-todo-title"
        className="rounded-2xl border border-[#E0C486] bg-[#FBF3E0] p-5 sm:p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-[#7A5B25]">
          Việc của bạn bây giờ
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 id="executor-todo-title" className="text-xl font-semibold text-heritage-primary">
              {todo.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-heritage-text">{todo.text}</p>
            {showLastCheckIn && vault.lastOwnerCheckInAt && (
              <p className="mt-2 text-sm text-heritage-muted">
                {vault.ownerFullName} tự điểm danh lần gần nhất lúc{" "}
                {formatDateTime(vault.lastOwnerCheckInAt)}.
              </p>
            )}
          </div>
          {todo.buttonLabel && todo.to && (
            <Link className={buttonStyles.dark} to={todo.to}>
              {todo.buttonLabel}
            </Link>
          )}
        </div>
      </section>
      {vault.checkInOverdue && <OverdueCard vault={vault} hasCase={hasCase} />}
      <VaultJourney vault={vault} caseStatus={caseStatus} progress={progress} />
      <div className="grid gap-6 lg:grid-cols-2">
        <GuideAndAssetsCard vault={vault} />
        <CanAndCannotCard />
      </div>
    </div>
  );
}
