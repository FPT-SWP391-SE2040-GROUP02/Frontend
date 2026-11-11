import { Link } from "react-router-dom";
import { useRecipientSubmissions } from "@/features/recipient-review";
import {
  caseCode,
  isOpenCase,
  queueStatus,
  useVerifierCases,
  useWaitingCaseSummaries,
  FIRST_PAGE,
} from "@/features/verifier-review";
import { ROUTES } from "@/shared/config/routes.config";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";

const visible = [
  { label: "Hồ sơ báo tin, giấy tờ", value: "Có" },
  { label: "Nội dung kho", value: "Không" },
];

/** Thời điểm sớm nhất trong danh sách (ISO); danh sách rỗng thì trả null. */
function oldestMoment(moments: string[]): string | null {
  let oldest: string | null = null;
  for (const moment of moments) {
    if (oldest === null || new Date(moment).getTime() < new Date(oldest).getTime()) {
      oldest = moment;
    }
  }
  return oldest;
}

/** Thẻ lớn bấm được: tiêu đề, số việc đang chờ và dòng phụ cho biết hồ sơ nộp sớm nhất. */
function WorkCard({
  to,
  title,
  count,
  oldest,
  pending,
  failed,
}: {
  to: string;
  title: string;
  count: number;
  oldest: string | null;
  pending: boolean;
  failed: boolean;
}) {
  let note = "Không còn việc";
  if (pending) note = "Đang tải…";
  else if (failed) note = "Không tải được số liệu";
  else if (oldest) note = `Cũ nhất: nộp ${formatTimeThenDate(oldest)}`;
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-heritage-border bg-heritage-surface p-6 shadow-sm transition-colors hover:bg-[#F7F4EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-3 text-5xl font-semibold tabular-nums text-heritage-primary">
        {pending || failed ? "—" : count}
      </p>
      <p className="mt-2 text-sm text-heritage-muted">{note}</p>
    </Link>
  );
}

/** Tổng quan Người xét duyệt: hai thẻ việc đang chờ (hồ sơ báo tin, hồ sơ người nhận) và phạm vi được xem. Không có hạn chót nào. */
export function VerifierOverview() {
  const cases = useWaitingCaseSummaries();
  const recipients = useRecipientSubmissions();
  const openList = useVerifierCases(FIRST_PAGE);
  const open = (openList.data?.items ?? []).filter((item) => isOpenCase(item.status));

  const caseMoments: string[] = [];
  for (const item of cases.waiting) {
    caseMoments.push(item.submittedAt ?? item.assignedAt);
  }
  const recipientMoments: string[] = [];
  let recipientCount = 0;
  if (recipients.data) {
    recipientCount = recipients.data.length;
    for (const item of recipients.data) {
      recipientMoments.push(item.submittedAt);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <WorkCard
          to={ROUTES.NOTARY.QUEUE}
          title="Hồ sơ báo tin chờ duyệt"
          count={cases.waiting.length}
          oldest={oldestMoment(caseMoments)}
          pending={cases.query.isPending}
          failed={cases.query.isError}
        />
        <WorkCard
          to={ROUTES.NOTARY.RECIPIENTS}
          title="Hồ sơ người nhận chờ duyệt"
          count={recipientCount}
          oldest={oldestMoment(recipientMoments)}
          pending={recipients.isPending}
          failed={recipients.isError}
        />
      </div>
      {(cases.query.isError || recipients.isError) && (
        <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5">
          <p className="text-sm text-[#7A1A14]">Không tải được một phần số liệu.</p>
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => {
              void cases.query.refetch();
              void recipients.refetch();
            }}
            disabled={cases.query.isFetching || recipients.isFetching}
          >
            Thử lại
          </button>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Hồ sơ báo tin đang mở">
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
                        Chủ kho: ****{item.ownerCitizenIdLast4 ?? "—"} · nộp{" "}
                        {formatTimeThenDate(item.submittedAt ?? item.assignedAt)}
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
