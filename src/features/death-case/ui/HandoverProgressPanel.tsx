import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ZodError } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { Button } from "@/shared/ui/button";
import { deathCaseService } from "../api/deathCaseService";
import {
  RESENDABLE_TURN_STATUSES,
  type HandoverProgress,
  type HandoverProgressTurn,
} from "../model/handoverProgress.schema";
import { remainingText } from "../model/remainingText";
import { handoverProgressKey, useHandoverProgress } from "../model/useHandoverProgress";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const turnStatusLabels: Record<HandoverProgressTurn["status"], string> = {
  INVITED: "Đã mời, chờ người nhận phản hồi",
  INITIAL_RESPONSE_EXPIRED: "Quá hạn phản hồi, người nhận vẫn có thể nhận muộn",
  IDENTITY_IN_PROGRESS: "Người nhận đang xác minh danh tính",
  READY_TO_ACCEPT: "Chờ người nhận quyết định",
  HANDOVER_COMMITTED: "Người nhận đã đồng ý nhận",
  DECLINED: "Người nhận đã từ chối",
  DECISION_EXPIRED: "Quá hạn quyết định",
  CANCELLED: "Lượt đã bị hủy",
  LAPSED: "Lượt đã kết thúc",
};

const grantStatusLabels: Record<NonNullable<HandoverProgressTurn["grantStatus"]>, string> = {
  ACTIVE: "đang trong thời hạn tải",
  BLOCKED: "đang bị tạm khóa",
  EXPIRED: "đã hết hạn tải",
  REVOKED: "đã bị thu hồi",
};

const summaryLabels: Array<[keyof HandoverProgress["summary"], string]> = [
  ["totalTurns", "Tổng số lượt"],
  ["waitingResponse", "Chờ phản hồi"],
  ["inVerification", "Đang xác minh"],
  ["accepted", "Đã đồng ý"],
  ["declined", "Đã từ chối"],
  ["ended", "Đã kết thúc"],
];

function errorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === HTTP_STATUS.NOT_FOUND) {
    return "Không tìm thấy hồ sơ, hoặc tài khoản không còn là Executor đang hiệu lực của kho này.";
  }
  if (error instanceof ZodError) {
    return "Dữ liệu tiến độ trả về không đúng định dạng. Báo nhóm Backend kiểm tra hợp đồng API.";
  }
  return "Không tải được tiến độ bàn giao.";
}

function Deadline({
  label,
  value,
  serverTime,
}: {
  label: string;
  value: string;
  serverTime: string;
}) {
  return (
    <div>
      <dt className="text-heritage-muted">{label}</dt>
      <dd>
        {dateTimeFormatter.format(new Date(value))} ({remainingText(value, serverTime)})
      </dd>
    </div>
  );
}

/**
 * Gửi lại lời mời cho lượt chưa ai nhận. Không optimistic: chỉ báo thành công sau response của BE,
 * rồi đọc lại tiến độ. Link cũ hết dùng nên cần xác nhận trước khi gửi.
 */
function ResendInvitation({ caseId, turnId }: { caseId: string; turnId: string }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [confirming, setConfirming] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const send = () =>
    void action.execute(
      () => deathCaseService.resendInvitation(caseId, turnId),
      (result) => {
        setConfirming(false);
        setSentAt(result.invitationSentAt);
        void client.invalidateQueries({ queryKey: handoverProgressKey(caseId) });
      },
    );
  return (
    <div className="space-y-2">
      {!confirming ? (
        <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
          Gửi lại lời mời
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-heritage-border p-3 text-sm">
          <p>
            Lời mời cũ sẽ không dùng được nữa. Hạn phản hồi không đặt lại. Chỉ gửi lại được sau tối
            thiểu 15 phút kể từ lần gửi trước.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={send} disabled={action.pending}>
              {action.pending ? "Đang gửi…" : "Xác nhận gửi lại"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={action.pending}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {sentAt && !action.error && (
        <p role="status" className="text-sm">
          Đã gửi lại lời mời lúc {dateTimeFormatter.format(new Date(sentAt))}.
        </p>
      )}
    </div>
  );
}

function TurnCard({
  caseId,
  turn,
  serverTime,
}: {
  caseId: string;
  turn: HandoverProgressTurn;
  serverTime: string;
}) {
  const waiting = turn.status === "INVITED" || turn.status === "INITIAL_RESPONSE_EXPIRED";
  const deciding = turn.status === "IDENTITY_IN_PROGRESS" || turn.status === "READY_TO_ACCEPT";
  return (
    <li className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-4">
      <div>
        <h4 className="font-semibold">
          Gói “{turn.containerName}” · người nhận CCCD ***{turn.beneficiaryCitizenIdLast4}
        </h4>
        <p className="text-sm">{turnStatusLabels[turn.status]}</p>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-heritage-muted">Đã mời lúc</dt>
          <dd>{dateTimeFormatter.format(new Date(turn.invitedAt))}</dd>
        </div>
        {waiting && (
          <Deadline label="Hạn phản hồi" value={turn.responseDeadline} serverTime={serverTime} />
        )}
        {deciding && turn.decisionDeadline && (
          <Deadline label="Hạn quyết định" value={turn.decisionDeadline} serverTime={serverTime} />
        )}
        {turn.decidedAt && (
          <div>
            <dt className="text-heritage-muted">Quyết định lúc</dt>
            <dd>{dateTimeFormatter.format(new Date(turn.decidedAt))}</dd>
          </div>
        )}
        {turn.grantStatus && (
          <div>
            <dt className="text-heritage-muted">Quyền tải</dt>
            <dd>
              {grantStatusLabels[turn.grantStatus]}
              {turn.grantStatus === "ACTIVE" && turn.grantExpiresAt
                ? `, hết hạn ${dateTimeFormatter.format(new Date(turn.grantExpiresAt))} (${remainingText(turn.grantExpiresAt, serverTime)})`
                : ""}
            </dd>
          </div>
        )}
      </dl>
      {RESENDABLE_TURN_STATUSES.includes(turn.status) && (
        <ResendInvitation caseId={caseId} turnId={turn.turnId} />
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Đã tải {turn.downloadedItems}/{turn.totalItems} tài sản
        </p>
        {turn.items.length > 0 && (
          <ul className="space-y-1 text-sm">
            {turn.items.map((item) => (
              <li key={item.itemId}>
                {item.name} ({item.kind === "FILE" ? "tệp" : "văn bản"}):{" "}
                {item.downloaded && item.firstDownloadedAt
                  ? `đã tải lần đầu ${dateTimeFormatter.format(new Date(item.firstDownloadedAt))}`
                  : "chưa tải"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Tiến độ bàn giao chỉ đọc cho Executor: từng lượt (một gói cho một người nhận), hạn và
 * tài sản đã tải. Không có thao tác ghi; mọi quyền do Backend kiểm.
 */
export function HandoverProgressPanel({ caseId }: { caseId: string }) {
  const query = useHandoverProgress(caseId);
  return (
    <section aria-labelledby="handover-progress-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="handover-progress-title" className="text-lg font-semibold">
          Tiến độ bàn giao
        </h3>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Tải lại tiến độ
        </Button>
      </div>
      {query.isPending ? (
        <p role="status">Đang tải tiến độ bàn giao…</p>
      ) : query.isError ? (
        <div role="alert" className="space-y-3">
          <p>{errorMessage(query.error)}</p>
          <Button onClick={() => void query.refetch()}>Thử lại</Button>
        </div>
      ) : !query.data.handoverStarted ? (
        <p role="status">
          Bàn giao chưa bắt đầu. Bàn giao chỉ mở sau khi Verifier duyệt hồ sơ chứng tử.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {summaryLabels.map(([key, label]) => (
              <div key={key} className="rounded-lg border border-heritage-border p-3">
                <dt className="text-heritage-muted">{label}</dt>
                <dd className="text-lg font-semibold">{query.data.summary[key]}</dd>
              </div>
            ))}
          </dl>
          {query.data.turns.length === 0 ? (
            <p role="status">Hồ sơ đã duyệt nhưng chưa có lượt bàn giao nào.</p>
          ) : (
            <ul className="space-y-3">
              {query.data.turns.map((turn) => (
                <TurnCard
                  key={turn.turnId}
                  caseId={caseId}
                  turn={turn}
                  serverTime={query.data.serverTime}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
