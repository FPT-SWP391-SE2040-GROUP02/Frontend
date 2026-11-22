import { Notice } from "@/shared/ui/heritageKit";
import { useNotaryCardStatus } from "../model/useNotaryCard";

/** Dải nhắc ở các trang Người xét duyệt khi tài khoản chưa có ảnh thẻ; đã có thẻ hoặc chưa tải xong thì không hiện gì. */
export function NotaryCardMissingNotice() {
  const status = useNotaryCardStatus();
  if (!status.data || status.data.hasCard) return null;
  return (
    <Notice tone="warning" role="status" title="Tài khoản của bạn chưa có ảnh thẻ luật sư">
      Ảnh thẻ giúp Người thực thi và người nhận biết biên bản do luật sư lập. Hãy liên hệ quản trị
      viên để nộp thẻ.
    </Notice>
  );
}
