import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { caseCode, isOpenCase, queueStatus, useVerifierCases } from "@/features/verifier-review";

const visible = [
  { label: "Hồ sơ báo tin, giấy tờ", value: "Có" },
  { label: "Nội dung kho", value: "Không" },
];

/** Tổng quan Người xét duyệt (thiết kế "Người xét duyệt — Tổng quan"): việc đang chờ và phạm vi được xem. */
export function VerifierOverview() {
  const query = useVerifierCases({ pageIndex: 1, pageSize: 20 });
  const open = (query.data?.items ?? []).filter((item) => isOpenCase(item.status));
  const needReview = open.filter((item) => item.status === "UNDER_REVIEW");
  const first = needReview[0] ?? open[0];
  return (
    <div className="space-y-6">
      {query.isPending ? (
        <p role="status">Đang tải hàng chờ…</p>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5">
          <p className="text-sm text-[#7A1A14]">Không tải được danh sách hồ sơ.</p>
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            Thử lại
          </button>
        </div>
      ) : needReview.length > 0 ? (
        <Notice
          tone="warning"
          title={`${needReview.length} hồ sơ đang chờ bạn`}
          action={
            <Link className={buttonStyles.gold} to={`${ROUTES.NOTARY.QUEUE}?caseId=${first.id}`}>
              Xem hồ sơ
            </Link>
          }
        >
          Xin xem sớm để người nhận không phải đợi lâu.
        </Notice>
      ) : (
        <Notice tone="success" title="Không có hồ sơ nào cần bạn xem lúc này">
          Hồ sơ mới giao cho bạn sẽ hiện ở đây.
        </Notice>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Hàng chờ xét duyệt">
          {open.length === 0 ? (
            <p className="text-sm text-heritage-muted">Chưa có hồ sơ nào đang được giao.</p>
          ) : (
            <ul className="divide-y divide-heritage-border">
              {open.slice(0, 5).map((item) => {
                const status = queueStatus[item.status];
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">Hồ sơ #{caseCode(item.id)}</p>
                      <p className="text-sm text-heritage-muted">
                        Chủ kho: ****{item.ownerCitizenIdLast4 ?? "—"} · Yêu cầu bởi:{" "}
                        {item.executorFullName ?? "Người thừa hành"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip tone={status.tone}>{status.label}</Chip>
                      <Link
                        className={buttonStyles.outline}
                        to={`${ROUTES.NOTARY.QUEUE}?caseId=${item.id}`}
                        aria-label={`Xem hồ sơ #${caseCode(item.id)}`}
                      >
                        Xem hồ sơ
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Bạn nhìn thấy gì?">
          <ul className="divide-y divide-heritage-border">
            {visible.map((row) => (
              <li key={row.label} className="flex items-center justify-between py-3 text-sm">
                <span>{row.label}</span>
                <span className="text-heritage-muted">{row.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
