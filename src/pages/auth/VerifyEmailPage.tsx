import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { VerifyEmailNotice } from "@/features/auth/ui/VerifyEmailNotice";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { VERIFY_EMAIL_CONTENT as content } from "@/features/auth/model/verifyEmail.schema";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Trang Xác minh Email (Mockup 6 - XacMinhEmail.dc.html).
 * Tự động xác thực token khi mở từ email và chuyển sang đăng nhập.
 *
 * @returns {React.JSX.Element} Trang xác minh email
 */
export function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const email = searchParams.get("email") ?? "";
  const tokens = searchParams.getAll("token");
  const token = tokens.length === 0 ? null : tokens.length === 1 ? tokens[0] : "";
  const [previousToken, setPreviousToken] = useState(token);

  if (token !== previousToken) {
    setPreviousToken(token);
    if (token !== null) setVerified(false);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleVerified = (confirmedEmail?: string) => {
    const finalEmail = confirmedEmail || email;
    setVerified(true);
    if (finalEmail) setVerifiedEmail(finalEmail);

    const loginParams = new URLSearchParams();
    loginParams.set("verified", "true");
    if (finalEmail) {
      loginParams.set("email", finalEmail);
    }
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      loginParams.set("redirect", redirectParam);
    }
    const invitationParam = searchParams.get("invitation");
    if (invitationParam) {
      loginParams.set("invitation", invitationParam);
    }

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("token");
        return next;
      },
      { replace: true },
    );

    timerRef.current = setTimeout(() => {
      navigate(`${ROUTES.AUTH.LOGIN}?${loginParams.toString()}`, { replace: true });
    }, 1500);
  };

  const finalLoginUrl = `${ROUTES.AUTH.LOGIN}?verified=true${
    verifiedEmail || email ? `&email=${encodeURIComponent(verifiedEmail || email)}` : ""
  }`;

  return (
    <HeritageAuthLayout
      sideTitle="Kho của bạn vẫn kín, dù bạn vắng mặt."
      sideSubtitle="Đăng nhập để điểm danh, xem các gói và người nhận. Không ai đọc được tài sản của bạn."
    >
      {verified && token === null ? (
        <section className="w-full space-y-5 text-left" aria-labelledby="verified-email-title">
          <h1 id="verified-email-title" className="font-serif text-2xl font-bold text-[#0B291E]">
            {content.title}
          </h1>
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
              <p role="status">{content.verified}</p>
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed">
              {content.verifiedDescription}
            </p>
            <p className="text-xs text-emerald-700 font-medium">
              Đang tự động chuyển sang trang đăng nhập...
            </p>
            <div className="pt-2">
              <Link
                to={finalLoginUrl}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0B291E] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#133E2B] focus-visible:outline-2 focus-visible:outline-[#B88E4C]"
              >
                {content.login}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <VerifyEmailNotice email={email} token={token} onVerified={handleVerified} />
      )}
    </HeritageAuthLayout>
  );
}
