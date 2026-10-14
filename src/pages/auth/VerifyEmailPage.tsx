import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { VerifyEmailNotice } from "@/features/auth/ui/VerifyEmailNotice";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { VERIFY_EMAIL_CONTENT as content } from "@/features/auth/model/verifyEmail.schema";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Trang Xác minh Email (Mockup 6 - XacMinhEmail.dc.html).
 * Hiển thị sau khi đăng ký hoặc khi đăng nhập yêu cầu xác minh địa chỉ email.
 *
 * @returns {React.JSX.Element} Trang xác minh email
 */
export function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [verified, setVerified] = useState(false);
  const email = searchParams.get("email") ?? "";
  const tokens = searchParams.getAll("token");
  const token = tokens.length === 0 ? null : tokens.length === 1 ? tokens[0] : "";
  const [previousToken, setPreviousToken] = useState(token);
  if (token !== previousToken) {
    setPreviousToken(token);
    if (token !== null) setVerified(false);
  }

  return (
    <HeritageAuthLayout
      sideTitle="Kho của bạn vẫn kín, dù bạn vắng mặt."
      sideSubtitle="Đăng nhập để điểm danh, xem các gói và người nhận. Không ai đọc được tài sản của bạn."
    >
      {verified && token === null ? (
        <section className="space-y-4" aria-labelledby="verified-email-title">
          <h1 id="verified-email-title" className="font-serif text-2xl">
            {content.title}
          </h1>
          <p role="status" className="text-sm text-emerald-700">
            {content.verified}
          </p>
          <p>{content.verifiedDescription}</p>
          <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center underline">
            {content.login}
          </Link>
        </section>
      ) : (
        <VerifyEmailNotice
          email={email}
          token={token}
          onVerified={() => {
            setVerified(true);
            setSearchParams(
              (previous) => {
                const next = new URLSearchParams(previous);
                next.delete("token");
                return next;
              },
              { replace: true },
            );
          }}
        />
      )}
    </HeritageAuthLayout>
  );
}
