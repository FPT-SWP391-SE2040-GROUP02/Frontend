import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import type { z } from "zod";
import { formatDate, formatDateTime } from "@/shared/lib/dateFormat";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Chip, Notice, Panel, type Tone } from "@/shared/ui/heritageKit";
import { RecipientRecordPanel } from "@/entities/handoverRecord";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema } from "../model/handover.schema";
import { useGrantDownload } from "../model/useGrantDownload";
import { useHandoverAction } from "../model/useHandoverAction";
import { remainingText } from "../model/handover.format";
import { currentHandoverStep } from "../model/handoverStep";
import { myTurnsKey, usePendingInvitations } from "../model/usePendingInvitations";
import { HandoverStepper } from "./HandoverStepper";
import { ReceiptSection } from "./ReceiptSection";
import { RecipientGuide } from "./RecipientGuide";
import { RecipientIdentityPanel } from "./RecipientIdentityPanel";
import { PendingInvitationCards } from "./PendingInvitationCards";

type Turn = z.infer<typeof handoverTurnSchema>;

const labels: Record<string, string> = {
  INVITED: "Được mời",
  INITIAL_RESPONSE_EXPIRED: "Đã qua hạn phản hồi ban đầu",
  IDENTITY_IN_PROGRESS: "Đang xác minh danh tính",
  READY_TO_ACCEPT: "Danh tính đã xong, chờ ký biên bản",
  HANDOVER_COMMITTED: "Đã tiếp nhận",
  DECLINED: "Đã từ chối",
  DECISION_EXPIRED: "Đã hết hạn quyết định",
  CANCELLED: "Đã hủy",
  LAPSED: "Đã kết thúc",
};
const tones: Record<string, Tone> = {
  INVITED: "warning",
  INITIAL_RESPONSE_EXPIRED: "neutral",
  IDENTITY_IN_PROGRESS: "warning",
  READY_TO_ACCEPT: "warning",
  HANDOVER_COMMITTED: "success",
  DECLINED: "neutral",
  DECISION_EXPIRED: "neutral",
  CANCELLED: "neutral",
  LAPSED: "neutral",
};
const statusHints: Record<string, string> = {
  INITIAL_RESPONSE_EXPIRED:
    "Đã qua hạn phản hồi ban đầu nhưng bạn vẫn có thể nhận lời mời; hệ thống sẽ kiểm tra khi bạn xác nhận.",
  DECISION_EXPIRED: "Hạn quyết định đã kết thúc nên lượt này không còn nhận được nữa.",
  DECLINED: "Bạn đã từ chối lượt bàn giao này.",
  CANCELLED:
    "Lượt này đã bị hủy vì luật sư đã sửa biên bản bàn giao và bạn không còn tên trong đó.",
  LAPSED: "Lượt bàn giao này đã kết thúc.",
};
const grantLabels: Record<string, string> = {
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn, không còn tải được",
  BLOCKED: "Đang tạm dừng trong lúc hồ sơ được xác minh lại, chưa thể tải",
  REVOKED: "Đã bị thu hồi, không còn tải được",
};
const kindLabels: Record<string, string> = { FILE: "Tệp", TEXT: "Văn bản" };

/** Một dòng của danh sách khóa-giá trị: khóa bên trái, giá trị bên phải, ngăn bằng đường kẻ mảnh. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(120px,32%)_minmax(0,1fr)] gap-4 border-b border-heritage-border py-3">
      <dt className="text-sm text-heritage-muted">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

/** Hạn phản hồi chỉ còn tác dụng ở giai đoạn phản hồi lời mời và xác minh. */
const RESPONSE_PHASE = ["INVITED", "INITIAL_RESPONSE_EXPIRED", "IDENTITY_IN_PROGRESS"];
/** Ngày kết thúc chỉ có nghĩa khi quyền tải còn hiệu lực hoặc đang tạm dừng. */
const GRANT_WITH_DATE = ["ACTIVE", "BLOCKED"];

/**
 * Một lượt bàn giao: thông báo hạn tải và xác nhận ở đầu thẻ, tiến trình sáu bước, chi tiết lượt, nội dung được tải,
 * rồi khung phản hồi. Khi người nhận có nhiều lượt chưa mở tên gói, thẻ ghi thêm ngày mời để phân biệt.
 */
function TurnCard({ turn, showInvitedDate }: { turn: Turn; showInvitedDate: boolean }) {
  const action = useHandoverAction();
  const content = useGrantDownload();
  const client = useQueryClient();
  const [typedKey, setTypedKey] = useState("");
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["handover"] });
    void client.invalidateQueries({ queryKey: ["handover-record"] });
  };
  // Bước 2 của tiến trình: danh tính đã được luật sư xác nhận, đang chờ ký biên bản bàn giao.
  const signed = turn.status === "READY_TO_ACCEPT";
  const step = currentHandoverStep(turn.status, signed, Boolean(turn.receivedAllAt));
  const hasGroupName = turn.container !== null;
  let groupName = "Lượt bàn giao";
  if (turn.container) {
    groupName = turn.container.name;
  }
  let heading = groupName;
  if (!hasGroupName && showInvitedDate) {
    heading = `${groupName} · mời ngày ${formatDate(turn.invitedAt)}`;
  }
  const grantActive = turn.grant?.status === "ACTIVE";
  let grantLine = "";
  if (turn.grant) {
    grantLine = `Thời hạn tải nội dung: ${grantLabels[turn.grant.status] ?? turn.grant.status}`;
    if (GRANT_WITH_DATE.includes(turn.grant.status)) {
      grantLine = `${grantLine} · đến ${formatDateTime(turn.grant.expiresAt)}`;
    }
  }
  return (
    <article className="space-y-4">
      {grantActive && turn.grant && (
        <Notice
          tone="warning"
          title={`${remainingText(turn.grant.expiresAt, turn.serverTime)} để tải nội dung`}
        >
          Hết hạn lúc {formatDateTime(turn.grant.expiresAt)}. Sau đó nội dung không còn tải được.
        </Notice>
      )}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-heritage-primary">{heading}</h2>
        <Chip tone={tones[turn.status] ?? "neutral"}>{labels[turn.status]}</Chip>
      </header>
      {/* Lưới 12 cột theo luồng chữ Z: trạng thái và thông tin (đọc trước) ở 7 cột trái; việc cần làm (phản hồi, nhập khóa,
          xác nhận) ở 5 cột phải. Dưới xl xếp một cột: thông tin rồi tới việc cần làm. */}
      {step !== null && (
        <Panel title="Tiến trình bàn giao" className="p-5">
          <HandoverStepper current={step} />
        </Panel>
      )}
      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <div className="min-w-0 space-y-4">
          {turn.status === "IDENTITY_IN_PROGRESS" && (
            <Panel title="Xác minh danh tính">
              <RecipientIdentityPanel turnId={turn.id} onChanged={refresh} />
            </Panel>
          )}
          {(turn.status === "READY_TO_ACCEPT" || turn.status === "HANDOVER_COMMITTED") && (
            <RecipientRecordPanel turnId={turn.id} onChanged={refresh} />
          )}
        </div>
        <div className="min-w-0 space-y-4">
          {turn.items.length > 0 && (
            <Panel title="Các mục dành cho bạn">
              {/* Nhiều mục thì danh sách cuộn trong khung, không kéo dài cả trang. */}
              <ul className="max-h-80 divide-y divide-heritage-border overflow-y-auto pr-1">
                {turn.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">{item.name}</span>
                      <span className="block text-sm text-heritage-muted">
                        {kindLabels[item.kind] ?? "Mục"} · {formatStorageSize(item.sizeBytes)}
                      </span>
                    </span>
                    {turn.grant?.status === "ACTIVE" && (
                      <button
                        type="button"
                        className={buttonStyles.outline}
                        aria-label={`Tải xuống ${item.name}`}
                        disabled={
                          content.pending ||
                          action.pending ||
                          (turn.keyRequired && !turn.keyVerified) ||
                          Boolean(turn.receivedAllAt)
                        }
                        onClick={() =>
                          void content.download(
                            () => handoverService.download(turn.grant!.id, item.id),
                            (item.fileName ?? `${item.name}.txt`).replace(
                              /[^\p{L}\p{N} ._()-]/gu,
                              "_",
                            ),
                            refresh,
                          )
                        }
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Tải xuống
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {/* Chi tiết lượt nhận nằm cột phải, ngay dưới Các mục dành cho bạn. */}
          <Panel title="Chi tiết lượt nhận">
            <div className="space-y-4">
              <dl className="border-t border-heritage-border">
                {hasGroupName && <SummaryRow label="Phần để lại" value={`Nhóm “${groupName}”`} />}
                {RESPONSE_PHASE.includes(turn.status) && (
                  <SummaryRow label="Hạn phản hồi" value={formatDateTime(turn.responseDeadline)} />
                )}
              </dl>
              {statusHints[turn.status] && <p className="text-sm">{statusHints[turn.status]}</p>}
              {turn.status === "INVITED" && (
                <p className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm font-medium text-heritage-warning">
                  {remainingText(turn.responseDeadline, turn.serverTime)} để phản hồi lời mời
                </p>
              )}
              {turn.identityBypassed && (
                <p role="status" className="text-sm text-heritage-warning">
                  Môi trường Development đang bỏ qua bước xác minh danh tính. Đây không phải bằng
                  chứng danh tính đã được xác minh.
                </p>
              )}
              {turn.status === "IDENTITY_IN_PROGRESS" && (
                <p className="text-sm leading-6 text-heritage-muted">
                  Nộp ảnh căn cước ở khung “Xác minh danh tính” phía trên. Luật sư đối chiếu xong
                  thì bạn ký biên bản bàn giao. Bạn không phải chờ người nhận khác.
                </p>
              )}
              {turn.reviewer && (
                <p className="text-sm" data-testid="reviewer-line">
                  Luật sư lập biên bản: {turn.reviewer.fullName}
                  {turn.reviewer.lawyerCardNumber
                    ? ` (thẻ luật sư ${turn.reviewer.lawyerCardNumber})`
                    : ""}
                </p>
              )}
              {grantLine && <p className="text-sm">{grantLine}</p>}
            </div>
            {turn.status === "HANDOVER_COMMITTED" && turn.keyRequired && (
              <section className="mt-4 space-y-3 border-t border-heritage-border pt-4">
                <h3 className="text-base font-semibold text-heritage-primary">Khóa mở gói</h3>
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-heritage-muted">
                    Phần của bạn đã đủ chữ ký (luật sư, Người thực thi và bạn). Nhập mã nhận Người
                    thực thi gửi vào email của bạn để tải tài sản.
                  </p>
                  {turn.keyRequired && !turn.keyVerified && (
                    <div className="space-y-2 rounded-xl border border-heritage-border bg-white p-3">
                      <label className="block text-sm font-medium" htmlFor={`key-${turn.id}`}>
                        Khóa mở gói do Người thực thi đưa
                      </label>
                      <input
                        id={`key-${turn.id}`}
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={typedKey}
                        disabled={action.pending}
                        onChange={(event) => setTypedKey(event.target.value)}
                        className="h-11 w-full rounded-xl border border-heritage-border px-3 font-mono text-sm uppercase"
                      />
                      <button
                        type="button"
                        className={`${buttonStyles.dark} w-full`}
                        disabled={action.pending || !typedKey.trim()}
                        onClick={() =>
                          void action.execute(
                            () => handoverService.verifyKey(turn.id, typedKey),
                            () => {
                              setTypedKey("");
                              refresh();
                            },
                          )
                        }
                      >
                        Xác nhận khóa
                      </button>
                      <p className="text-sm text-heritage-muted">
                        Liên hệ trực tiếp Người thực thi của kho để lấy khóa. Nhập sai nhiều lần sẽ
                        bị khóa.
                      </p>
                    </div>
                  )}
                  {turn.keyRequired && turn.keyVerified && (
                    <p role="status" className="text-sm text-heritage-success">
                      Khóa mở gói đã được xác nhận.
                    </p>
                  )}
                </div>
              </section>
            )}
            {turn.status === "HANDOVER_COMMITTED" && turn.grant && (
              <section className="mt-4 space-y-3 border-t border-heritage-border pt-4">
                <h3 className="text-base font-semibold text-heritage-primary">Phiếu giao nhận</h3>
                <ReceiptSection turn={turn} onChanged={refresh} />
              </section>
            )}
          </Panel>
          {(action.pending || content.pending) && <p role="status">Đang xử lý yêu cầu…</p>}
          {(action.error || content.error) && (
            <p
              role="alert"
              className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
            >
              {action.error || content.error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/** Danh sách lượt của principal; không dựng grant hoặc trạng thái từ URL. */
export function HandoverPortal() {
  const query = useQuery({
    queryKey: myTurnsKey,
    queryFn: ({ signal }) => handoverService.list(signal),
    retry: false,
  });
  const invitations = usePendingInvitations();
  const hasInvitations = invitations.isSuccess && invitations.data.length > 0;
  if (query.isPending) return <p role="status">Đang tải các lượt bàn giao…</p>;
  return (
    <div className="space-y-4">
      <PendingInvitationCards />
      {/* Hàng đầu: hướng dẫn nhận tài sản bên trái, nút tải lại bên phải (một hàng thay vì hai hàng lệch nhau). */}
      <div className="flex flex-wrap items-start gap-3">
        {query.isSuccess && query.data.length > 0 && (
          <div className="min-w-0 flex-1">
            <RecipientGuide />
          </div>
        )}
        <button
          type="button"
          className={`${buttonStyles.outline} ml-auto`}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw
            className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Tải lại lượt bàn giao
        </button>
      </div>
      {query.isError ? (
        <p
          role="alert"
          className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
        >
          Không tải được các lượt của bạn. Vui lòng thử lại.
        </p>
      ) : query.data.length === 0 ? (
        !hasInvitations && (
          <div className="space-y-2">
            <p role="status">Hiện chưa có gói nào chờ bạn trên tài khoản này.</p>
            <p className="text-sm text-heritage-muted">
              Nếu bạn vừa nhận thư mời, hãy đăng nhập bằng đúng email ghi trong thư.
            </p>
          </div>
        )
      ) : (
        <>
          {query.data.map((turn) => (
            <TurnCard key={turn.id} turn={turn} showInvitedDate={query.data.length > 1} />
          ))}
        </>
      )}
    </div>
  );
}
