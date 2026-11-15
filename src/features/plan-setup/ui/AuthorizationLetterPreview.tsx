import { ChevronDown } from "lucide-react";

interface AuthorizationLetterPreviewProps {
  /** Tên Chủ kho (Bên ủy quyền); lời mời qua link email chưa biết tên thì để trống. */
  ownerName?: string;
  /** Email Bên nhận ủy quyền (tài khoản đang được mời). */
  executorEmail?: string;
  /** Phạm vi do Backend trả cho phiên bản hiện hành. */
  scopeText: string;
}

/** Ủy quyền một phần: chỉ việc giấy tờ. Mã mở gói nằm ở tờ đính kèm riêng, không thuộc nội dung ủy quyền. */
const TASKS = [
  "Báo tin cho hệ thống khi Chủ kho qua đời.",
  "Nộp giấy chứng tử và các giấy tờ liên quan để hệ thống mở hồ sơ.",
];

function Party({ heading, name }: { heading: string; name: string }) {
  return (
    <p className="mt-2 break-words text-sm leading-6">
      <strong>{heading}:</strong> {name}
    </p>
  );
}

/**
 * Bản xem trước Giấy ủy quyền quản lý tài sản mà Người thực thi ký bằng nút "Ký giấy ủy quyền".
 * Không có mã mở gói: mã chỉ tạo sau khi Chủ kho kích hoạt kế hoạch, và kế hoạch chỉ kích hoạt được khi giấy đã ký.
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
        Xem giấy ủy quyền quản lý tài sản
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div aria-label="Giấy ủy quyền quản lý tài sản" role="group" className="mt-3 text-[#111]">
        <p className="text-center text-xs font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="text-center text-xs">Độc lập – Tự do – Hạnh phúc</p>
        <h4 className="mt-3 text-center text-base font-bold">GIẤY ỦY QUYỀN QUẢN LÝ TÀI SẢN</h4>
        <Party heading="Bên ủy quyền" name={owner} />
        <Party heading="Bên nhận ủy quyền" name={executor} />
        <p className="mt-3 text-sm font-semibold">Nội dung ủy quyền</p>
        <ul className="mt-1 list-disc space-y-1 pl-6 text-sm leading-6">
          {TASKS.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-5 text-heritage-muted">{scopeText}</p>
        <p className="mt-2 text-sm leading-6">
          <strong>Thời hạn:</strong> có hiệu lực kể từ ngày ký đến khi Bên nhận ủy quyền thực hiện
          xong nội dung ủy quyền.
        </p>
      </div>
    </details>
  );
}
