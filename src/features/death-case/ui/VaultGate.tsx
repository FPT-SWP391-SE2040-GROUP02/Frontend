import type { ReactNode } from "react";
import type { ExecutorVault } from "../model/deathCase.schema";
import type { useSelectedExecutorVault } from "../model/useExecutorVaults";
import { VaultPicker } from "./ExecutorOverview";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";

type VaultState = ReturnType<typeof useSelectedExecutorVault>;

/**
 * Cổng chung của các trang Executor: tải kho, báo lỗi, chưa có nhiệm vụ, chọn kho (khi có nhiều kho),
 * rồi mới hiện nội dung cho kho đang chọn. Quyền trên từng kho vẫn do Backend kiểm tra.
 */
export function VaultGate({
  state,
  children,
}: {
  state: VaultState;
  children: (vault: ExecutorVault) => ReactNode;
}) {
  const { query, vaults, selected, select, clear } = state;
  if (query.isPending) return <p role="status">Đang tải các kho được phân công…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được các kho được phân công.</p>
        <button type="button" className={buttonStyles.dark} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  if (vaults.length === 0) {
    return (
      <Panel title="Chưa có nhiệm vụ">
        <p role="status" className="text-sm leading-6">
          Tài khoản chưa có nhiệm vụ Executor đang hiệu lực.
        </p>
        <p className="mt-2 text-sm leading-6 text-heritage-muted">
          Khi một Chủ kho mời bạn và bạn chấp nhận lời mời, kho đó sẽ xuất hiện ở đây.
        </p>
      </Panel>
    );
  }
  if (!selected) return <VaultPicker vaults={vaults} onSelect={select} />;
  return (
    <div className="space-y-6">
      {vaults.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F4F1E6] px-4 py-3 text-sm">
          <span>
            Đang xem kho của <strong>{selected.ownerFullName}</strong>
          </span>
          <button
            type="button"
            className="font-semibold underline underline-offset-4"
            onClick={clear}
          >
            Đổi kho
          </button>
        </div>
      )}
      {children(selected)}
    </div>
  );
}
