import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, formatDateTime, Notice } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import { handoverRequestKeys, useOwnerRequest } from "../model/useHandoverRequest";

/**
 * Chủ kho thấy khi có người nhận gửi yêu cầu nhận tài sản: kho đang khóa, luật sư đang xét. Chủ kho còn sống thì hủy
 * được tới khi biên bản đủ chữ ký; hủy xong kho mở khóa.
 */
export function OwnerRequestNotice({ vaultId }: { vaultId: string }) {
  const client = useQueryClient();
  const query = useOwnerRequest(vaultId);
  const action = usePrivateAction();
  const [confirming, setConfirming] = useState(false);
  if (!query.isSuccess || !query.data) return null;
  const request = query.data;
  const names = request.requesterNames.join(", ") || "Người nhận";
  return (
    <Notice tone="warning" title="Có yêu cầu nhận tài sản" role="status">
      <div className="space-y-3">
        <p>
          {names} đã gửi yêu cầu nhận tài sản lúc {formatDateTime(request.requestedAt)}. Kho đang
          khóa trong lúc luật sư xét giấy tờ và lập biên bản.
        </p>
        {request.canCancel && !confirming && (
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => setConfirming(true)}
          >
            Hủy yêu cầu
          </button>
        )}
        {request.canCancel && confirming && (
          <div className="space-y-2">
            <p className="font-semibold">
              Hủy yêu cầu thì biên bản đang lập bị bỏ và kho mở khóa. Bạn chắc chắn?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonStyles.dark}
                disabled={action.pending}
                onClick={() =>
                  void action.execute(
                    () => handoverRequestService.cancel(vaultId),
                    () => {
                      setConfirming(false);
                      void client.invalidateQueries({
                        queryKey: handoverRequestKeys.owner(vaultId),
                      });
                      void client.invalidateQueries();
                    },
                  )
                }
              >
                {action.pending ? "Đang hủy…" : "Đồng ý hủy"}
              </button>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={action.pending}
                onClick={() => setConfirming(false)}
              >
                Giữ yêu cầu
              </button>
            </div>
          </div>
        )}
        {action.error && (
          <p role="alert" className="text-destructive">
            {action.error}
          </p>
        )}
      </div>
    </Notice>
  );
}
