import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { isHandoverNotStarted, systemExecutorsService } from "@/entities/executor";
import { deathCaseService } from "../api/deathCaseService";

/**
 * Gửi mã nhận cho một người nhận bằng một lần bấm. Mã Chủ tài sản đã cấp được lấy rồi gửi thẳng cho Backend, không hiện
 * ra màn hình và không nằm trong state; Backend kiểm mã rồi mới gửi email. Không optimistic: `sentAt` chỉ có sau
 * response của Backend. Bàn giao chưa bắt đầu thì `notStarted` bật để giao diện hiện câu chờ thay vì khung lỗi.
 */
export function useSendHandoverKey({
  recordId,
  turnId,
  vaultId,
}: {
  recordId: string;
  turnId: string;
  vaultId: string;
}) {
  const action = usePrivateAction();
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [notStarted, setNotStarted] = useState(false);

  function send(): void {
    setNotStarted(false);
    void action.execute(
      async () => {
        const received = await systemExecutorsService.getHandoverKey(vaultId);
        return deathCaseService.sendKey(recordId, turnId, received.shard);
      },
      (result) => setSentAt(result.sentAt),
      (error) => setNotStarted(isHandoverNotStarted(error)),
    );
  }

  return {
    send,
    pending: action.pending,
    error: action.error,
    sentAt,
    notStarted,
  };
}
