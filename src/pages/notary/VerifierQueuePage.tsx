import { useSearchParams } from "react-router-dom";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Biên bản bàn giao: danh sách biên bản, hoặc ba bước của một biên bản khi có ?recordId=. */
export function VerifierQueuePage() {
  const [params] = useSearchParams();
  const hasRecord = Boolean(params.get("recordId"));
  return (
    <VerifierShell
      title="Biên bản bàn giao"
      description={
        hasRecord
          ? "Làm đúng thứ tự: lập biên bản, kiểm danh tính người nhận, rồi ba bên ký."
          : "Các kho Người thực thi đã mở bàn giao và được giao cho bạn lập biên bản."
      }
    >
      <VerifierQueue />
    </VerifierShell>
  );
}
