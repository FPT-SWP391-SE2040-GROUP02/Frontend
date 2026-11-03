import { useEffect, useState, type ReactNode } from "react";
import type { z } from "zod";
import { CalendarCheck, CircleCheck } from "lucide-react";
import { formatDate } from "@/shared/lib/dateFormat";
import { Button } from "@/shared/ui/button";
import { Chip, Notice, type Tone } from "@/shared/ui/heritageKit";
import { dailyCheckInState } from "@/features/dms/model/dailyCheckIn";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { CheckInNowButton } from "@/features/dms/ui/CheckInNowButton";
import { CheckInSettingsForm } from "@/features/dms/ui/CheckInSettingsForm";
import type { checkInPeriodSchema, checkInStatusSchema } from "@/features/dms/model/checkIn.schema";

type CheckInStatus = z.infer<typeof checkInStatusSchema>;
type Period = z.infer<typeof checkInPeriodSchema>;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";

function formatDateTime(value: string): string {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
  return `${formatDate(value)} ${time}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Giờ hiện tại theo đồng hồ máy chủ (lệch so với máy người dùng được bù), cập nhật mỗi 30 giây. */
function useServerNow(serverTime: string): number {
  const [serverMs] = useState(() => new Date(serverTime).getTime());
  const [clientStart] = useState(() => Date.now());
  const [now, setNow] = useState(serverMs);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(serverMs + (Date.now() - clientStart));
    }, 30 * 1000);
    return () => window.clearInterval(timer);
  }, [serverMs, clientStart]);
  return now;
}

function CountdownTile({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex min-w-24 flex-col items-center rounded-2xl border border-heritage-border bg-heritage-primary-light px-5 py-4">
      <span className="font-serif text-4xl tabular-nums text-heritage-primary">{pad(value)}</span>
      <span className="mt-0.5 text-xs text-heritage-muted">{unit}</span>
    </div>
  );
}

function periodChip(period: Period): { label: string; tone: Tone } {
  if (period.checkedInAt !== null) {
    return { label: "Đã ghi", tone: "success" };
  }
  // Kỳ đóng mà không có điểm danh: lịch bị dừng vì kế hoạch về Nháp hoặc không còn chạy.
  if (period.closedAt) {
    return { label: "Đã dừng", tone: "neutral" };
  }
  if (period.awaitingCheckAt !== null) {
    return { label: "Chờ kiểm tra", tone: "danger" };
  }
  if (period.overdueAt !== null) {
    return { label: "Quá hạn", tone: "warning" };
  }
  return { label: "Đang chạy", tone: "neutral" };
}

function Countdown({ status }: { status: CheckInStatus }) {
  const now = useServerNow(status.serverTime);
  if (status.nextCheckInDueAt === null) {
    return (
      <p className="mt-4 text-sm text-heritage-muted">
        Chưa bắt đầu kỳ điểm danh. Kỳ đầu tiên bắt đầu khi bạn kích hoạt kế hoạch.
      </p>
    );
  }
  const remaining = new Date(status.nextCheckInDueAt).getTime() - now;
  if (remaining < 0) {
    return (
      <p role="status" className="mt-4 font-semibold text-heritage-danger">
        Đã quá hạn điểm danh. Hãy điểm danh ngay để dừng việc bàn giao.
      </p>
    );
  }
  const days = Math.floor(remaining / MS_PER_DAY);
  const hours = Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE);
  return (
    <div className="mt-5">
      <p className="text-xs font-medium text-heritage-muted">Còn lại</p>
      <div className="mt-2 flex flex-wrap gap-3" role="timer" aria-label="Thời gian còn lại">
        <CountdownTile value={days} unit="ngày" />
        <CountdownTile value={hours} unit="giờ" />
        <CountdownTile value={minutes} unit="phút" />
      </div>
    </div>
  );
}

function History({ periods }: { periods: Period[] }) {
  const ordered = [...periods].sort((a, b) => b.sequence - a.sequence);
  const rows: ReactNode[] = [];
  for (const period of ordered) {
    const chip = periodChip(period);
    let when = `Bắt đầu ${formatDateTime(period.startedAt)}`;
    let detail = `Kỳ ${period.sequence} · hạn ${formatDate(period.dueAt)}`;
    if (period.checkedInAt !== null) {
      when = `Điểm danh ${formatDateTime(period.checkedInAt)}`;
    } else if (period.closedAt) {
      detail = `Kỳ ${period.sequence} · dừng lúc ${formatDateTime(period.closedAt)} vì kế hoạch về Nháp`;
    }
    rows.push(
      <li
        key={period.sequence}
        className="flex items-center justify-between gap-3 border-b border-heritage-border py-4 last:border-b-0"
      >
        <div>
          <p className="font-semibold">{when}</p>
          <p className="text-xs text-heritage-muted">{detail}</p>
        </div>
        <Chip tone={chip.tone}>{chip.label}</Chip>
      </li>,
    );
  }
  return (
    <section aria-label="Lịch sử điểm danh" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Lịch sử điểm danh</h2>
      {rows.length === 0 && (
        <p className="mt-4 text-sm text-heritage-muted">Chưa có lần điểm danh nào.</p>
      )}
      <ul className="mt-2">{rows}</ul>
    </section>
  );
}

/**
 * Màn "Điểm danh định kỳ" theo thiết kế: đếm ngược tới hạn, nút điểm danh, cách điểm danh (kèm ghép đồng hồ),
 * lịch (chu kỳ/ân hạn) và lịch sử các kỳ.
 * Thời gian và quyền điểm danh do máy chủ quyết định; không có cài đặt nhắc email/SMS vì Backend chưa hỗ trợ.
 */
export function OwnerCheckIn({ vaultId }: { vaultId: string }) {
  const query = useCheckIn(vaultId);
  if (query.isPending) {
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải trạng thái điểm danh…
      </p>
    );
  }
  if (query.isError) {
    return (
      <Notice
        tone="danger"
        role="alert"
        title="Không tải được dữ liệu"
        action={
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="min-h-11"
          >
            Thử lại
          </Button>
        }
      >
        Vui lòng thử lại.
      </Notice>
    );
  }
  const status = query.data;
  const daily = dailyCheckInState(status);
  // Đã điểm danh hôm nay: khung xanh nhạt, nút khóa đọc như "xong rồi"; chưa điểm danh được vì lý do khác thì giữ nền trung tính.
  let actionPanelClass = "rounded-xl border border-heritage-border bg-heritage-canvas p-5";
  let actionButtonClass =
    "w-full disabled:bg-heritage-neutral-bg disabled:text-heritage-muted disabled:opacity-100";
  let ActionIcon = CalendarCheck;
  if (daily.checkedInToday || daily.executorCheckedInToday) {
    actionPanelClass = "rounded-xl border border-heritage-success/30 bg-heritage-success-bg p-5";
    actionButtonClass =
      "w-full disabled:bg-heritage-surface disabled:text-heritage-success disabled:opacity-100";
    ActionIcon = CircleCheck;
  }
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6">
        <section aria-label="Hạn tiếp theo" className={CARD}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center lg:gap-10">
            <div>
              <h2 className="text-2xl font-medium text-heritage-primary">
                Hạn tiếp theo: {formatDate(status.nextCheckInDueAt)}
              </h2>
              <Countdown status={status} />
              <div className="mt-5 space-y-2 border-t border-heritage-border pt-4 text-sm">
                <p className="text-heritage-muted">
                  Lần gần nhất: {formatDate(status.lastCheckInAt)}.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="neutral">Nhắc qua email</Chip>
                  <span>Gửi trước hạn 7 ngày và 1 ngày</span>
                </div>
              </div>
            </div>
            <div className={actionPanelClass}>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-heritage-primary">
                <ActionIcon className="size-5" aria-hidden="true" />
                Điểm danh hôm nay
              </div>
              <CheckInNowButton
                vaultId={vaultId}
                status={status}
                label="Điểm danh bây giờ"
                variant="dark"
                className={actionButtonClass}
              />
            </div>
          </div>
        </section>
      </div>
      <section aria-label="Lịch điểm danh" className={CARD}>
        <h2 className="mb-4 text-xl font-medium text-heritage-primary">Lịch điểm danh</h2>
        <CheckInSettingsForm key={status.settings.etag} vaultId={vaultId} status={status} />
      </section>
      <History periods={status.history.items} />
    </div>
  );
}
