import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { z } from "zod";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { WorkQueueTabs, type WorkQueueRow } from "@/shared/ui/WorkQueueTabs";
import { caseCode } from "../model/caseCode";
import { queueCategory } from "../model/verifierPresentation";
import type { verifierCaseSummarySchema } from "../model/verifierReview.schema";

type Summary = z.infer<typeof verifierCaseSummarySchema>;

const TAB_PARAM = "tab";
const TAB_WAITING = "waiting";
const TAB_SUPPLEMENT = "supplement";

/** Thời điểm Người thực thi nộp; chưa có thì dùng lúc được giao. Không dùng hạn nào để xếp. */
function submittedMoment(item: Summary): string {
  return item.submittedAt ?? item.assignedAt;
}

/** Nộp trước xếp trên; bằng nhau thì theo mã hồ sơ để thứ tự ổn định. */
function sortOldestFirst(items: Summary[]): Summary[] {
  return [...items].sort((a, b) => {
    const left = new Date(submittedMoment(a)).getTime();
    const right = new Date(submittedMoment(b)).getTime();
    if (left !== right) return left - right;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Hồ sơ báo tin nhìn từ Người xét duyệt. Danh sách không có họ tên Chủ kho (họ tên được mã hóa, DATA-02),
 * nên dòng chính nêu 4 số cuối căn cước của Chủ kho để nhận ra hồ sơ.
 */
function mainLine(item: Summary): string {
  if (item.ownerCitizenIdLast4) return `Kho của Chủ kho · căn cước ****${item.ownerCitizenIdLast4}`;
  return `Kho của Chủ kho · hồ sơ #${caseCode(item.id)}`;
}

function subLine(item: Summary): string {
  const resubmitted = (item.reviewVersionNo ?? 1) > 1;
  let verb = "nộp";
  if (resubmitted) verb = "nộp lại";
  const parts: string[] = [`Hồ sơ #${caseCode(item.id)}`];
  if (item.executorFullName) parts.push(`Người thực thi ${item.executorFullName}`);
  parts.push(`${verb} ${formatTimeThenDate(submittedMoment(item))}`);
  return parts.join(" · ");
}

function rowsFor(
  items: Summary[],
  actionLabel: string,
  actionStyle: string,
  onSelect: (caseId: string) => void,
  selected: string | null,
): WorkQueueRow[] {
  return items.map((item) => ({
    key: item.id,
    title: mainLine(item),
    subtitle: subLine(item),
    chips: (
      <>
        {(item.reviewVersionNo ?? 1) > 1 && (
          <Chip className="bg-[#DCEAF7] text-[#1D4E89]">Đã bổ sung</Chip>
        )}
        {item.unreviewedFlagCount > 0 && (
          <Chip tone="warning">{item.unreviewedFlagCount} cảnh báo chưa kiểm tra</Chip>
        )}
      </>
    ),
    action: (
      <button
        type="button"
        aria-pressed={selected === item.id}
        aria-label={`${actionLabel} hồ sơ #${caseCode(item.id)}`}
        className={actionStyle}
        onClick={() => onSelect(item.id)}
      >
        {actionLabel}
      </button>
    ),
  }));
}

/**
 * Danh sách Hồ sơ báo tin của Người xét duyệt: hai tab có số đếm (Chờ bạn duyệt, Chờ Người thực thi bổ sung),
 * nộp trước xếp trên, dòng đầu tab chờ duyệt tô nổi. Không có hạn chót nào: chỉ có thời điểm nộp.
 * Số đếm tính trên các hồ sơ của trang hiện tại.
 */
export function VerifierQueueBoard({
  items,
  selected,
  refreshing,
  onRefresh,
  onSelect,
  children,
}: {
  items: Summary[];
  selected: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSelect: (caseId: string) => void;
  /** Phân trang đặt cuối danh sách. */
  children?: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const waiting: Summary[] = [];
  const supplement: Summary[] = [];
  for (const item of items) {
    if (queueCategory(item) === "SUPPLEMENT") supplement.push(item);
    else waiting.push(item);
  }
  let activeKey = TAB_WAITING;
  if (params.get(TAB_PARAM) === TAB_SUPPLEMENT) activeKey = TAB_SUPPLEMENT;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={refreshing}
          onClick={onRefresh}
        >
          Tải lại
        </button>
      </div>
      <WorkQueueTabs
        ariaLabel="Hồ sơ báo tin"
        activeKey={activeKey}
        onSelect={(key) => {
          const next = new URLSearchParams(params);
          if (key === TAB_WAITING) next.delete(TAB_PARAM);
          else next.set(TAB_PARAM, key);
          setParams(next, { replace: true });
        }}
        tabs={[
          {
            key: TAB_WAITING,
            label: "Chờ bạn duyệt",
            count: waiting.length,
            hint: "Hồ sơ nộp trước ở trên, làm từ trên xuống.",
            rows: rowsFor(sortOldestFirst(waiting), "Duyệt", buttonStyles.gold, onSelect, selected),
            highlightFirst: true,
            emptyTitle: "Không còn hồ sơ báo tin nào chờ bạn",
            emptyText: "Khi Người thực thi nộp hồ sơ báo tin, hồ sơ sẽ hiện ở đây.",
          },
          {
            key: TAB_SUPPLEMENT,
            label: "Chờ Người thực thi bổ sung",
            count: supplement.length,
            hint: "Không cần bạn làm gì. Hồ sơ tự quay lại tab Chờ bạn duyệt khi được nộp lại.",
            rows: rowsFor(
              sortOldestFirst(supplement),
              "Xem",
              buttonStyles.outline,
              onSelect,
              selected,
            ),
            emptyTitle: "Không có hồ sơ nào đang chờ Người thực thi bổ sung",
            emptyText:
              "Khi bạn yêu cầu Người thực thi bổ sung, hồ sơ sẽ nằm ở đây cho tới khi được nộp lại.",
          },
        ]}
      />
      {children}
    </div>
  );
}
