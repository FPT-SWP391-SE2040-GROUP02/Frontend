import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { CompletePhoneForm } from "@/features/auth/ui/CompletePhoneForm";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { useNavigate, useSearchParams } from "react-router-dom";

/** Chỉ nhận đường dẫn nội bộ để không bị chuyển sang trang ngoài qua tham số redirect. */
function safeRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * Bước bắt buộc sau khi đăng nhập bằng Google (hoặc tài khoản cũ) chưa có số điện thoại:
 * nhập số giống lúc đăng ký rồi mới vào trang chính.
 */
export function CompletePhonePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountHome = useAccountHome();
  const target = safeRedirect(params.get("redirect")) ?? accountHome;

  return (
    <HeritageAuthLayout
      sideTitle="Còn một bước nữa"
      sideSubtitle="Thêm số điện thoại để hoàn tất tài khoản trước khi vào trang chính."
    >
      <header className="mb-8 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Thêm số điện thoại
        </h1>
        <p className="text-sm leading-7 text-heritage-muted">
          Tài khoản của bạn chưa có số điện thoại. Vui lòng nhập số di động Việt Nam để tiếp tục.
        </p>
      </header>
      <CompletePhoneForm onDone={() => navigate(target, { replace: true })} />
    </HeritageAuthLayout>
  );
}
