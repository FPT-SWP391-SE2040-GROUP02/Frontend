import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";
import { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";
/** Trạng thái xác minh thật, không dựng camera/kết quả thành công mẫu. */
export function CameraCheckPage() {
  return (
    <RecipientLayout active="verify">
      <EkycStatusPanel />
    </RecipientLayout>
  );
}
