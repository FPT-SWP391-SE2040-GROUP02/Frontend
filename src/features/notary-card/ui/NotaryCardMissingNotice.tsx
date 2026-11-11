import { Notice } from "@/shared/ui/heritageKit";
import { useNotaryCardStatus } from "../model/useNotaryCard";

/** Dải nhắc ở các trang Người xét duyệt khi tài khoản chưa có ảnh thẻ; đã có thẻ hoặc chưa tải xong thì không hiện gì. */
export function NotaryCardMissingNotice() {
  const status = useNotaryCardStatus();
  if (!status.data || status.data.hasCard) return null;
  return (
    <Notice tone="warning" role="status" title="Tài khoản của bạn chưa có ảnh thẻ công chứng viên">
      Chưa có ảnh thẻ thì bạn chưa duyệt được hồ sơ và chưa gửi được biên bản. Hãy liên hệ quản trị
      viên để nộp thẻ.
    </Notice>
  );
}
