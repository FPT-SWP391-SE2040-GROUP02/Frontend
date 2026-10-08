import { Link, useSearchParams } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { ResetPasswordForm } from "@/features/auth/ui/ResetPasswordForm";
import { RESET_PASSWORD_CONTENT as content } from "@/features/auth/model/resetPassword.schema";
import { ROUTES } from "@/shared/config/routes.config";

/** Trang khôi phục UI, không xác thực token hoặc thay đổi thông tin đăng nhập. */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const state = params.get("state");
  const invalid = state === "invalid";
  const unavailable = invalid || state === "expired";
  return (
    <HeritageAuthLayout sideTitle={content.sideTitle} sideSubtitle={content.sideDescription}>
      <header className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="text-sm leading-7 text-heritage-muted">{content.description}</p>
        <p className="text-xs leading-6 text-heritage-muted">{content.preview}</p>
      </header>
      {import.meta.env.DEV && (
        <nav aria-label={content.demoNav} className="mb-6 flex flex-wrap gap-2">
          {content.variants.map((item) => (
            <Link
              key={item.id}
              to={`?state=${item.id}`}
              className="flex min-h-11 items-center rounded-xl border border-heritage-border px-3 text-xs"
              aria-current={(state ?? "form") === item.id ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {unavailable ? (
        <section className="space-y-5">
          <CircleAlert aria-hidden="true" className="size-12 text-heritage-gold" />
          <h2 className="text-xl font-semibold">{invalid ? content.invalid : content.expired}</h2>
          <p className="text-sm leading-7 text-heritage-muted">
            {invalid ? content.invalidDetail : content.expiredDetail}
          </p>
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
        <ResetPasswordForm key={state} />
      )}
    </HeritageAuthLayout>
  );
}
