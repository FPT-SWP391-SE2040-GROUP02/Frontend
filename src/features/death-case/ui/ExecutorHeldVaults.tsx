import { ROUTES } from "@/shared/config/routes.config";
import { formatDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Initial } from "@/shared/ui/heritageKit";
import { vaultStage } from "../model/executorTodo";
import { useSelectedExecutorVault } from "../model/useExecutorVaults";

/**
 * "Kho bạn đang giữ": mỗi kho một dòng (chữ cái đầu, "Kho của {Chủ kho}", ngày nhận vai, trạng thái). Kho đang mở
 * hiện chip "Đang mở"; kho khác có nút "Mở kho" để chọn kho rồi về Tổng quan. Đây là chỗ duy nhất để đổi kho. Dữ liệu từ danh sách kho Backend trả, không tự suy thêm quyền.
 */
export function ExecutorHeldVaults() {
  const { query, vaults, selected, open } = useSelectedExecutorVault();
  let body;
  if (query.isPending) {
    body = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải các kho bạn đang giữ…
      </p>
    );
  } else if (query.isError) {
    body = (
      <div role="alert" className="space-y-3 text-sm">
        <p>Không tải được các kho bạn đang giữ.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  } else if (vaults.length === 0) {
    body = (
      <p role="status" className="text-sm text-heritage-muted">
        Bạn chưa giữ kho nào. Khi bạn chấp nhận lời mời, kho đó sẽ hiện ở đây.
      </p>
    );
  } else {
    body = (
      <ul className="divide-y divide-heritage-border rounded-2xl border border-heritage-border bg-heritage-surface">
        {vaults.map((vault) => {
          const stage = vaultStage(vault);
          const isOpen = selected?.vaultId === vault.vaultId;
          return (
            <li key={vault.vaultId} className="flex flex-wrap items-center gap-4 p-4">
              <Initial name={vault.ownerFullName} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-heritage-primary">Kho của {vault.ownerFullName}</p>
                {vault.acceptedAt && (
                  <p className="text-sm text-heritage-muted">
                    Bạn nhận vai ngày {formatDate(vault.acceptedAt)}
                  </p>
                )}
              </div>
              <Chip tone={stage.tone}>{stage.label}</Chip>
              {isOpen ? (
                <Chip tone="success">Đang mở</Chip>
              ) : (
                <button
                  type="button"
                  className={buttonStyles.outline}
                  aria-label={`Mở kho của ${vault.ownerFullName}`}
                  onClick={() => open(vault.vaultId, ROUTES.EXECUTOR.ROOT)}
                >
                  Mở kho
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <section aria-labelledby="executor-held-vaults" className="space-y-4">
      <h2 id="executor-held-vaults" className="text-lg font-semibold text-heritage-primary">
        Kho bạn đang giữ
      </h2>
      {body}
    </section>
  );
}
