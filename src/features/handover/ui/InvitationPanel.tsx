import { useParams, useSearchParams, Link } from "react-router-dom";
import { useId } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import { useHandoverAction } from "../model/useHandoverAction";
import { MailCheckPanel } from "./MailCheckPanel";
import { RecipientGuide } from "./RecipientGuide";

const STEPS = ["Xác minh danh tính của bạn", "Chờ bàn giao", "Tải nội dung khi bàn giao mở"];

/** Điều cần chuẩn bị trước khi xác minh; chữ lấy từ màn đồng ý eKYC để người nhận biết trước khi nhận lời mời. */
const PREPARATION = ["Căn cước còn hạn, bản gốc", "Nơi đủ sáng", "Bỏ khẩu trang, kính tối màu"];

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
        <p className="text-sm text-heritage-muted">
          Nếu bạn sao chép liên kết từ thư, kiểm tra đã chép đủ.
        </p>
        <p className="text-sm text-heritage-muted">
          <Link
            className="font-semibold text-heritage-primary underline"
            to={ROUTES.PUBLIC.CONTACT}
          >
            Liên hệ hỗ trợ
          </Link>
        </p>
      </div>
    );
  // Đăng nhập và đăng ký đều mang lời mời theo, để xong việc người dùng quay lại đúng trang này.
  const receivePath = `${ROUTES.RECEIVE}?token=${encodeURIComponent(token)}`;
  const loginTo = `${ROUTES.AUTH.LOGIN}?${new URLSearchParams({ redirect: receivePath })}`;
  const registerTo = `${ROUTES.AUTH.REGISTER}?${new URLSearchParams({ redirect: receivePath })}`;
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
      <MailCheckPanel token={token} />
      <RecipientGuide defaultOpen />
      <ul className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5">
        {STEPS.map((text, index) => (
          <li key={text} className="flex items-center gap-3 text-sm">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-heritage-border text-xs font-semibold text-heritage-primary"
            >
              {index + 1}
            </span>
            {text}
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-heritage-primary">Chuẩn bị</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {PREPARATION.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <p className="text-xs text-heritage-muted">
          Ảnh chỉ dùng để đối chiếu. Không chia sẻ cho chủ kho hay người khác.
        </p>
      </div>
      {query.data.responseExpired && (
        <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
          Đã qua hạn phản hồi ban đầu; hệ thống sẽ kiểm tra điều kiện khi bạn xác nhận.
        </p>
      )}
      <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
        Bạn không đọc được nội dung kho khi chưa đủ điều kiện bàn giao.
      </p>
      {authenticated ? (
        <button
          type="button"
          className={`${buttonStyles.dark} w-full`}
          disabled={action.pending || action.succeeded}
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
            <Link className="font-semibold text-heritage-primary underline" to={registerTo}>
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
