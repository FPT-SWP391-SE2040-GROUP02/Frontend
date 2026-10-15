import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { deathCaseService } from "../api/deathCaseService";
import { DeathCaseEditor } from "./DeathCaseEditor";
function CaseDetail({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["death-case", id],
    queryFn: ({ signal }) => deathCaseService.get(id, signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang tải hồ sơ…</p>;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được hồ sơ hoặc bạn không có quyền trong kho này.</p>
        <Button onClick={() => void query.refetch()}>Thử lại</Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => window.location.reload()}>
        Tải lại hồ sơ và bỏ thay đổi chưa lưu
      </Button>
      <DeathCaseEditor record={query.data} />
    </div>
  );
}
/** Principal USER được truy cập, danh sách kho và từng action do Backend kiểm Executor đang hiệu lực. */
export function ExecutorPortal() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("caseId");
  const action = usePrivateAction();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["executor-vaults"],
    queryFn: ({ signal }) => deathCaseService.vaults(signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang tải các kho được phân công…</p>;
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => void query.refetch()}>
        Tải lại danh sách kho
      </Button>
      {query.isError ? (
        <p role="alert">Không tải được các kho được phân công.</p>
      ) : query.data.length === 0 ? (
        <p role="status">Tài khoản chưa có nhiệm vụ Executor đang hiệu lực.</p>
      ) : (
        <ul className="space-y-3">
          {query.data.map((vault) => (
            <li
              key={vault.vaultId}
              className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-5"
            >
              <h2 className="font-semibold">Kho của {vault.ownerFullName}</h2>
              <p className="text-sm">
                {vault.role === "PRIMARY" ? "Executor chính" : "Executor dự phòng"} ·{" "}
                {vault.planStatus}
                {vault.checkInOverdue ? " · Quá hạn điểm danh" : ""}
              </p>
              {vault.openDeathCaseId ? (
                <Button
                  variant="outline"
                  onClick={() => setParams({ caseId: vault.openDeathCaseId! })}
                >
                  Xem hồ sơ đang mở
                </Button>
              ) : (
                <Button
                  disabled={action.pending}
                  onClick={() =>
                    void action.execute(
                      () => deathCaseService.open(vault.vaultId),
                      (record) => {
                        client.setQueryData(["death-case", record.id], record);
                        void client.invalidateQueries({ queryKey: ["executor-vaults"] });
                        setParams({ caseId: record.id });
                      },
                    )
                  }
                >
                  Mở hồ sơ chứng tử
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {selected && <CaseDetail key={selected} id={selected} />}
    </div>
  );
}
