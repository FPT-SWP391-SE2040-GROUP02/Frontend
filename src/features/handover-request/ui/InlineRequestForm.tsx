import { useQueryClient } from "@tanstack/react-query";
import { handoverRequestService } from "../api/handoverRequestService";
import { handoverRequestKeys } from "../model/useHandoverRequest";
import { RequestForm } from "./RequestForm";

/**
 * Form gửi yêu cầu nhận tài sản nằm ngay trong thẻ kho ở trang "Nhận tài sản": gửi bằng tài khoản đang đăng nhập,
 * không cần link riêng. Backend kiểm lại email đã xác minh và quyền người nhận của kho; xong thì làm mới danh sách
 * kho và danh sách yêu cầu của tôi.
 */
export function InlineRequestForm({ vaultId, onSent }: { vaultId: string; onSent: () => void }) {
  const client = useQueryClient();
  return (
    <RequestForm
      send={(note, documents) => handoverRequestService.submitByAccount(vaultId, note, documents)}
      onSent={() => {
        void client.invalidateQueries({ queryKey: handoverRequestKeys.mine });
        void client.invalidateQueries({ queryKey: handoverRequestKeys.available });
        onSent();
      }}
    />
  );
}
