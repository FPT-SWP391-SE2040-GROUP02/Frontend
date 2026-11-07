import { useQueryClient } from "@tanstack/react-query";
import { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Xác minh danh tính của Người thực hiện: dùng lại đúng luồng eKYC ở tab Xác minh của Chủ kho. */
export function ExecutorIdentityPage() {
  const client = useQueryClient();
  return (
    <ExecutorWorkspace
      title="Xác minh danh tính"
      description="Xác minh giấy tờ và khuôn mặt của bạn. Kết quả được giữ lại, không phải làm lại."
    >
      <EkycStatusPanel
        purpose="OWNER_ENROLLMENT"
        turnId={null}
        onVerified={() => {
          void client.invalidateQueries({ queryKey: ["plan-setup"] });
          void client.invalidateQueries({ queryKey: ["owner-vault"] });
        }}
      />
    </ExecutorWorkspace>
  );
}
