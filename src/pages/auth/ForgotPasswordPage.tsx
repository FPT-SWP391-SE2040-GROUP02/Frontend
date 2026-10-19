import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { AUTH_LAYOUT_CONTENT } from "@/features/auth/model/authLayout.content";

/** Trang quên mật khẩu dùng chung nhận diện và bố cục với đăng nhập. */
export function ForgotPasswordPage() {
  const content = AUTH_LAYOUT_CONTENT.forgot;
  return (
    <HeritageAuthLayout sideTitle={content.sideTitle} sideSubtitle={content.sideDescription}>
      <header className="mb-8 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {content.title}
        </h1>
        <p className="text-sm leading-7 text-heritage-muted">{content.description}</p>
      </header>
      <ForgotPasswordForm />
    </HeritageAuthLayout>
  );
}
