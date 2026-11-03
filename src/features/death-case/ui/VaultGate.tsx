import type { ReactNode } from "react";
import type { ExecutorVault } from "../model/deathCase.schema";
import type { useSelectedExecutorVault } from "../model/useExecutorVaults";
import { ExecutorVaultList } from "./ExecutorVaultList";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";

type VaultState = ReturnType<typeof useSelectedExecutorVault>;

/**
 * Cổng chung của các trang Executor: tải kho, báo lỗi, chưa có nhiệm vụ, danh sách kho kèm việc cần làm
 * (khi có nhiều kho mà chưa chọn), rồi mới hiện nội dung cho kho đang chọn. Đổi kho dùng bộ chuyển kho ở đầu
 * sidebar. Quyền trên từng kho vẫn do Backend kiểm tra.
 */
export function VaultGate({
  state,
  children,
}: {
  state: VaultState;
  children: (vault: ExecutorVault) => ReactNode;
}) {
  const { query, vaults, selected, select, open } = state;
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
  if (!selected) return <ExecutorVaultList vaults={vaults} onSelect={select} onOpen={open} />;
  return <>{children(selected)}</>;
}
