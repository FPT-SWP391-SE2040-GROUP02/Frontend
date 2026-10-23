import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Download, Lock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Notice, Panel, type Tone } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema } from "../model/handover.schema";
import { useGrantDownload } from "../model/useGrantDownload";
import { useHandoverAction } from "../model/useHandoverAction";
import { remainingText } from "../model/handover.format";
import { currentHandoverStep } from "../model/handoverStep";
import { HandoverStepper } from "./HandoverStepper";

type Turn = z.infer<typeof handoverTurnSchema>;

const labels: Record<string, string> = {
  INVITED: "Được mời",
  INITIAL_RESPONSE_EXPIRED: "Đã qua hạn phản hồi ban đầu",
  IDENTITY_IN_PROGRESS: "Đang xác minh danh tính",
  READY_TO_ACCEPT: "Chờ quyết định tiếp nhận",
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
    "Đã qua hạn phản hồi ban đầu nhưng bạn vẫn có thể nhận lời mời; máy chủ sẽ kiểm tra khi bạn xác nhận.",
  DECISION_EXPIRED: "Hạn quyết định đã kết thúc nên lượt này không còn nhận được nữa.",
  DECLINED: "Bạn đã từ chối lượt bàn giao này.",
  CANCELLED:
    "Lượt bàn giao này đã bị hủy vì chủ kho đã được xác nhận còn sống. Nội dung không còn được bàn giao.",
  LAPSED: "Lượt bàn giao này đã kết thúc.",
};
const grantLabels: Record<string, string> = {
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn, không còn tải được",
  BLOCKED: "Đang tạm dừng trong lúc hồ sơ được xác minh lại, chưa thể tải",
  REVOKED: "Đã bị thu hồi, không còn tải được",
};
const kindLabels: Record<string, string> = { FILE: "Tệp", TEXT: "Văn bản" };

const DIALOG_CLASS = "max-w-lg bg-[#FBFAF5] p-7";
const RED_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#A32119] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#8A1B14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";

/** Hộp thoại xác nhận từ chối (thiết kế 102). Backend chưa nhận lý do từ chối nên không có ô lý do. */
function DeclineDialog({
  groupName,
  pending,
  onKeep,
  onDecline,
}: {
  groupName: string;
  pending: boolean;
  onKeep: () => void;
  onDecline: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onKeep()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            Từ chối nhận?
          </DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Phần “{groupName}” sẽ không được bàn giao cho bạn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={pending}
            onClick={onKeep}
          >
            Giữ lại
          </button>
          <button type="button" className={RED_BUTTON} disabled={pending} onClick={onDecline}>
            {pending ? "Đang gửi…" : "Từ chối nhận"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Một lượt bàn giao theo thiết kế: tiến trình sáu bước, chi tiết lượt, phản hồi và nội dung được tải. */
function TurnCard({ turn }: { turn: Turn }) {
  const action = useHandoverAction();
  const content = useGrantDownload();
  const client = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [declining, setDeclining] = useState(false);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["handover"] });
  };
  const step = currentHandoverStep(turn.status);
  const groupName = turn.container?.name ?? "Lượt bàn giao";
  const grantActive = turn.grant?.status === "ACTIVE";
  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-heritage-primary">{groupName}</h2>
        <Chip tone={tones[turn.status] ?? "neutral"}>{labels[turn.status]}</Chip>
      </header>
      {step !== null && (
        <Panel title="Tiến trình bàn giao">
          <HandoverStepper current={step} />
        </Panel>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Chi tiết lượt nhận">
          <div className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-heritage-muted">Phần để lại</dt>
                <dd className="mt-1 text-sm font-semibold">Nhóm “{groupName}”</dd>
              </div>
              <div>
                <dt className="text-xs text-heritage-muted">Hạn phản hồi</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {formatDateTime(turn.responseDeadline)}
                </dd>
              </div>
              {turn.decisionDeadline && (
                <div>
                  <dt className="text-xs text-heritage-muted">Hạn quyết định</dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {formatDateTime(turn.decisionDeadline)}
                  </dd>
                </div>
              )}
            </dl>
            {statusHints[turn.status] && <p className="text-sm">{statusHints[turn.status]}</p>}
            {turn.status === "READY_TO_ACCEPT" && turn.decisionDeadline && (
              <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm font-medium text-[#7A5B24]">
                {remainingText(turn.decisionDeadline, turn.serverTime)} để quyết định
              </p>
            )}
            {turn.status === "INVITED" && (
              <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm font-medium text-[#7A5B24]">
                {remainingText(turn.responseDeadline, turn.serverTime)} để phản hồi lời mời
              </p>
            )}
            {turn.identityBypassed && (
              <p role="status" className="text-sm text-amber-800">
                Môi trường Development đang bỏ qua bước xác minh danh tính. Đây không phải bằng
                chứng danh tính đã được xác minh.
              </p>
            )}
            {turn.status === "IDENTITY_IN_PROGRESS" && (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-heritage-muted">
                  Nếu đã hoàn tất mà lượt vẫn chờ, tải lại; hệ thống cần xác nhận danh tính cho lượt
                  trước khi mở quyết định.
                </p>
                <Link
                  to={`${ROUTES.BENEFICIARY.EKYC_CAMERA}?turnId=${turn.id}`}
                  className={buttonStyles.gold}
                >
                  Xác minh danh tính
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )}
            {turn.grant && (
              <p className="text-sm">
                Quyền xem/tải: {grantLabels[turn.grant.status] ?? turn.grant.status} · đến{" "}
                {formatDateTime(turn.grant.expiresAt)}
              </p>
            )}
          </div>
        </Panel>
        {turn.status === "READY_TO_ACCEPT" && (
          <Panel title="Phản hồi">
            <div className="space-y-3">
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={action.pending}
                  className="size-5"
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                Tôi đã đọc nội dung và xác nhận quyết định cho lượt này.
              </label>
              <button
                type="button"
                className={`${buttonStyles.gold} w-full justify-between`}
                disabled={!confirmed || action.pending}
                onClick={() =>
                  void action.execute(() => handoverService.decide(turn.id, "accept"), refresh)
                }
              >
                Đồng ý nhận
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${buttonStyles.outline} w-full justify-start`}
                disabled={action.pending}
                onClick={() => setDeclining(true)}
              >
                Từ chối
              </button>
              <p className="flex items-start gap-2 text-xs text-heritage-muted">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                Từ chối thì phần này sẽ không được bàn giao cho bạn.
              </p>
            </div>
          </Panel>
        )}
      </div>
      {grantActive && turn.grant && (
        <Notice
          tone="warning"
          title={`${remainingText(turn.grant.expiresAt, turn.serverTime)} để tải nội dung`}
        >
          Hết hạn lúc {formatDateTime(turn.grant.expiresAt)}. Sau đó nội dung không còn tải được.
        </Notice>
      )}
      {turn.items.length > 0 && (
        <Panel title="Các mục dành cho bạn">
          <ul className="divide-y divide-heritage-border">
            {turn.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-heritage-muted">
                    {kindLabels[item.kind] ?? "Mục"} · {formatStorageSize(item.sizeBytes)}
                  </span>
                </span>
                {turn.grant?.status === "ACTIVE" && (
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    aria-label={`Tải xuống ${item.name}`}
                    disabled={content.pending || action.pending}
                    onClick={() =>
                      void content.download(
                        () => handoverService.download(turn.grant!.id, item.id),
                        (item.fileName ?? `${item.name}.txt`).replace(/[^\p{L}\p{N} ._()-]/gu, "_"),
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
      {(action.pending || content.pending) && <p role="status">Đang xử lý yêu cầu…</p>}
      {(action.error || content.error) && (
        <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          {action.error || content.error}
        </p>
      )}
      {declining && (
        <DeclineDialog
          groupName={groupName}
          pending={action.pending}
          onKeep={() => setDeclining(false)}
          onDecline={() =>
            void action.execute(
              () => handoverService.decide(turn.id, "decline"),
              () => {
                setDeclining(false);
                refresh();
              },
            )
          }
        />
      )}
    </article>
  );
}

/** Danh sách lượt của principal; không dựng grant hoặc trạng thái từ URL. */
export function HandoverPortal() {
  const query = useQuery({
    queryKey: ["handover", "turns"],
    queryFn: ({ signal }) => handoverService.list(signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang tải các lượt bàn giao…</p>;
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          type="button"
          className={buttonStyles.outline}
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
        <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          Không tải được các lượt của bạn. Vui lòng thử lại.
        </p>
      ) : query.data.length === 0 ? (
        <p role="status">Bạn chưa nhận lời mời bàn giao nào trên tài khoản này.</p>
      ) : (
        query.data.map((turn) => <TurnCard key={turn.id} turn={turn} />)
      )}
    </div>
  );
}
