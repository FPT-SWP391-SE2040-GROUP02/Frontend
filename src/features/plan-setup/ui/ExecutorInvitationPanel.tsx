import { useId } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { useServerNow } from "@/shared/clock/useServerNow";
import { planSetupService } from "../api/planSetupService";
import { invitationInspectFailure } from "../lib/invitationInspectError";
import { invitationTimeLeft } from "../lib/invitationTimeLeft";

const capabilities = [
  "Nhận thông báo khi người nhận gửi yêu cầu nhận tài sản",
  "Theo dõi tiến trình bàn giao",
  "Không đọc được nội dung kho",
];

/** Token only in fragment/component RAM; inspect never claims, confirmation never defaults true. */
export function ExecutorInvitationPanel({ token }: { token: string }) {
  const id = useId();
  const serverNow = useServerNow();
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const query = useQuery({
    queryKey: ["executor-invitation", id],
    queryFn: ({ signal }) => planSetupService.inspect(token, signal),
    retry: false,
    gcTime: 0,
  });
  if (query.isPending) return <p role="status">Đang kiểm tra lời mời Người thực thi…</p>;
  if (query.isError) {
    const failure = invitationInspectFailure(query.error, token);
    return (
      <div role="alert" className="space-y-4">
        <h1 className="text-3xl font-semibold text-heritage-primary">{failure.title}</h1>
        <p className="text-sm leading-6 text-heritage-muted">{failure.message}</p>
        {failure.retryable ? (
          <button
            type="button"
            className={`${buttonStyles.dark} w-full`}
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            Thử lại
          </button>
        ) : (
          <Link className={`${buttonStyles.dark} w-full`} to={ROUTES.HOME}>
            Về trang chủ
          </Link>
        )}
      </div>
    );
  }
  const remaining = invitationTimeLeft(query.data.expiresAt, serverNow.getTime());
  let validity = "Lời mời đã hết hạn";
  if (remaining !== null) {
    validity = `Lời mời còn hiệu lực ${remaining}`;
  }
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold leading-tight text-heritage-primary">
        Bạn được mời làm Người thực thi
      </h1>
      <p className="text-sm leading-6 text-heritage-muted">
        Xem kỹ trước khi quyết định. Bạn có thể từ chối.
      </p>
      <div className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5">
        <p className="text-sm font-semibold">Vai trò được mời: Người thực thi.</p>
        <ul className="space-y-2 text-sm">
          {capabilities.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-heritage-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        {query.data.scopeText && (
          <p className="whitespace-pre-line border-t border-heritage-border pt-3 text-sm leading-6">
            {query.data.scopeText}
          </p>
        )}
      </div>
      <Notice tone="warning">
        {validity} (đến {formatDateTime(query.data.expiresAt)}). Bạn không đọc được nội dung kho.
      </Notice>
      <p className="text-sm leading-6 text-heritage-muted">
        Khi Chủ tài sản kích hoạt kế hoạch, email và số điện thoại của bạn sẽ được gửi cho người
        nhận để họ liên hệ.
      </p>
      {query.data.status === "ACCEPTED" ? (
        <p>Lời mời đã được chấp nhận.</p>
      ) : !authenticated ? (
        <Link
          className={`${buttonStyles.dark} w-full`}
          to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.EXECUTOR.INVITATION}#token=${encodeURIComponent(token)}`)}`}
        >
          Đăng nhập để tự quyết định
        </Link>
      ) : (
        <>
          {user?.email && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-heritage-border bg-heritage-surface px-4 py-3 text-sm text-heritage-muted">
              <span>
                Đang đăng nhập: <strong className="text-heritage-primary">{user.email}</strong>
              </span>
              <Link
                to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.EXECUTOR.INVITATION}#token=${encodeURIComponent(token)}`)}`}
                className="font-medium text-heritage-primary underline hover:text-heritage-primary/80"
              >
                Đổi tài khoản
              </Link>
            </div>
          )}
          <p className="text-sm leading-6 text-heritage-muted">
            Bạn xem biên bản phân chia Chủ tài sản đã ký rồi mới quyết định. Cần đăng nhập đúng
            email được mời.
          </p>
          <Link className={`${buttonStyles.dark} w-full`} to={ROUTES.EXECUTOR.INVITATIONS}>
            Xem biên bản và trả lời
          </Link>
        </>
      )}
    </div>
  );
}
