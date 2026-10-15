import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ErrorScreen } from "@/shared/ui/ErrorScreen";
import { ERROR_PAGE_CONTENT } from "@/shared/constants/errorPages";

/** Màn hình lỗi notFound theo nhận diện Heritage. */
export function NotFoundPage() {
  const homeHref = useAccountHome();
  return <ErrorScreen homeHref={homeHref} {...ERROR_PAGE_CONTENT.notFound} />;
}
