import { ErrorScreen } from "@/shared/ui/ErrorScreen";
import { ERROR_PAGE_CONTENT } from "@/shared/constants/errorPages";

/** Màn hình lỗi forbidden theo nhận diện Heritage. */
export function ForbiddenPage() {
  return <ErrorScreen {...ERROR_PAGE_CONTENT.forbidden} login />;
}
