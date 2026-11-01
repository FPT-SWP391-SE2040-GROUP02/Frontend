import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import type { ExecutorVault } from "../model/deathCase.schema";
import { buttonStyles, Chip, InfoRow, Initial, Notice, Panel } from "@/shared/ui/heritageKit";
import { useRejectedAck } from "../model/useRejectedAck";
import { planStatusLabel } from "./executorLabels";
import { ProxyCheckIn } from "./ProxyCheckIn";

const duties = [
  { title: "Báo tin", text: "Cho hệ thống biết đã đến lúc bàn giao." },
  {
    title: "Chờ phản đối và xét duyệt",
    text: "Chủ kho có 72 giờ để phản đối, rồi Người xét duyệt kiểm tra hồ sơ.",
  },
  { title: "Theo dõi", text: "Xem tiến trình đến khi người nhận tải xong." },
];

const limits = ["Đọc nội dung kho", "Tự duyệt hồ sơ", "Tự chọn người nhận"];

/** Tổng quan một kho Executor đang phụ trách (thiết kế "Người thực hiện — Tổng quan"). */
export function ExecutorOverview({ vault }: { vault: ExecutorVault }) {
  const hasCase = Boolean(vault.openDeathCaseId);
  const rejectedAck = useRejectedAck(vault.lastRejectedDeathCaseId);
  // Báo "bị từ chối" đi TRƯỚC mọi banner khác (kể cả "quá hạn điểm danh", vì từ chối trả kế hoạch về trạng thái
  // trước đó nên kho có thể quá hạn ngay); bấm "Tiếp tục" thì mới tới banner theo trạng thái kế hoạch.
  const showRejected =
    !hasCase && Boolean(vault.lastRejectedDeathCaseId) && !rejectedAck.acknowledged;
  return (
    <div className="space-y-6">
      {showRejected && (
        <Notice
          tone="danger"
          title={`Hồ sơ báo tin về ${vault.ownerFullName} đã bị từ chối`}
          action={
            <div className="flex flex-wrap gap-3">
              <Link className={buttonStyles.outline} to={ROUTES.EXECUTOR.REPORT}>
                Xem lý do
              </Link>
              <button type="button" className={buttonStyles.gold} onClick={rejectedAck.acknowledge}>
                Tiếp tục
              </button>
            </div>
          }
        >
          Hồ sơ của bạn không được Người xét duyệt chấp thuận. Hồ sơ đã được xử lý và đóng; bạn chỉ
          nên báo tin lại khi chắc chắn và có giấy tờ phù hợp.
        </Notice>
      )}
      {!showRejected && vault.checkInOverdue && (
        <Notice
          tone="warning"
          title={`${vault.ownerFullName} đã quá hạn điểm danh`}
          action={
            <Link className={buttonStyles.gold} to={ROUTES.EXECUTOR.REPORT}>
              {hasCase ? "Xem hồ sơ báo tin" : "Báo tin"}
            </Link>
          }
        >
          Hãy liên hệ để chắc chắn trước khi báo tin. Nếu Chủ kho còn khỏe, họ có thể dừng bằng “Tôi
          còn sống”.
          {!hasCase && (
            <div className="mt-3">
              <ProxyCheckIn vaultId={vault.vaultId} />
            </div>
          )}
        </Notice>
      )}
      {/* Đã có hồ sơ báo tin thì kế hoạch không còn "quá hạn" (đã khóa), nhưng cũng không phải "an toàn". */}
      {!vault.checkInOverdue && hasCase && (
        <Notice
          tone="warning"
          title={`Hồ sơ báo tin về ${vault.ownerFullName} đang được xử lý`}
          action={
            <Link className={buttonStyles.gold} to={ROUTES.EXECUTOR.REPORT}>
              Xem hồ sơ báo tin
            </Link>
          }
        >
          Theo dõi tiến trình xét duyệt và bổ sung hồ sơ khi Người xét duyệt yêu cầu.
        </Notice>
      )}
      {!vault.checkInOverdue && !hasCase && !showRejected && (
        <Notice
          tone="success"
          title={`Kho của ${vault.ownerFullName} đang an toàn`}
          action={
            <Link className={buttonStyles.gold} to={ROUTES.EXECUTOR.REPORT}>
              Báo tin
            </Link>
          }
        >
          Chỉ báo tin khi chắc chắn đã đến lúc.
        </Notice>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Bạn sẽ làm gì?">
          <ol className="divide-y divide-heritage-border">
            {duties.map((duty, index) => (
              <li key={duty.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{duty.title}</p>
                  <p className="mt-1 text-sm text-heritage-muted">{duty.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-6">
          <Panel title="Kho được giao cho bạn">
            <dl>
              <InfoRow label="Chủ kho">{vault.ownerFullName}</InfoRow>
              <InfoRow label="Vai trò">Executor</InfoRow>
              <InfoRow label="Kế hoạch">{planStatusLabel(vault.planStatus)}</InfoRow>
              <InfoRow label="Hồ sơ báo tin">{hasCase ? "Đang mở" : "Chưa có"}</InfoRow>
              <InfoRow label="Nội dung kho">Bạn không đọc được</InfoRow>
            </dl>
            <p className="mt-3 flex items-center gap-2 text-xs text-heritage-muted">
              <Lock className="size-3.5" aria-hidden="true" />
              Bạn chỉ báo tin, không xem được nội dung.
            </p>
          </Panel>
          <Panel title="Bạn không làm được">
            <ul className="divide-y divide-heritage-border">
              {limits.map((item) => (
                <li key={item} className="flex items-center justify-between py-3 text-sm">
                  <span>{item}</span>
                  <span className="text-heritage-muted">Không</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Màn "Chọn kho" khi một tài khoản là Executor của nhiều kho (thiết kế 78). */
export function VaultPicker({
  vaults,
  onSelect,
}: {
  vaults: ExecutorVault[];
  onSelect: (vaultId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {vaults.map((vault, index) => (
          <li
            key={vault.vaultId}
            className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <div className="flex items-center gap-3">
              <Initial name={vault.ownerFullName} />
              <div className="min-w-0">
                <h2 className="truncate font-semibold">Kho của {vault.ownerFullName}</h2>
                <p className="text-xs text-heritage-muted">Executor</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip tone={vault.checkInOverdue ? "warning" : "success"}>
                {vault.checkInOverdue ? "Quá hạn điểm danh" : planStatusLabel(vault.planStatus)}
              </Chip>
              {vault.openDeathCaseId && <Chip tone="neutral">Có hồ sơ đang mở</Chip>}
            </div>
            <button
              type="button"
              onClick={() => onSelect(vault.vaultId)}
              aria-label={`Vào kho của ${vault.ownerFullName}`}
              className={`${index === 0 ? buttonStyles.gold : buttonStyles.outline} w-full`}
            >
              Vào kho
            </button>
          </li>
        ))}
      </ul>
      <Panel title="Lưu ý">
        <p className="text-sm leading-6">
          Mỗi kho có hồ sơ và tiến trình riêng. Bạn không đọc được nội dung của bất kỳ kho nào.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs text-heritage-muted">
          <Lock className="size-3.5" aria-hidden="true" />
          Quyền Executor chỉ gồm báo tin và theo dõi tiến trình.
        </p>
      </Panel>
    </div>
  );
}
