import { useQueryClient } from "@tanstack/react-query";
import { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";

/** Bước 2: luồng xác minh danh tính của Chủ kho (giống /dashboard/identity). */
export function IdentityStep() {
  const client = useQueryClient();
  return (
    <EkycStatusPanel
      purpose="OWNER_ENROLLMENT"
      turnId={null}
      onVerified={() => {
        void client.invalidateQueries({ queryKey: ["plan-setup"] });
        void client.invalidateQueries({ queryKey: ["owner-vault"] });
      }}
    />
  );
}
