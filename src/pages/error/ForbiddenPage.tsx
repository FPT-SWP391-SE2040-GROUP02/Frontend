import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ErrorScreen } from "@/shared/ui/ErrorScreen";
import { ERROR_PAGE_CONTENT } from "@/shared/constants/errorPages";

/** Màn hình lỗi forbidden theo nhận diện Heritage. */
export function ForbiddenPage() {
  const homeHref = useAccountHome();
  return <ErrorScreen homeHref={homeHref} {...ERROR_PAGE_CONTENT.forbidden} login />;
}
