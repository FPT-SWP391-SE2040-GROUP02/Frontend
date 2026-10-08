import { ErrorScreen } from "@/shared/ui/ErrorScreen";
import { ERROR_PAGE_CONTENT } from "@/shared/constants/errorPages";

/** Màn hình lỗi notFound theo nhận diện Heritage. */
export function NotFoundPage() {
  return <ErrorScreen {...ERROR_PAGE_CONTENT.notFound} />;
}
