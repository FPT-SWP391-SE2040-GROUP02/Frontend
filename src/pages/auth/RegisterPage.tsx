import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { getLoginRedirect, isReceiveRedirect } from "@/features/auth/lib/loginFeedback";
import {
  AUTH_LAYOUT_CONTENT,
  RECEIVE_INVITATION_SUBTITLE,
} from "@/features/auth/model/authLayout.content";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { ROUTES } from "@/shared/config/routes.config";

/** Trang đăng ký trong khung Auth dùng chung, giữ nguyên form và hợp đồng hiện tại. */
export function RegisterPage() {
  const content = AUTH_LAYOUT_CONTENT.register;
  const [params] = useSearchParams();
  // Đường dẫn quay lại (ví dụ trang nhận lời mời) được giữ qua đăng ký, xác thực email và đăng nhập.
  const rawRedirect = params.get("redirect");
  let redirect: string | null = null;
  if (rawRedirect) {
    redirect = getLoginRedirect(rawRedirect);
  }
  const fromReceive = redirect !== null && isReceiveRedirect(redirect);
  // Chỉ khi đi từ thư mời mới nhận email điền sẵn (tham số email sẵn có của luồng đăng nhập/xác minh) và email che bớt.
  let lockedEmail: string | null = null;
  let invitedEmailMasked: string | null = null;
  if (fromReceive) {
    const emailParam = z.string().trim().max(254).email().safeParse(params.get("email"));
    if (emailParam.success) {
      lockedEmail = emailParam.data;
    }
    const maskedParam = z.string().trim().max(254).includes("@").safeParse(params.get("invited"));
    if (maskedParam.success) {
      invitedEmailMasked = maskedParam.data;
    }
  }
  let description: string = content.description;
  if (fromReceive) {
    description = RECEIVE_INVITATION_SUBTITLE;
  }
  let loginTo: string = ROUTES.AUTH.LOGIN;
  if (redirect) {
    loginTo = `${ROUTES.AUTH.LOGIN}?${new URLSearchParams({ redirect })}`;
  }
  return (
    <HeritageAuthLayout sideTitle={content.sideTitle} sideSubtitle={content.sideDescription}>
      <header className="mb-8 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {content.title}
        </h1>
        <p className="text-sm leading-7 text-heritage-muted">{description}</p>
      </header>
      <RegisterForm
        redirect={redirect}
        fromInvitation={fromReceive}
        lockedEmail={lockedEmail}
        invitedEmailMasked={invitedEmailMasked}
      />
      <p className="mt-6 border-t border-heritage-border pt-5 text-sm text-heritage-muted">
        {content.existing}{" "}
        <Link
          to={loginTo}
          className="inline-flex min-h-11 items-center font-semibold text-heritage-primary underline underline-offset-4"
        >
          {content.login}
        </Link>
      </p>
    </HeritageAuthLayout>
  );
}
