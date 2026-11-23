import { Link } from "react-router-dom";
import { Check, Lock, X } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import type { ExecutorVault } from "../model/deathCase.schema";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { useExecutorRecord } from "@/entities/handoverRecord";
import { executorTodo } from "../model/executorTodo";
import { EXECUTOR_ALLOWED, EXECUTOR_DENIED } from "../model/executorPermissions";
import { useExecutorPackages } from "../model/useExecutorPackages";
import { useHandoverProgress } from "../model/useHandoverProgress";
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
            <Check className="mt-0.5 size-4 shrink-0 text-heritage-success" aria-hidden="true" />
            <span>
              <span className="sr-only">Làm được: </span>
              {item}
            </span>
          </li>
        ))}
        {EXECUTOR_DENIED.slice(0, SHORT_LIST_SIZE).map((item) => (
          <li key={item} className="flex items-start gap-2 text-heritage-muted">
            <X className="mt-0.5 size-4 shrink-0 text-heritage-danger" aria-hidden="true" />
            <span>
              <span className="sr-only">Không làm được: </span>
              {item}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-sm text-heritage-muted">
        <Lock className="size-3.5" aria-hidden="true" />
        Bạn chỉ giữ hộ và giao theo biên bản, không xem được nội dung kho.
      </p>
    </Panel>
  );
}

/**
 * Tổng quan một kho Người thực thi đang phụ trách: việc quan trọng nhất ngay lúc này, kho đang ở đâu (3 bước của cả kho),
 * rồi hai thẻ gọn. Tiến độ từng người nhận nằm ở trang Bàn giao.
 */
export function ExecutorOverview({ vault }: { vault: ExecutorVault }) {
  const record = useExecutorRecord(vault.vaultId).data ?? null;
  const recordStatus = record ? record.status : "";
  const completed = recordStatus === "COMPLETED";
  const progress = useHandoverProgress(record ? record.id : "", completed).data ?? null;
  const todo = executorTodo({
    vault,
    recordStatus,
    progress,
  });

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="executor-todo-title"
        className="rounded-2xl border border-heritage-gold-soft bg-heritage-warning-bg p-5 sm:p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-heritage-warning">
          Việc của bạn bây giờ
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 id="executor-todo-title" className="text-xl font-semibold text-heritage-primary">
              {todo.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-heritage-text">{todo.text}</p>
          </div>
          {todo.buttonLabel && todo.to && (
            <Link className={buttonStyles.dark} to={todo.to}>
              {todo.buttonLabel}
            </Link>
          )}
        </div>
      </section>
      <VaultJourney vault={vault} recordStatus={recordStatus} progress={progress} />
      <div className="grid gap-6 lg:grid-cols-2">
        <GuideAndAssetsCard vault={vault} />
        <CanAndCannotCard />
      </div>
    </div>
  );
}
