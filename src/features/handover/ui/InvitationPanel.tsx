import { useParams, useSearchParams, Link } from "react-router-dom";
import { useId } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { handoverService } from "../api/handoverService";
/** Kiểm link công khai; claim chỉ sau khi người đã đăng nhập chủ động bấm. */
export function InvitationPanel() {
  const { token: pathToken } = useParams();
  const [params] = useSearchParams();
  const token = pathToken ?? params.get("token") ?? "";
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const client = useQueryClient();
  const action = usePrivateAction();
  const requestId = useId();
  // Không đưa token vào query key/cache bền vững; route token đổi thì remount tại page.
  const query = useQuery({
    queryKey: ["handover-invitation", requestId],
    queryFn: ({ signal }) => handoverService.invitation(token, signal),
    retry: false,
    gcTime: 0,
  });
  if (query.isPending) return <p role="status">Đang kiểm tra lời mời…</p>;
  if (query.isError || !query.data.valid)
    return (
      <div role="alert" className="space-y-4">
        <p>Lời mời không hợp lệ hoặc không thể đọc. Kiểm tra liên kết hoặc thử lại.</p>
        <Button onClick={() => void query.refetch()}>Thử lại</Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <p>
        Lời mời hợp lệ. Đăng nhập tài khoản của bạn rồi xác nhận để hệ thống kiểm tra quyền tiếp
        nhận.
      </p>
      {query.data.responseExpired && (
        <p className="text-sm text-amber-800">
          Đã qua hạn phản hồi ban đầu; máy chủ sẽ kiểm tra điều kiện khi bạn xác nhận.
        </p>
      )}
      {authenticated ? (
        <Button
          disabled={action.pending}
          onClick={() =>
            void action.execute(
              () => handoverService.claim(token),
              () => {
                void client.invalidateQueries({ queryKey: ["handover"] });
              },
            )
          }
        >
          Xác nhận nhận lời mời
        </Button>
      ) : (
        <Link
          className="inline-flex min-h-11 items-center underline"
          to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.RECEIVE}?token=${encodeURIComponent(token)}`)}`}
        >
          Đăng nhập để tiếp tục
        </Link>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && (
        <Link className="inline-flex min-h-11 items-center underline" to={ROUTES.BENEFICIARY.CLAIM}>
          Xem lượt bàn giao của tôi
        </Link>
      )}
    </div>
  );
}
