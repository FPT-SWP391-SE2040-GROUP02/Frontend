import { ChevronDown } from "lucide-react";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";

/**
 * Hướng dẫn người nhận đi hết quy trình nhận tài sản, từ lúc có lời mời tới lúc tải xong. Các mốc thời gian đọc từ
 * tham số Admin đã đặt (không gõ cứng số ngày). Chỉ giải thích quy trình, không hiện dữ liệu của lượt cụ thể nào.
 */
export function RecipientGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const policy = usePolicyWindows();
  const steps = [
    {
      title: "Nhận lời mời",
      text: `Bấm “Nhận lời mời” sau khi đăng nhập. Hãy phản hồi trong ${policy.responseDays} ngày kể từ lúc được mời; quá hạn thì nhờ Người thực hiện gửi lại lời mời.`,
    },
    {
      title: "Xác minh danh tính",
      text: "Chuẩn bị căn cước công dân bản gốc và thiết bị có camera, chỗ đủ sáng. Bạn chụp mặt trước, mặt sau, làm theo hướng dẫn trên camera rồi hệ thống so khuôn mặt. Họ tên và số căn cước phải khớp thông tin Chủ kho đã khai; nếu lệch, Người thực hiện sẽ xem xét giúp bạn.",
    },
    {
      title: "Nhập khóa mở gói (nếu được yêu cầu)",
      text: "Một số gói cần khóa mở gói. Khóa do Người thực hiện của kho đưa cho bạn, hãy liên hệ trực tiếp để lấy. Nhập sai nhiều lần thì lượt bị khóa và cần Người thực hiện hoặc quản trị viên mở lại.",
    },
    {
      title: "Đồng ý hoặc từ chối",
      text: `Sau khi xác minh xong bạn có ${policy.decisionDays} ngày để quyết định. Từ chối thì phần này không được bàn giao cho bạn; quá hạn mà chưa quyết định thì lượt hết hiệu lực.`,
    },
    {
      title: "Xem và tải nội dung",
      text: `Đồng ý rồi, bạn xem và tải từng tài sản trong ${policy.grantDays} ngày. Hãy tải về sớm vì sau thời hạn lưu, nội dung được xóa khỏi hệ thống.`,
    },
  ];
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-heritage-border bg-white p-5 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left font-semibold text-heritage-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold">
        Cách nhận tài sản: 5 bước
        <ChevronDown
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]"
            >
              {index + 1}
            </span>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm leading-6 text-heritage-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
