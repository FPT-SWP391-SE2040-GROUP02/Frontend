import { ChevronDown } from "lucide-react";

interface AuthorizationLetterPreviewProps {
  /** Tên Chủ kho (người để lại di sản); lời mời qua link email chưa biết tên thì để trống. */
  ownerName?: string;
  /** Email Người thực thi (người quản lý di sản, tài khoản đang được mời). */
  executorEmail?: string;
  /** Phạm vi do Backend trả cho phiên bản hiện hành. */
  scopeText: string;
}

/** Nhiệm vụ chỉ là việc giấy tờ và giữ mã. Mã mở gói nằm ở tờ đính kèm riêng khi bàn giao. */
const TASKS = [
  "Báo tin cho hệ thống và nộp giấy chứng tử cùng các giấy tờ liên quan để mở hồ sơ.",
  "Giữ mã mở gói an toàn, chỉ trao cho người nhận sau khi hồ sơ được duyệt.",
];

function Party({ heading, name }: { heading: string; name: string }) {
  return (
    <p className="mt-2 break-words text-sm leading-6">
      <strong>{heading}:</strong> {name}
    </p>
  );
}

/**
 * Bản xem trước Di chúc mà Người thực thi ký nhận vai bằng nút "Ký nhận vai thực hiện di chúc".
 * Có hiệu lực từ khi Chủ kho qua đời. Không có mã mở gói: mã chỉ tạo sau khi Chủ kho kích hoạt kế hoạch,
 * và kế hoạch chỉ kích hoạt được khi văn bản đã ký.
 */
export function AuthorizationLetterPreview({
  ownerName,
  executorEmail,
  scopeText,
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
    <details className="group rounded-xl border border-heritage-border bg-white p-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-heritage-primary">
        Xem di chúc
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div aria-label="Di chúc" role="group" className="mt-3 text-[#111]">
        <p className="text-center text-xs font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="text-center text-xs">Độc lập – Tự do – Hạnh phúc</p>
        <h4 className="mt-3 text-center text-base font-bold">DI CHÚC</h4>
        <Party heading="Người lập di chúc" name={owner} />
        <Party heading="Người thực hiện di chúc" name={executor} />
        <p className="mt-3 text-sm leading-6">
          <strong>Hiệu lực:</strong> từ khi Chủ kho qua đời và hệ thống tiếp nhận hồ sơ. Trước đó di
          chúc chưa phát sinh quyền nào.
        </p>
        <p className="mt-3 text-sm font-semibold">Nhiệm vụ</p>
        <ul className="mt-1 list-disc space-y-1 pl-6 text-sm leading-6">
          {TASKS.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-5 text-heritage-muted">{scopeText}</p>
        <p className="mt-2 text-sm leading-6">
          <strong>Giới hạn:</strong> không xem nội dung kho, không tự quyết định hồ sơ, không nhận
          tài sản trừ khi được chỉ định là người nhận.
        </p>
        <p className="mt-2 text-sm leading-6">
          <strong>Chấm dứt:</strong> khi nhiệm vụ hoàn tất, khi Chủ kho thu hồi hoặc đổi người, hoặc
          khi bạn từ chối.
        </p>
      </div>
    </details>
  );
}
