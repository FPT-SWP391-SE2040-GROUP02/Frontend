import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "../model/deathCase.schema";
import { ProxyCheckIn } from "./ProxyCheckIn";

/**
 * Thẻ "Chủ kho trễ điểm danh" trên Tổng quan: hai việc Người thực thi làm được, mỗi việc một ô.
 * Chưa có hồ sơ chứng tử thì có cả điểm danh thay lẫn báo tin; đã có hồ sơ thì chỉ còn đường vào hồ sơ.
 * Số lượt điểm danh thay còn lại và ngày trễ chưa hiện vì `/executor/vaults` chưa trả các trường này.
 */
export function OverdueCard({ vault, hasCase }: { vault: ExecutorVault; hasCase: boolean }) {
  let reportLabel = "Báo tin";
  if (hasCase) reportLabel = "Xem hồ sơ báo tin";
  let layout = "grid gap-3 p-5";
  if (!hasCase) layout = "grid gap-3 p-5 md:grid-cols-2";
  return (
    <section
      aria-labelledby="overdue-title"
      className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface"
    >
      <header className="flex items-center gap-4 bg-[#F1E6CC] px-5 py-4 text-[#7A5B25]">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-heritage-surface"
        >
          <Clock className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="overdue-title" className="text-lg font-semibold">
            {vault.ownerFullName} đã quá hạn điểm danh
          </h2>
          <p className="text-sm">Tới lượt bạn.</p>
        </div>
      </header>
      <div className={layout}>
        {!hasCase && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-heritage-border p-4">
            <p className="font-semibold">Liên lạc được, Chủ kho vẫn ổn</p>
            <ProxyCheckIn vaultId={vault.vaultId} />
          </div>
        )}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-heritage-border p-4">
          <p className="font-semibold">Đã có giấy chứng tử</p>
          <Link className={buttonStyles.gold} to={ROUTES.EXECUTOR.REPORT}>
            {reportLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
