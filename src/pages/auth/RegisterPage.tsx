import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { AUTH_LAYOUT_CONTENT } from "@/features/auth/model/authLayout.content";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/** Trang đăng ký trong khung Auth dùng chung, giữ nguyên form và hợp đồng hiện tại. */
export function RegisterPage() {
  const content = AUTH_LAYOUT_CONTENT.register;
  return (
    <HeritageAuthLayout sideTitle={content.sideTitle} sideSubtitle={content.sideDescription}>
      <header className="mb-8 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {content.title}
        </h1>
        <p className="text-sm leading-7 text-heritage-muted">{content.description}</p>
      </header>
      <RegisterForm />
      <p className="mt-6 border-t border-heritage-border pt-5 text-sm text-heritage-muted">
        {content.existing}{" "}
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex min-h-11 items-center font-semibold text-heritage-primary underline underline-offset-4"
        >
          {content.login}
        </Link>
      </p>
    </HeritageAuthLayout>
  );
}
