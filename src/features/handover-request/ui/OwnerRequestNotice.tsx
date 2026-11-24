import { formatDateTime, Notice } from "@/shared/ui/heritageKit";
import { useOwnerRequest } from "../model/useHandoverRequest";

/**
 * Chủ kho thấy khi có người nhận gửi yêu cầu nhận tài sản. Chưa khóa kho (vaultLocked = false): luật sư đang xét,
 * Chủ kho vẫn sửa được kho. Luật sư chấp nhận giấy tờ thì kho khóa. Chỉ để xem; Chủ kho không hủy được vì yêu cầu
 * luôn kèm giấy chứng tử.
 */
export function OwnerRequestNotice({ vaultId }: { vaultId: string }) {
  const query = useOwnerRequest(vaultId);
  if (!query.isSuccess || !query.data) return null;
  const request = query.data;
  const names = request.requesterNames.join(", ") || "Người nhận";
  let stateText: string;
  if (request.vaultLocked) {
    stateText = "Kho đang khóa trong lúc luật sư xét giấy tờ và lập biên bản.";
  } else {
    stateText =
      "Có yêu cầu nhận tài sản đang được luật sư xét. Kho chưa khóa; bạn vẫn sửa được kho cho tới khi luật sư chấp nhận giấy tờ.";
  }
  return (
    <Notice tone="warning" title="Có yêu cầu nhận tài sản" role="status">
      <p>
        {names} đã gửi yêu cầu nhận tài sản lúc {formatDateTime(request.requestedAt)}. {stateText}
      </p>
    </Notice>
  );
}
