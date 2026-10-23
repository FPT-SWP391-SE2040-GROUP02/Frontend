import { useParams, useSearchParams, Link } from "react-router-dom";
import { useId } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import { useHandoverAction } from "../model/useHandoverAction";

const CHECKLIST = ["Xác minh danh tính của bạn", "Chờ bàn giao", "Tải nội dung khi bàn giao mở"];

/**
 * Kiểm link công khai; claim chỉ sau khi người đã đăng nhập chủ động bấm. Theo thiết kế 100.
 * Link công khai chỉ cho biết lời mời hợp lệ và còn hạn phản hồi, nên không nêu tên Chủ kho hay số ngày còn lại.
 */
export function InvitationPanel() {
  const { token: pathToken } = useParams();
  const [params] = useSearchParams();
  const token = pathToken ?? params.get("token") ?? "";
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const client = useQueryClient();
  const action = useHandoverAction();
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
        <h2 className="font-serif text-3xl text-heritage-primary">Lời mời chưa dùng được</h2>
        <p className="text-sm text-heritage-muted">
          Lời mời không hợp lệ hoặc không thể đọc. Kiểm tra liên kết hoặc thử lại.
        </p>
        <button type="button" className={buttonStyles.dark} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  const loginTo = `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.RECEIVE}?token=${encodeURIComponent(token)}`)}`;
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-serif text-4xl leading-tight text-heritage-primary">
          Có người để lại cho bạn
        </h2>
        <p className="text-sm text-heritage-muted">
          {authenticated
            ? "Xác nhận để hệ thống kiểm tra quyền tiếp nhận lời mời này."
            : "Đăng nhập hoặc tạo tài khoản để nhận lời mời này."}
        </p>
      </div>
      <ul className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5">
        {CHECKLIST.map((text) => (
          <li key={text} className="flex items-center gap-3 text-sm">
            <Check className="size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
      {query.data.responseExpired && (
        <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
          Đã qua hạn phản hồi ban đầu; máy chủ sẽ kiểm tra điều kiện khi bạn xác nhận.
        </p>
      )}
      <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
        Bạn không đọc được nội dung kho khi chưa đủ điều kiện bàn giao.
      </p>
      {authenticated ? (
        <button
          type="button"
          className={`${buttonStyles.dark} w-full`}
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
          {action.pending ? "Đang xác nhận…" : "Nhận lời mời"}
        </button>
      ) : (
        <div className="space-y-3 text-center">
          <Link className={`${buttonStyles.dark} w-full`} to={loginTo}>
            Đăng nhập để tiếp tục
          </Link>
          <p className="text-sm text-heritage-muted">
            Chưa có tài khoản?{" "}
            <Link
              className="font-semibold text-heritage-primary underline"
              to={ROUTES.AUTH.REGISTER}
            >
              Tạo tài khoản
            </Link>
          </p>
        </div>
      )}
      {action.error && (
        <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          {action.error}
        </p>
      )}
      {action.succeeded && (
        <Link className={`${buttonStyles.gold} w-full`} to={ROUTES.BENEFICIARY.CLAIM}>
          Xem lượt bàn giao của tôi
        </Link>
      )}
    </div>
  );
}
