import { useSearchParams } from "react-router-dom";
import { useVerifierDocuments, type HandoverDocument } from "@/entities/handoverDocument";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { WorkQueueTabs, type WorkQueueRow } from "@/shared/ui/WorkQueueTabs";
import { useRecipientSubmissions } from "../model/useRecipientReview";
import {
  buildSupplementItems,
  buildWaitingItems,
  type RecipientWorkItem,
} from "../model/recipientWork";

const TAB_PARAM = "tab";
const TAB_WAITING = "waiting";
const TAB_SUPPLEMENT = "supplement";

/** Nhãn lựa chọn của người nhận: Đồng ý nhận (xanh) hoặc Từ chối nhận (xám). */
export function RecipientChoiceChip({ kind }: { kind: "ACCEPT" | "DECLINE" }) {
  if (kind === "ACCEPT") return <Chip tone="success">Đồng ý nhận</Chip>;
  return <Chip tone="neutral">Từ chối nhận</Chip>;
}

/** Nhãn "Đã bổ sung" (xanh dương nhạt) khi hồ sơ là lần nộp lại. */
export function ResubmittedChip() {
  return <Chip className="bg-[#DCEAF7] text-[#1D4E89]">Đã bổ sung</Chip>;
}

function mainLine(item: RecipientWorkItem): string {
  if (item.recipientName) return `${item.recipientName} · ${item.containerName}`;
  return `Hồ sơ người nhận · ${item.containerName}`;
}

function subLine(item: RecipientWorkItem): string {
  const verb = item.resubmitted ? "nộp lại" : "nộp";
  const when = `${verb} ${formatTimeThenDate(item.submittedAt)}`;
  const parts: string[] = [];
  if (item.ownerName) parts.push(`Chủ kho ${item.ownerName}`);
  parts.push(when);
  if (item.supplementReason) parts.push(`đã yêu cầu: ${item.supplementReason}`);
  return parts.join(" · ");
}

/**
 * Danh sách việc của mục Hồ sơ người nhận: tab Chờ bạn duyệt (nộp trước ở trên, dòng đầu tô nổi) và tab Chờ người nhận bổ sung.
 * Không có hạn chót nào: chỉ có thời điểm nộp.
 */
export function RecipientReviewList({ onOpen }: { onOpen: (submissionId: string) => void }) {
  const [params, setParams] = useSearchParams();
  const submissions = useRecipientSubmissions();
  const documents = useVerifierDocuments();

  if (submissions.isPending) return <p role="status">Đang tải hồ sơ người nhận…</p>;
  if (submissions.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5 text-sm text-[#7A1A14]">
        <p>Không tải được hồ sơ người nhận. Bạn cần là Người xét duyệt đang hoạt động.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={submissions.isFetching}
          onClick={() => void submissions.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Biên bản chỉ để bổ sung tên người nhận, tên Chủ kho và tab bổ sung; chưa tải được thì danh sách chờ duyệt vẫn hiện.
  let documentList: HandoverDocument[] = [];
  if (documents.data) documentList = documents.data;
  const waiting = buildWaitingItems(submissions.data, documentList);
  const supplement = buildSupplementItems(documentList);

  const waitingRows: WorkQueueRow[] = waiting.map((item) => ({
    key: item.submissionId,
    title: mainLine(item),
    subtitle: subLine(item),
    chips: (
      <>
        <RecipientChoiceChip kind={item.kind} />
        {item.resubmitted && <ResubmittedChip />}
      </>
    ),
    action: (
      <button
        type="button"
        className={buttonStyles.gold}
        aria-label={`Duyệt ${mainLine(item)}`}
        onClick={() => onOpen(item.submissionId)}
      >
        Duyệt
      </button>
    ),
  }));
  const supplementRows: WorkQueueRow[] = supplement.map((item) => ({
    key: item.submissionId,
    title: mainLine(item),
    subtitle: subLine(item),
    chips: <RecipientChoiceChip kind={item.kind} />,
    action: (
      <button
        type="button"
        className={buttonStyles.outline}
        aria-label={`Xem ${mainLine(item)}`}
        onClick={() => onOpen(item.submissionId)}
      >
        Xem
      </button>
    ),
  }));

  let activeKey = TAB_WAITING;
  if (params.get(TAB_PARAM) === TAB_SUPPLEMENT) activeKey = TAB_SUPPLEMENT;

  return (
    <WorkQueueTabs
      ariaLabel="Hồ sơ người nhận"
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
          count: waitingRows.length,
          hint: "Hồ sơ nộp trước ở trên, làm từ trên xuống.",
          rows: waitingRows,
          highlightFirst: true,
          emptyTitle: "Không còn hồ sơ người nhận nào chờ bạn",
          emptyText:
            "Khi người nhận nộp căn cước và ký biên bản đồng ý hoặc từ chối, hồ sơ sẽ hiện ở đây.",
        },
        {
          key: TAB_SUPPLEMENT,
          label: "Chờ người nhận bổ sung",
          count: supplementRows.length,
          hint: "Không cần bạn làm gì. Hồ sơ tự quay lại tab Chờ bạn duyệt khi được nộp lại.",
          rows: supplementRows,
          emptyTitle: "Không có hồ sơ nào đang chờ người nhận bổ sung",
          emptyText:
            "Khi bạn yêu cầu người nhận bổ sung, hồ sơ sẽ nằm ở đây cho tới khi được nộp lại.",
        },
      ]}
    />
  );
}
