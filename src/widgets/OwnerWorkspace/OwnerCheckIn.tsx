import { useEffect, useState, type ReactNode } from "react";
import type { z } from "zod";
import { formatDate } from "@/shared/lib/dateFormat";
import { Button } from "@/shared/ui/button";
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
    <div className="flex min-w-20 flex-col items-center rounded-xl bg-[#1d4d3c] px-4 py-3 text-white">
      <span className="font-serif text-3xl text-[#E0C486]">{pad(value)}</span>
      <span className="text-xs text-white/75">{unit}</span>
    </div>
  );
}

function periodChip(period: Period): { label: string; style: string } {
  if (period.checkedInAt !== null) {
    return { label: "Đã ghi", style: "bg-green-100 text-green-800" };
  }
  if (period.awaitingCheckAt !== null) {
    return { label: "Chờ kiểm tra", style: "bg-red-100 text-red-800" };
  }
  if (period.overdueAt !== null) {
    return { label: "Quá hạn", style: "bg-amber-100 text-amber-800" };
  }
  return { label: "Đang chạy", style: "bg-heritage-primary/10 text-heritage-primary" };
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
      <p role="status" className="mt-4 font-semibold text-red-700">
        Đã quá hạn điểm danh. Hãy điểm danh ngay để dừng việc bàn giao.
      </p>
    );
  }
  const days = Math.floor(remaining / MS_PER_DAY);
  const hours = Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE);
  return (
    <div className="mt-4 flex flex-wrap gap-3" role="timer" aria-label="Thời gian còn lại">
      <CountdownTile value={days} unit="ngày" />
      <CountdownTile value={hours} unit="giờ" />
      <CountdownTile value={minutes} unit="phút" />
    </div>
  );
}

function History({ periods }: { periods: Period[] }) {
  const ordered = [...periods].sort((a, b) => b.sequence - a.sequence);
  const rows: ReactNode[] = [];
  for (const period of ordered) {
    const chip = periodChip(period);
    let when = formatDateTime(period.startedAt);
    if (period.checkedInAt !== null) {
      when = formatDateTime(period.checkedInAt);
    }
    rows.push(
      <li
        key={period.sequence}
        className="flex items-center justify-between gap-3 border-b border-heritage-border py-4 last:border-b-0"
      >
        <div>
          <p className="font-semibold">{when}</p>
          <p className="text-xs text-heritage-muted">
            Kỳ {period.sequence} · hạn {formatDate(period.dueAt)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${chip.style}`}>
          {chip.label}
        </span>
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
 * Màn "Điểm danh định kỳ" theo thiết kế: đếm ngược tới hạn, nút điểm danh, lịch (chu kỳ/ân hạn) và lịch sử các kỳ.
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
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">Không tải được dữ liệu. Vui lòng thử lại.</p>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          className="mt-4 min-h-11"
        >
          Thử lại
        </Button>
      </div>
    );
  }
  const status = query.data;
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Hạn tiếp theo" className={CARD}>
          <h2 className="text-xl font-medium text-heritage-primary">
            Hạn tiếp theo: {formatDate(status.nextCheckInDueAt)}
          </h2>
          <Countdown status={status} />
          <p className="mt-4 text-sm leading-6 text-heritage-muted">
            Lần gần nhất: {formatDate(status.lastCheckInAt)}. Nếu quá hạn, hệ thống nhắc bạn và
            người tin cậy trước khi làm gì.
          </p>
          <div className="mt-5">
            <CheckInNowButton
              vaultId={vaultId}
              status={status}
              label="Điểm danh bây giờ"
              className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
            />
          </div>
        </section>
        <section aria-label="Lịch điểm danh" className={CARD}>
          <h2 className="mb-4 text-xl font-medium text-heritage-primary">Lịch điểm danh</h2>
          <CheckInSettingsForm key={status.settings.etag} vaultId={vaultId} status={status} />
        </section>
      </div>
      <History periods={status.history.items} />
    </div>
  );
}
