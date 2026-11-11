import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { useId } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { emailMatchesMask } from "@/shared/lib/invitedEmail";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import { MailCheckPanel } from "./MailCheckPanel";

export interface InvitationPanelProps {
  /** Đăng xuất rồi chuyển tới đăng nhập mang redirect về cổng người nhận; do trang truyền vào vì đăng xuất thuộc phân hệ Auth. */
  onSignOut?: () => void;
  signingOut?: boolean;
}

/**
 * Trang mở từ link trong thư: chỉ là "cửa vào" (đăng nhập hoặc tạo tài khoản), KHÔNG có nút nhận ở đây.
 * Người đã đăng nhập đúng email được chuyển thẳng tới cổng người nhận, nơi có thẻ thư mời để chọn Đồng ý hoặc Từ chối.
 * Link công khai chỉ cho biết tên Chủ kho và email được mời đã che bớt; không hiện hạn chót nào.
 */
export function InvitationPanel({ onSignOut, signingOut = false }: InvitationPanelProps) {
  const { token: pathToken } = useParams();
  const [params] = useSearchParams();
  const token = pathToken ?? params.get("token") ?? "";
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
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
      </div>
    );

  const invitation = query.data;
  const maskedEmail = invitation.invitedEmailMasked ?? "";
  const invitedEmail = invitation.invitedEmail ?? "";
  const portal = ROUTES.BENEFICIARY.CLAIM;

  if (authenticated) {
    const accountEmail = user?.email ?? "";
    // Đăng nhập sai email: báo rõ thay vì đưa vào cổng nơi sẽ không thấy thư mời. Backend vẫn kiểm lại khi nhận.
    let wrongAccount = false;
    if (invitedEmail && accountEmail) {
      wrongAccount = invitedEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase();
    } else if (maskedEmail && accountEmail) {
      wrongAccount = !emailMatchesMask(accountEmail, maskedEmail);
    }
    if (wrongAccount) {
      return (
        <div className="space-y-5" role="alert">
          <h2 className="font-serif text-3xl leading-tight text-heritage-primary">
            Bạn đang đăng nhập bằng tài khoản khác
          </h2>
          <p className="text-sm leading-6 text-heritage-muted">
            Bạn đang dùng <b className="break-all text-heritage-primary">{accountEmail}</b>, còn gói
            này được gửi tới{" "}
            <b className="break-all text-heritage-primary">{invitedEmail || maskedEmail}</b>. Hãy
            đăng nhập bằng đúng email trong thư để mở gói.
          </p>
          <button
            type="button"
            className={`${buttonStyles.dark} w-full`}
            disabled={signingOut}
            onClick={() => onSignOut?.()}
          >
            {signingOut ? "Đang đăng xuất…" : "Đăng xuất và đăng nhập đúng email"}
          </button>
        </div>
      );
    }
    return <Navigate to={portal} replace />;
  }

  // Đăng nhập và đăng ký đều mang redirect để xong việc người dùng về thẳng cổng người nhận, không về lại trang này.
  const loginTo = `${ROUTES.AUTH.LOGIN}?${new URLSearchParams({ redirect: portal })}`;
  const registerParams = new URLSearchParams({ redirect: portal });
  if (invitedEmail) {
    // Email đầy đủ: form đăng ký điền sẵn và khóa.
    registerParams.set("email", invitedEmail);
  } else if (maskedEmail) {
    registerParams.set("invited", maskedEmail);
  }
  const registerTo = `${ROUTES.AUTH.REGISTER}?${registerParams}`;
  const owner = invitation.ownerFullName?.trim() ?? "";
  let title = "Có người đã để lại cho bạn một gói";
  if (owner) {
    title = `${owner} đã để lại cho bạn một gói`;
  }
  let firstStep = "Tạo tài khoản bằng email này";
  if (invitation.accountExists) {
    firstStep = "Đăng nhập tài khoản của bạn";
  }
  const steps = [
    firstStep,
    "Chọn đồng ý hoặc từ chối nhận, tải ảnh căn cước, ký biên bản",
    "Chờ Người xét duyệt, rồi nhập mã mở gói Người thực thi đưa cho bạn",
  ];
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-serif text-4xl leading-tight text-heritage-primary">{title}</h2>
        <p className="text-sm leading-6 text-heritage-muted">
          Chúng tôi rất tiếc về mất mát của bạn.
          {(invitedEmail || maskedEmail) && (
            <>
              {" "}
              Gói này được gửi tới <b className="break-all">{invitedEmail || maskedEmail}</b>.
            </>
          )}{" "}
          Bạn có thể mở bất cứ lúc nào bạn sẵn sàng.
        </p>
      </div>
      <section
        aria-labelledby="invitation-steps-title"
        className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5"
      >
        <h3 id="invitation-steps-title" className="text-sm font-semibold text-heritage-primary">
          Bạn sẽ làm gì
        </h3>
        <ol className="space-y-3">
          {steps.map((text, index) => (
            <li key={text} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full border border-heritage-border text-xs font-semibold text-heritage-primary"
              >
                {index + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </section>
      {invitation.accountExists ? (
        <div className="space-y-3 text-center">
          <Link className={`${buttonStyles.dark} w-full`} to={loginTo}>
            Đăng nhập để mở thư mời
          </Link>
          <p className="text-sm">
            <Link
              className="font-semibold text-heritage-primary underline"
              to={ROUTES.AUTH.FORGOT_PASSWORD}
            >
              Quên mật khẩu?
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <Link className={`${buttonStyles.dark} w-full`} to={registerTo}>
            Tạo tài khoản bằng email này
          </Link>
          <p className="text-sm text-heritage-muted">
            Đã có tài khoản?{" "}
            <Link className="font-semibold text-heritage-primary underline" to={loginTo}>
              Đăng nhập
            </Link>
          </p>
        </div>
      )}
      <details className="group text-sm text-heritage-muted">
        <summary className="cursor-pointer list-none font-medium text-heritage-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold">
          Không chắc email này có thật? Kiểm tra thư bằng mã hồ sơ
        </summary>
        <div className="mt-3">
          <MailCheckPanel token={token} />
        </div>
      </details>
    </div>
  );
}
