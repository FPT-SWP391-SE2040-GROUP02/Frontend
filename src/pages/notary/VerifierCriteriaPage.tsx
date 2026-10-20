import { Check, Lock, X } from "lucide-react";
import { Panel } from "@/shared/ui/heritageKit";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

const approveWhen = [
  { title: "Giấy tờ rõ ràng", text: "Đúng tên Chủ kho, không bị che hay chỉnh sửa." },
  { title: "Người thực hiện đúng", text: "Họ tên trùng với người Chủ kho đã mời." },
  { title: "Ngày xảy ra hợp lý", text: "Không ở tương lai và khớp với giấy tờ." },
];

const rejectWhen = [
  "Giấy tờ mờ hoặc nghi giả",
  "Thông tin không khớp",
  "Chủ kho vẫn còn liên lạc được",
];

/** Tiêu chí xét duyệt (nội dung hướng dẫn tĩnh; quyết định cuối cùng do Verifier ra trên hồ sơ). */
export function VerifierCriteriaPage() {
  return (
    <VerifierShell
      title="Tiêu chí xét duyệt"
      description="Xem hồ sơ theo những tiêu chí này trước khi chấp thuận."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Chấp thuận khi">
          <ul className="divide-y divide-heritage-border">
            {approveWhen.map((item) => (
              <li key={item.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DDEFE6]">
                  <Check className="size-4 text-[#1F7A55]" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-heritage-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Từ chối khi">
          <ul className="space-y-3 text-sm">
            {rejectWhen.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <X className="mt-0.5 size-4 shrink-0 text-[#A32119]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-xs text-heritage-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Từ chối cần ghi rõ lý do. Người thực hiện sẽ được báo.
          </p>
        </Panel>
      </div>
    </VerifierShell>
  );
}
