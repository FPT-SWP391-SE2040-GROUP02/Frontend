import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { planSetupService } from "../api/planSetupService";

/** Token only in fragment/component RAM; inspect never claims, confirmation never defaults true. */
export function ExecutorInvitationPanel({ token }: { token: string }) {
  const id = useId();
  const [acknowledge, setAcknowledge] = useState(false);
  const [decision, setDecision] = useState<boolean | null>(null);
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const client = useQueryClient();
  const action = usePrivateAction();
  const query = useQuery({
    queryKey: ["executor-invitation", id],
    queryFn: ({ signal }) => planSetupService.inspect(token, signal),
    retry: false,
    gcTime: 0,
  });
  if (query.isPending) return <p role="status">Đang kiểm tra lời mời Executor…</p>;
  if (query.isError)
    return (
      <div role="alert">
        <p>Lời mời không hợp lệ hoặc không thể đọc. Kiểm tra liên kết hoặc thử lại.</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  if (action.succeeded)
    return (
      <div role="status">
        <p>
          {decision ? "Bạn đã chấp nhận nhiệm vụ Executor." : "Bạn đã từ chối nhiệm vụ Executor."}
        </p>
        {decision && (
          <Link className="inline-flex min-h-11 items-center underline" to={ROUTES.EXECUTOR.CLAIM}>
            Xem nhiệm vụ của tôi
          </Link>
        )}
      </div>
    );
  return (
    <div className="space-y-5">
      <p>
        Vai trò được mời: {query.data.role === "PRIMARY" ? "Executor chính" : "Executor dự phòng"}.
      </p>
      <p>Hạn lời mời: {new Date(query.data.expiresAt).toLocaleString("vi-VN")}</p>
      <p className="leading-7">{query.data.scopeText}</p>
      {query.data.status === "ACCEPTED" ? (
        <p>Lời mời đã được chấp nhận.</p>
      ) : !authenticated ? (
        <Link
          className="inline-flex min-h-11 items-center underline"
          to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.EXECUTOR.INVITATION}#token=${encodeURIComponent(token)}`)}`}
        >
          Đăng nhập để tự quyết định
        </Link>
      ) : (
        <>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={acknowledge}
              disabled={action.pending}
              onChange={(event) => setAcknowledge(event.target.checked)}
            />
            Tôi đã đọc phạm vi, hiểu nhiệm vụ và tự nguyện chấp nhận làm Executor.
          </label>
          <div className="flex flex-wrap gap-3">
            {[true, false].map((accept) => (
              <Button
                key={String(accept)}
                variant={accept ? "default" : "outline"}
                disabled={action.pending || (accept && !acknowledge)}
                onClick={() =>
                  void action.execute(
                    () =>
                      planSetupService.respond(token, accept, acknowledge, query.data.scopeVersion),
                    () => {
                      setDecision(accept);
                      void client.invalidateQueries({ queryKey: ["executor"] });
                    },
                  )
                }
              >
                {accept ? "Chấp nhận nhiệm vụ" : "Từ chối nhiệm vụ"}
              </Button>
            ))}
          </div>
        </>
      )}
      {action.error && (
        <p role="alert" className="text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}
