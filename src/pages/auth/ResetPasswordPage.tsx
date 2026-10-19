import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { ResetPasswordForm } from "@/features/auth/ui/ResetPasswordForm";
import { RESET_PASSWORD_CONTENT as content } from "@/features/auth/model/resetPassword.schema";
import { passwordResetTokenSchema } from "@/features/auth/model/resetPassword.schema";
import { ROUTES } from "@/shared/config/routes.config";

/** Link thiếu/trùng token không gửi API; chỉ BE xác nhận token còn hiệu lực. */
export function ResetPasswordPage() {
  const [params, setParams] = useSearchParams();
  const tokens = params.getAll("token");
  const token = tokens.length === 0 ? null : tokens.length === 1 ? tokens[0] : "";
  const [previousToken, setPreviousToken] = useState(token);
  const [completed, setCompleted] = useState(false);
  if (token !== previousToken) {
    setPreviousToken(token);
    if (token !== null) setCompleted(false);
  }
  const valid = passwordResetTokenSchema.safeParse(token).success;
  return (
    <HeritageAuthLayout sideTitle={content.sideTitle} sideSubtitle={content.sideDescription}>
      <header className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="text-sm leading-7 text-heritage-muted">{content.description}</p>
      </header>
      {completed && token === null ? (
        <section role="status" className="space-y-5">
          <h2 className="text-xl font-semibold">{content.completed}</h2>
          <p>{content.completedDetail}</p>
          <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center underline">
            {content.login}
          </Link>
        </section>
      ) : !valid || token === null ? (
        <section className="space-y-5">
          <CircleAlert aria-hidden="true" className="size-12 text-heritage-gold" />
          <h2 className="text-xl font-semibold">{content.invalid}</h2>
          <p className="text-sm leading-7 text-heritage-muted">{content.invalidDetail}</p>
          <Link
            className="flex min-h-11 items-center justify-center rounded-xl bg-heritage-primary px-5 text-sm text-white"
            to={ROUTES.AUTH.FORGOT_PASSWORD}
          >
            {content.request}
          </Link>
          <Link
            className="flex min-h-11 items-center justify-center text-sm underline underline-offset-4"
            to={ROUTES.AUTH.LOGIN}
          >
            {content.login}
          </Link>
        </section>
      ) : (
        <ResetPasswordForm
          key={token}
          token={token}
          onCompleted={() => {
            setCompleted(true);
            setParams(
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
