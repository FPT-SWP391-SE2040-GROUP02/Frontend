import { Check, X } from "lucide-react";
import type { ExecutorVault } from "../model/deathCase.schema";
import { Chip, Panel } from "@/shared/ui/heritageKit";

const allowed = [
  "Báo tin khi Chủ kho qua đời",
  "Tải lên giấy tờ chứng minh",
  "Theo dõi tiến trình bàn giao",
  "Nhận thông báo cho từng bước",
];

const denied = ["Đọc nội dung kho", "Tự mở kho hoặc chọn người nhận", "Bỏ qua bước xét duyệt"];

/** Quyền hạn của Người thực hiện và các lời mời đã chấp nhận (thiết kế 55). */
export function ExecutorPermissions({
  vaults,
  selected,
}: {
  vaults: ExecutorVault[];
  selected: ExecutorVault | null;
}) {
  const owner = selected?.ownerFullName ?? "Chủ kho";
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Bạn được làm">
          <ul className="space-y-3 text-sm">
            {allowed.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Bạn không được làm">
          <ul className="space-y-3 text-sm">
            {denied.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <X className="mt-0.5 size-4 shrink-0 text-[#A32119]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Lời mời">
        {vaults.length === 0 ? (
          <p className="text-sm text-heritage-muted">
            Tài khoản chưa có nhiệm vụ Executor đang hiệu lực.
          </p>
        ) : (
          <ul className="divide-y divide-heritage-border">
            {vaults.map((vault) => (
              <li
                key={vault.vaultId}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <p className="font-semibold">
                  {vault.ownerFullName} mời bạn làm{" "}
                  {vault.role === "PRIMARY" ? "Executor chính" : "Executor dự phòng"}
                </p>
                <Chip tone="success">Đã chấp nhận</Chip>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Rút khỏi vai trò">
        <p className="text-sm leading-6 text-heritage-muted">
          Nếu bạn không thể tiếp tục, hãy báo cho {owner} để họ chọn người khác. Chỉ Chủ kho mới thu
          hồi được vai trò này hoặc mời người thay.
        </p>
      </Panel>
    </div>
  );
}
