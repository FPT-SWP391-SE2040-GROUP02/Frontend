import { Check, ChevronDown } from "lucide-react";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";
import { RECEIVE_STEP_TITLES, receiveStepTexts } from "../model/receiveSteps";

/**
 * Hướng dẫn người nhận đi hết quy trình, từ gửi yêu cầu tới tải tài sản. current là bước đang làm (1–6), 7 khi đã xong
 * hết, null khi chưa gắn với bước nào. Chỉ giải thích quy trình, không hiện dữ liệu của hồ sơ cụ thể.
 */
export function ReceiveGuide({
  current = null,
  defaultOpen = false,
}: {
  current?: number | null;
  defaultOpen?: boolean;
}) {
  const policy = usePolicyWindows();
  const texts = receiveStepTexts(policy.grantDays);
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-heritage-border bg-white p-5 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left font-semibold text-heritage-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold">
        Cách nhận tài sản: 6 bước
        <ChevronDown
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-3 text-sm leading-6 text-heritage-muted">
        LegacyVault không tự biết khi nào Chủ kho qua đời, nên bạn cần chủ động gửi yêu cầu. Gửi
        xong, hệ thống đưa bạn đi tiếp từng bước.
      </p>
      <ol className="mt-4 space-y-3" aria-label="Các bước nhận tài sản">
        {RECEIVE_STEP_TITLES.map((title, index) => {
          const number = index + 1;
          const done = current !== null && number < current;
          const here = current === number;
          let circle = "bg-heritage-gold-soft text-heritage-primary";
          if (done) circle = "bg-heritage-success text-white";
          if (here) circle = "bg-heritage-primary text-white";
          let row = "border-transparent";
          if (here) row = "border-heritage-success-border bg-heritage-sunken";
          return (
            <li
              key={title}
              aria-current={here ? "step" : undefined}
              className={`flex gap-3 rounded-xl border p-3 ${row}`}
            >
              <span
                aria-hidden="true"
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${circle}`}
              >
                {done ? <Check className="size-4" /> : number}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {title}
                  {done && <span className="ml-2 text-sm text-heritage-success">Đã xong</span>}
                  {here && (
                    <span className="ml-2 text-sm text-heritage-success">Bạn đang ở đây</span>
                  )}
                </p>
                <p className="text-sm leading-6 text-heritage-muted">{texts[index]}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm leading-6 text-heritage-muted">
        Chưa được khai làm người nhận? Dùng mục Báo tin Chủ kho đã mất ở trang Nhận tài sản. Khi
        luật sư ghi bạn vào biên bản, bạn đi tiếp từ bước 3.
      </p>
    </details>
  );
}
