import { Link, useSearchParams } from "react-router-dom";
import { Scale, ClipboardCheck, LogOut } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import {
  VerifierCaseList,
  VerifierCaseDetail,
  VerifierReviewModals,
  useVerifierCase,
} from "@/features/verifier-review";
/** Bàn làm việc Verifier; principal được Backend xác minh vai trò theo DB (ROLE-04). */
export function VerifierWorkspace() {
  const [params, setParams] = useSearchParams();
  const caseId = params.get("caseId");
  const detailQuery = useVerifierCase(caseId);
  return (
    <div className="space-y-6">
      <header className="space-y-1 border-b border-heritage-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-heritage-gold/30 bg-heritage-gold/10 px-3 py-1 text-xs font-semibold text-heritage-primary">
            <Scale className="size-3.5" aria-hidden="true" />
            Cổng thẩm định chứng tử (DeathCase Review)
          </div>
          <Link
            to={ROUTES.AUTH.LOGOUT}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-heritage-border px-4 text-sm font-semibold text-heritage-primary hover:bg-heritage-gold/10 focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Đăng xuất
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Bàn làm việc Verifier</h1>
        <p className="text-sm text-heritage-muted">
          Xét các hồ sơ chứng tử do Executor nộp; duyệt mở bàn giao, yêu cầu bổ sung hoặc từ chối.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section
          aria-label="Danh sách hồ sơ"
          className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-4"
        >
          <h2 className="text-sm font-semibold">Hồ sơ được giao</h2>
          <VerifierCaseList
            onSelect={(id) => {
              const next = new URLSearchParams(params);
              next.set("caseId", id);
              next.delete("modal");
              next.delete("flagId");
              setParams(next);
            }}
          />
        </section>
        <section
          aria-label="Chi tiết hồ sơ"
          className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-4"
        >
          {caseId ? (
            <>
              <VerifierCaseDetail key={caseId} caseId={caseId} />
              {detailQuery.data && !detailQuery.isError && (
                <VerifierReviewModals caseId={caseId} detail={detailQuery.data} />
              )}
            </>
          ) : (
            <p className="py-8 text-sm text-heritage-muted">
              Chọn một hồ sơ ở danh sách bên trái để bắt đầu xét.
            </p>
          )}
        </section>
      </div>
      <footer className="text-xs text-heritage-muted">
        <ClipboardCheck className="mr-1 inline size-3.5" aria-hidden="true" />
        Vai trò Verifier do Backend xác minh từ DB; FE không cấp quyền.
      </footer>
    </div>
  );
}
