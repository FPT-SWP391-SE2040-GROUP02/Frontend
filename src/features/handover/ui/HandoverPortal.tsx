import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema } from "../model/handover.schema";
import { useGrantDownload } from "../model/useGrantDownload";
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
const grantLabels: Record<string, string> = {
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn, không còn tải được",
  BLOCKED: "Đang bị tạm giữ, chưa thể tải",
  REVOKED: "Đã bị thu hồi",
};
function TurnCard({ turn }: { turn: z.infer<typeof handoverTurnSchema> }) {
  const action = usePrivateAction();
  const content = useGrantDownload();
  const client = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["handover"] });
  };
  return (
    <article className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <h2 className="text-lg font-semibold">{turn.container?.name ?? "Lượt bàn giao"}</h2>
      <p className="text-sm">{labels[turn.status]}</p>
      <p className="text-sm text-heritage-muted">
        Hạn phản hồi: {new Date(turn.responseDeadline).toLocaleString("vi-VN")}
        {turn.decisionDeadline && (
          <> · Hạn quyết định: {new Date(turn.decisionDeadline).toLocaleString("vi-VN")}</>
        )}
      </p>
      {turn.identityBypassed && (
        <p role="status" className="text-sm text-amber-800">
          Môi trường Development đang bỏ qua bước xác minh danh tính. Đây không phải bằng chứng danh
          tính đã được xác minh.
        </p>
      )}
      {turn.status === "IDENTITY_IN_PROGRESS" && (
        <p className="text-sm leading-6">
          <Link
            to={`${ROUTES.BENEFICIARY.EKYC_CAMERA}?turnId=${turn.id}`}
            className="inline-flex min-h-11 items-center underline"
          >
            Xác minh danh tính
          </Link>
          <br />
          Nếu đã hoàn tất mà lượt vẫn chờ, tải lại; hệ thống cần xác nhận danh tính cho lượt trước
          khi mở quyết định.
        </p>
      )}
      {turn.status === "READY_TO_ACCEPT" && (
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
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!confirmed || action.pending}
              onClick={() =>
                void action.execute(() => handoverService.decide(turn.id, "accept"), refresh)
              }
            >
              Đồng ý tiếp nhận
            </Button>
            <Button
              variant="outline"
              disabled={!confirmed || action.pending}
              onClick={() =>
                void action.execute(() => handoverService.decide(turn.id, "decline"), refresh)
              }
            >
              Từ chối tiếp nhận
            </Button>
          </div>
        </div>
      )}
      {turn.grant && (
        <p className="text-sm">
          Quyền xem/tải: {grantLabels[turn.grant.status] ?? turn.grant.status} · đến{" "}
          {new Date(turn.grant.expiresAt).toLocaleString("vi-VN")}
        </p>
      )}
      {turn.items.length > 0 && (
        <ul className="divide-y divide-heritage-border">
          {turn.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="text-sm">
                {item.name} · {item.sizeBytes.toLocaleString("vi-VN")} byte
              </span>
              {turn.grant?.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  disabled={content.pending || action.pending}
                  onClick={() =>
                    void content.download(
                      () => handoverService.download(turn.grant!.id, item.id),
                      (item.fileName ?? `${item.name}.txt`).replace(/[^\p{L}\p{N} ._()-]/gu, "_"),
                    )
                  }
                >
                  Tải nội dung
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {(action.pending || content.pending) && <p role="status">Đang xử lý yêu cầu…</p>}
      {(action.error || content.error) && (
        <p role="alert" className="text-sm text-destructive">
          {action.error || content.error}
        </p>
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
    <div className="space-y-4">
      <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
        Tải lại lượt bàn giao
      </Button>
      {query.isError ? (
        <p role="alert">Không tải được các lượt của bạn. Vui lòng thử lại.</p>
      ) : query.data.length === 0 ? (
        <p role="status">Bạn chưa nhận lời mời bàn giao nào trên tài khoản này.</p>
      ) : (
        query.data.map((turn) => <TurnCard key={turn.id} turn={turn} />)
      )}
    </div>
  );
}
