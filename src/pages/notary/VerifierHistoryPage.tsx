import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Lịch sử: các biên bản mà mọi người nhận đã ký (cùng luật sư và Người thực thi). */
export function VerifierHistoryPage() {
  return (
    <VerifierShell
      title="Đã hoàn tất"
      description="Các biên bản mà luật sư, Người thực thi và mọi người nhận đã ký. Mỗi người nhận được mở phần của mình khi có đủ chữ ký của luật sư, Người thực thi và của chính người đó."
    >
      <VerifierQueue scope="closed" />
    </VerifierShell>
  );
}
