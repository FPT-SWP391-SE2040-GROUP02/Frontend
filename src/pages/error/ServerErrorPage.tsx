import { ErrorScreen } from "@/shared/ui/ErrorScreen";
import { ERROR_PAGE_CONTENT } from "@/shared/constants/errorPages";

/** Màn hình lỗi server theo nhận diện Heritage. */
export function ServerErrorPage() {
  return <ErrorScreen {...ERROR_PAGE_CONTENT.server} retry />;
}
