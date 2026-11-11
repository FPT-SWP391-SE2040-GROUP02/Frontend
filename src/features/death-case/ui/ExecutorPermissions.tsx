import { Check, X } from "lucide-react";
import type { ExecutorVault } from "../model/deathCase.schema";
import { EXECUTOR_ALLOWED, EXECUTOR_DENIED } from "../model/executorPermissions";
import { Panel } from "@/shared/ui/heritageKit";

/** Quyền hạn của Người thực thi (thiết kế 55). Lời mời và kho đang giữ nằm ở trang "Lời mời và kho của tôi". */
export function ExecutorPermissions({ selected }: { selected: ExecutorVault | null }) {
  const owner = selected?.ownerFullName ?? "Chủ kho";
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Bạn được làm">
          <ul className="space-y-3 text-sm">
            {EXECUTOR_ALLOWED.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Bạn không được làm">
          <ul className="space-y-3 text-sm">
            {EXECUTOR_DENIED.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <X className="mt-0.5 size-4 shrink-0 text-[#A32119]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Rút khỏi vai trò">
        <p className="text-sm leading-6 text-heritage-muted">
          Nếu bạn không thể tiếp tục, hãy báo cho {owner} để họ chọn người khác. Chỉ Chủ kho mới thu
          hồi được vai trò này hoặc mời người thay.
        </p>
      </Panel>
    </div>
  );
}
