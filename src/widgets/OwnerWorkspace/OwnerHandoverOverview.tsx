import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { checkInService } from "@/features/dms/api/checkInService";
import { dailyCheckInState } from "@/features/dms/model/dailyCheckIn";
import type { checkInStatusSchema } from "@/features/dms/model/checkIn.schema";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { useOwnerDeathCase } from "@/features/owner-objection/model/useOwnerDeathCase";
import { formatDate } from "@/shared/lib/dateFormat";
import type { z } from "zod";

type CheckInStatus = z.infer<typeof checkInStatusSchema>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const GOLD_BADGE =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]";

/** Năm bước bàn giao theo thiết kế; nội dung cố định theo SRS, không lấy từ máy chủ. */
const HANDOVER_STEPS = [
  { title: "Báo tin", detail: "Người thực hiện báo tin.", short: "Báo tin" },
  { title: "Xét duyệt", detail: "Người xét duyệt kiểm tra.", short: "Xét duyệt" },
  {
    title: "Xác minh người nhận",
    detail: "Người nhận xác nhận danh tính.",
    short: "Xác minh người nhận",
  },
  {
    title: "Phản đối 72 giờ",
    detail: "Bạn có 72 giờ để dừng lại.",
    short: "Thời gian phản đối 72 giờ",
  },
  {
    title: "Tải nội dung 7 ngày",
    detail: "Người nhận tải về trong 7 ngày.",
    short: "Tải nội dung 7 ngày",
  },
];

const executorStatusLabels = {
  INVITED: "Chờ phản hồi",
  ACCEPTED: "Đã xác nhận lời mời",
  DECLINED: "Đã từ chối",
  EXPIRED: "Lời mời hết hạn",
  REVOKED: "Đã thu hồi",
  SUSPENDED: "Cần chấp nhận lại",
};

function ProcessCard() {
  const rows: ReactNode[] = [];
  let stepNumber = 0;
  for (const step of HANDOVER_STEPS) {
    stepNumber = stepNumber + 1;
    rows.push(
      <li
        key={step.title}
        className="flex items-start gap-4 border-b border-heritage-border py-4 last:border-b-0"
      >
        <span className={GOLD_BADGE} aria-hidden="true">
          {stepNumber}
        </span>
        <div>
          <p className="font-semibold">{step.title}</p>
          <p className="text-sm text-heritage-muted">{step.detail}</p>
        </div>
      </li>,
    );
  }
  return (
    <section aria-label="Quy trình bàn giao" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Quy trình bàn giao</h2>
      <ol className="mt-3">{rows}</ol>
    </section>
  );
}

interface TrustedPersonProps {
  role: string;
  name: string;
  status: string;
  needsAction: boolean;
  children?: ReactNode;
}

function TrustedPerson({ role, name, status, needsAction, children }: TrustedPersonProps) {
  let statusColor = "text-green-700";
  if (needsAction) {
    statusColor = "text-red-700";
  }
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-heritage-border bg-heritage-canvas p-4">
      <p className="text-xs font-semibold text-[#7A5B24]">{role}</p>
      <p className="mt-3 break-words text-xl font-medium text-heritage-primary">{name}</p>
      <p className={`mt-2 text-xs font-semibold ${statusColor}`}>{status}</p>
      {children}
    </div>
  );
}

function TrustedPeopleCard({ vaultId }: { vaultId: string }) {
  const query = usePlanSetup(vaultId);
  let content: ReactNode;
  if (query.isPending) {
    content = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải người tin cậy…
      </p>
    );
  } else if (query.isError) {
    content = (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-heritage-muted">Không tải được danh sách người tin cậy.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else {
    // Mỗi vai lấy lời mời còn hiệu lực gần nhất; lời mời đã thu hồi/từ chối không tính là người hiện tại.
    let primary = null;
    let backup = null;
    for (const executor of query.data.executors) {
      const isCurrent =
        executor.status === "INVITED" ||
        executor.status === "ACCEPTED" ||
        executor.status === "SUSPENDED";
      if (!isCurrent) {
        continue;
      }
      if (executor.role === "PRIMARY" && primary === null) {
        primary = executor;
      }
      if (executor.role === "BACKUP" && backup === null) {
        backup = executor;
      }
    }
    let primaryName = "Chưa mời";
    let primaryStatus = "Cần mời";
    let primaryNeedsAction = true;
    let primaryAction: ReactNode = (
      <Link
        to={ROUTES.DASHBOARD.TRUSTED_PEOPLE}
        className="mt-4 inline-flex min-h-11 items-center justify-center self-start rounded-lg bg-[#E0C486] px-4 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] focus-visible:outline-2 focus-visible:outline-heritage-gold"
      >
        Mời người thực hiện
      </Link>
    );
    if (primary !== null) {
      primaryName = primary.inviteeEmail;
      primaryStatus = executorStatusLabels[primary.status];
      primaryNeedsAction = primary.status !== "ACCEPTED";
      primaryAction = null;
    }
    let backupLine = "Chưa có Executor dự phòng.";
    if (backup !== null) {
      backupLine = `Dự phòng: ${backup.inviteeEmail} · ${executorStatusLabels[backup.status]}`;
    }
    content = (
      <div className="grid gap-4 sm:grid-cols-2">
        <TrustedPerson
          role="Người thực hiện"
          name={primaryName}
          status={primaryStatus}
          needsAction={primaryNeedsAction}
        >
          <p className="mt-3 break-words text-xs text-heritage-muted">{backupLine}</p>
          {primaryAction}
        </TrustedPerson>
        <TrustedPerson
          role="Người xét duyệt"
          name="Hệ thống phân công"
          status="Phân công khi có yêu cầu bàn giao"
          needsAction={false}
        />
      </div>
    );
  }
  return (
    <section aria-label="Người tin cậy" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Người tin cậy</h2>
      <div className="mt-4">{content}</div>
      <p className="mt-4 text-xs text-heritage-muted">
        Hai người này xác nhận bàn giao, không đọc được nội dung kho.
      </p>
    </section>
  );
}

function CheckInCard({ vaultId }: { vaultId: string }) {
  const query = useCheckIn(vaultId);
  const action = usePrivateAction();
  const client = useQueryClient();

  function syncAfterCheckIn(result: CheckInStatus): void {
    client.setQueryData(["vault-check-in", vaultId], result);
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  }

  let body: ReactNode;
  if (query.isPending) {
    body = (
      <p role="status" className="mt-4 text-sm text-white/75">
        Đang tải trạng thái điểm danh…
      </p>
    );
  } else if (query.isError) {
    body = (
      <div role="alert" className="mt-4 space-y-3">
        <p className="text-sm text-white/80">Không tải được trạng thái điểm danh.</p>
        <Button
          variant="outline"
          className="border-white/40 bg-transparent text-white hover:bg-white/10"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Thử lại
        </Button>
      </div>
    );
  } else {
    const data = query.data;
    let remaining = "";
    if (data.nextCheckInDueAt !== null) {
      const daysLeft = Math.ceil(
        (new Date(data.nextCheckInDueAt).getTime() - new Date(data.serverTime).getTime()) /
          MS_PER_DAY,
      );
      if (daysLeft >= 0) {
        remaining = ` (còn ${daysLeft} ngày)`;
      } else {
        remaining = " (đã quá hạn)";
      }
    }
    const { canCheckIn, checkedInToday, planAllowsCheckIn } = dailyCheckInState(data);

    body = (
      <>
        <p className="mt-4 text-sm">Lần gần nhất: {formatDate(data.lastCheckInAt)}</p>
        <p className="mt-1 text-sm">
          Hạn tiếp theo: <span className="font-semibold">{formatDate(data.nextCheckInDueAt)}</span>
          {remaining}
        </p>
        <Button
          className="mt-5 min-h-11 bg-[#E0C486] px-6 font-semibold text-[#0A281E] hover:bg-[#E6C98B]"
          disabled={!canCheckIn || action.pending}
          onClick={() => void action.execute(() => checkInService.checkIn(), syncAfterCheckIn)}
        >
          {action.pending ? "Đang gửi…" : checkedInToday ? "Đã điểm danh hôm nay" : "Điểm danh"}
        </Button>
        {checkedInToday && (
          <p role="status" className="mt-3 text-xs text-[#E0C486]">
            Đã điểm danh hôm nay. Mở lại từ 00:00 ngày tiếp theo (giờ Việt Nam).
          </p>
        )}
        {!planAllowsCheckIn && (
          <p className="mt-3 text-xs text-white/70">
            Kế hoạch chưa kích hoạt nên chưa điểm danh được.
          </p>
        )}
      </>
    );
  }
  return (
    <section aria-label="Điểm danh định kỳ" className="rounded-2xl bg-[#1d4d3c] p-6 text-white">
      <h2 className="text-2xl font-medium">Điểm danh định kỳ</h2>
      {body}
      {action.pending && (
        <p role="status" className="mt-3 text-xs text-white/70">
          Đang gửi yêu cầu…
        </p>
      )}
      {action.error && (
        <p role="alert" className="mt-3 text-sm text-red-200">
          {action.error}
        </p>
      )}
      <p className="mt-4 text-xs text-white/60">
        “Tôi còn sống” chỉ hiện khi có yêu cầu bàn giao, để dừng ngay.
      </p>
    </section>
  );
}

function StatusCard({ vaultId }: { vaultId: string }) {
  const query = useOwnerDeathCase(vaultId, true);
  let summary: ReactNode;
  if (query.isPending) {
    summary = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải trạng thái bàn giao…
      </p>
    );
  } else if (query.isError) {
    summary = (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-heritage-muted">Không tải được trạng thái bàn giao.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else if (query.data === null) {
    summary = (
      <p className="text-sm leading-6 text-heritage-muted">
        Chưa có yêu cầu bàn giao. Khi bắt đầu, các bước sẽ hiện tại đây.
      </p>
    );
  } else {
    const deathCase = query.data;
    summary = (
      <div className="space-y-1 text-sm leading-6">
        <p>
          Đang có yêu cầu bàn giao <span className="font-semibold">{deathCase.caseCode}</span>.
        </p>
        <p className="text-heritage-muted">Trạng thái hồ sơ: {deathCase.status}</p>
        {deathCase.objectionEndsAt !== null && (
          <p className="text-heritage-muted">
            Hạn phản đối: {formatDate(deathCase.objectionEndsAt)}
          </p>
        )}
      </div>
    );
  }
  const rows: ReactNode[] = [];
  let stepNumber = 0;
  for (const step of HANDOVER_STEPS) {
    stepNumber = stepNumber + 1;
    rows.push(
      <li key={step.title} className="flex items-center gap-3 text-sm">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-heritage-border text-xs text-heritage-muted"
          aria-hidden="true"
        >
          {stepNumber}
        </span>
        Điều {stepNumber}. {step.short}
      </li>,
    );
  }
  return (
    <section aria-label="Trạng thái hiện tại" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Trạng thái hiện tại</h2>
      <div className="mt-3">{summary}</div>
      <ol className="mt-4 space-y-3">{rows}</ol>
    </section>
  );
}

/**
 * Tổng quan bàn giao theo thiết kế: quy trình, người tin cậy, điểm danh và trạng thái.
 * Chỉ đọc dữ liệu Backend đã có; các thao tác thật (mời Executor, kích hoạt) nằm ở khối bên dưới.
 */
export function OwnerHandoverOverview({ vaultId }: { vaultId: string }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-6">
        <ProcessCard />
        <TrustedPeopleCard vaultId={vaultId} />
      </div>
      <div className="space-y-6">
        <CheckInCard vaultId={vaultId} />
        <StatusCard vaultId={vaultId} />
      </div>
    </div>
  );
}
