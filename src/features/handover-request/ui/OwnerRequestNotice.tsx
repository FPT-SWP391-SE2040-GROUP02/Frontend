import { formatDateTime, Notice } from "@/shared/ui/heritageKit";
import { useOwnerRequest } from "../model/useHandoverRequest";

/**
 * Chủ kho thấy khi có người nhận gửi yêu cầu nhận tài sản: kho đang khóa, luật sư đang xét. Chỉ để xem; Chủ kho không
 * hủy được vì yêu cầu luôn kèm giấy chứng tử.
 */
export function OwnerRequestNotice({ vaultId }: { vaultId: string }) {
  const query = useOwnerRequest(vaultId);
  if (!query.isSuccess || !query.data) return null;
  const request = query.data;
  const names = request.requesterNames.join(", ") || "Người nhận";
  return (
    <Notice tone="warning" title="Có yêu cầu nhận tài sản" role="status">
      <p>
        {names} đã gửi yêu cầu nhận tài sản lúc {formatDateTime(request.requestedAt)}. Kho đang khóa
        trong lúc luật sư xét giấy tờ và lập biên bản.
      </p>
    </Notice>
  );
}
