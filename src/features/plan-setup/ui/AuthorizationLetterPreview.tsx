import { ChevronDown } from "lucide-react";
import { WillDocument } from "@/entities/will/ui/WillDocument";

interface AuthorizationLetterPreviewProps {
  /** Tên Chủ kho (người lập di chúc); lời mời qua link email chưa biết tên thì để trống. */
  ownerName?: string;
  /** Email Người thực thi (tài khoản đang được mời). */
  executorEmail?: string;
  /** Phạm vi do Backend trả cho phiên bản hiện hành. */
  scopeText: string;
  /** Mở sẵn khi người đọc phải xem trước khi quyết định (Chủ kho trước khi kích hoạt). */
  defaultOpen?: boolean;
  /** Điều khoản Chủ kho thêm vào di chúc. */
  clauses?: string[];
}

/**
 * Bản xem trước Di chúc, cùng nội dung với bản in (WillDocument). Người thực thi ký nhận vai bằng nút
 * "Ký nhận vai thực hiện di chúc"; Chủ kho ký bằng cách kích hoạt kế hoạch. Không có mã mở gói: mã chỉ tạo
 * sau khi Chủ kho kích hoạt kế hoạch, và kế hoạch chỉ kích hoạt được khi Người thực thi đã ký.
 */
export function AuthorizationLetterPreview({
  ownerName,
  executorEmail,
  scopeText,
  defaultOpen = false,
  clauses = [],
}: AuthorizationLetterPreviewProps) {
  let owner = "Chủ kho";
  if (ownerName) {
    owner = ownerName;
  }
  let executor = "Bạn (tài khoản đang đăng nhập)";
  if (executorEmail) {
    executor = executorEmail;
  }
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-heritage-border bg-white p-4"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-heritage-primary">
        Xem di chúc
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div aria-label="Di chúc" role="group" className="mt-3">
        <WillDocument ownerName={owner} executorEmail={executor} clauses={clauses} />
        <p className="mt-3 text-sm leading-5 text-heritage-muted">{scopeText}</p>
      </div>
    </details>
  );
}
