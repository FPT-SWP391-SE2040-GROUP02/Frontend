import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { planSetupService } from "../api/planSetupService";

const capabilities = [
  "Báo tin cho hệ thống",
  "Theo dõi tiến trình bàn giao",
  "Không đọc được nội dung kho",
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Số ngày còn lại của lời mời, làm tròn lên; lời mời đã hết hạn thì 0. */
function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / DAY_MS));
}

/** Token only in fragment/component RAM; inspect never claims, confirmation never defaults true. */
export function ExecutorInvitationPanel({ token }: { token: string }) {
  const id = useId();
  const [acknowledge, setAcknowledge] = useState(false);
  const [decision, setDecision] = useState<boolean | null>(null);
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
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
      <div role="alert" className="space-y-4">
        <h1 className="text-3xl font-semibold text-heritage-primary">Không đọc được lời mời</h1>
        <p className="text-sm leading-6 text-heritage-muted">
          Lời mời không hợp lệ hoặc không thể đọc. Kiểm tra liên kết hoặc thử lại.
        </p>
        <button
          type="button"
          className={`${buttonStyles.dark} w-full`}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          Thử lại
        </button>
      </div>
    );
  if (action.succeeded && decision) {
    return (
      <div role="status" className="space-y-5">
        <h1 className="text-3xl font-semibold leading-tight text-heritage-primary">
          Bạn đã là người thực hiện
        </h1>
        <p className="text-sm leading-6 text-heritage-muted">
          Kho đã được thêm vào tài khoản của bạn.
        </p>
        <Notice tone="success">Bạn có thể xem kho và tiến trình trong trang Tổng quan.</Notice>
        <Link className={`${buttonStyles.dark} w-full`} to={ROUTES.EXECUTOR.ROOT}>
          Vào trang Tổng quan
        </Link>
      </div>
    );
  }
  if (action.succeeded) {
    return (
      <div role="status" className="space-y-5">
        <h1 className="text-3xl font-semibold leading-tight text-heritage-primary">
          Bạn đã từ chối lời mời
        </h1>
        <p className="text-sm leading-6 text-heritage-muted">
          Không cần làm thêm gì. Bạn có thể đóng trang này.
        </p>
        <Notice tone="warning">Nếu bấm nhầm, hãy nhờ Chủ kho gửi lại lời mời.</Notice>
        <Link className={`${buttonStyles.dark} w-full`} to={ROUTES.HOME}>
          Về trang chủ
        </Link>
      </div>
    );
  }
  const remaining = daysLeft(query.data.expiresAt);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold leading-tight text-heritage-primary">
        Bạn được mời làm Người thực hiện
      </h1>
      <p className="text-sm leading-6 text-heritage-muted">
        Xem kỹ trước khi quyết định. Bạn có thể từ chối.
      </p>
      <div className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5">
        <p className="text-sm font-semibold">
          Vai trò được mời: {query.data.role === "PRIMARY" ? "Executor chính" : "Executor dự phòng"}
          .
        </p>
        <ul className="space-y-2 text-sm">
          {capabilities.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <Notice tone="warning">
        Lời mời còn hiệu lực {remaining} ngày (đến {formatDateTime(query.data.expiresAt)}). Bạn
        không đọc được nội dung kho.
      </Notice>
      <p className="text-xs leading-6 text-heritage-muted">{query.data.scopeText}</p>
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-heritage-border bg-heritage-surface px-4 py-3 text-xs text-heritage-muted">
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
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={acknowledge}
              disabled={action.pending}
              onChange={(event) => setAcknowledge(event.target.checked)}
            />
            Tôi đã đọc phạm vi, hiểu nhiệm vụ và tự nguyện chấp nhận làm Executor.
          </label>
          <div className="space-y-3">
            {[true, false].map((accept) => (
              <button
                key={String(accept)}
                type="button"
                className={`${accept ? buttonStyles.dark : buttonStyles.outline} w-full`}
                disabled={action.pending || (accept && !acknowledge)}
                onClick={() =>
                  void action.execute(
                    () =>
                      planSetupService.respond(token, accept, acknowledge, query.data.scopeVersion),
                    () => {
                      setDecision(accept);
                      void client.invalidateQueries({ queryKey: ["executor"] });
                      void client.invalidateQueries({ queryKey: ["executor-vaults"] });
                    },
                  )
                }
              >
                {accept ? "Chấp nhận lời mời" : "Từ chối"}
              </button>
            ))}
          </div>
        </>
      )}
      {action.error && (
        <div role="alert" className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-destructive">{action.error}</p>
          <p className="text-xs text-red-700">
            Nếu đây không phải tài khoản được mời, hãy{" "}
            <Link
              to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.EXECUTOR.INVITATION}#token=${encodeURIComponent(token)}`)}`}
              className="font-semibold underline hover:text-red-900"
            >
              đăng xuất và đăng nhập bằng email người được mời
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
