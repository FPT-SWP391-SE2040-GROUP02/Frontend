import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { checkInService } from "@/features/dms/api/checkInService";
import { dailyCheckInState } from "@/features/dms/model/dailyCheckIn";
import type { checkInStatusSchema } from "@/features/dms/model/checkIn.schema";
import {
  ExecutorKeyCard,
  ExecutorKeyReveal,
  useExecutorKeyIssue,
  useExecutorKeyStatus,
  type ExecutorKeyIssued,
  type HandoverSlipContext,
} from "@/features/executor-key";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import type { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";
import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { PlanReviewSummary } from "@/features/plan-setup/ui/PlanReviewSummary";
import { formatDate } from "@/shared/lib/dateFormat";
import { HandoverStepsCard } from "./HandoverStepsCard";
import { useHandoverSlipContext } from "./useHandoverSlipContext";

type CheckInStatus = z.infer<typeof checkInStatusSchema>;
type PlanSetup = z.infer<typeof planSetupSchema>;
type KeyIssuer = ReturnType<typeof useExecutorKeyIssue>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
    const { canCheckIn, checkedInToday, executorCheckedInToday, planAllowsCheckIn } =
      dailyCheckInState(data);

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
          {action.pending
            ? "Đang gửi…"
            : executorCheckedInToday
              ? "Người thực thi đã điểm danh hộ"
              : checkedInToday
                ? "Đã điểm danh hôm nay"
                : "Điểm danh"}
        </Button>
        {executorCheckedInToday && (
          <p role="status" className="mt-3 text-xs text-[#E0C486]">
            Người thực thi đã điểm danh hộ bạn hôm nay. Mở lại từ 00:00 ngày tiếp theo (giờ Việt
            Nam).
          </p>
        )}
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
    </section>
  );
}

/** Dòng đầu trang: nhãn trạng thái kế hoạch và một câu giải thích ngắn. */
function HandoverHeader({
  chipText,
  chipTone,
  subtitle,
}: {
  chipText: string;
  chipTone: "warning" | "success";
  subtitle: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Chip tone={chipTone}>{chipText}</Chip>
      <p className="text-sm text-heritage-muted">{subtitle}</p>
    </div>
  );
}

/** Kế hoạch còn nháp: việc cần làm để kích hoạt ở trái, cách bàn giao diễn ra ở phải. */
function DraftView({ vaultId, onActivated }: { vaultId: string; onActivated: () => void }) {
  return (
    <div className="space-y-6">
      <HandoverHeader
        chipText="Kế hoạch chưa kích hoạt"
        chipTone="warning"
        subtitle="Hoàn thành các việc dưới đây để kế hoạch bàn giao bắt đầu chạy."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PlanSetupPanel vaultId={vaultId} onActivated={onActivated} />
        <div className="space-y-6">
          <HandoverStepsCard />
          <p className="text-sm text-heritage-muted">
            Điểm danh định kỳ bắt đầu sau khi kích hoạt.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Màn nhận mã ngay sau khi kích hoạt (hoặc sau khi tạo mã ở dải cảnh báo): mã chỉ hiện ở đây, một lần. */
function KeyReceiptView({
  issued,
  slip,
  onDone,
}: {
  issued: ExecutorKeyIssued;
  slip: HandoverSlipContext;
  onDone: () => void;
}) {
  let issuedAt = issued.issuedAt;
  if (issued.reissuedAt) {
    issuedAt = issued.reissuedAt;
  }
  return (
    <section
      aria-label="Nhận mã mở gói"
      className="space-y-5 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h2 className="text-xl font-medium text-heritage-primary">
        Kế hoạch đã kích hoạt. Còn một việc: lưu mã mở gói
      </h2>
      <ExecutorKeyReveal
        slip={{
          ownerName: slip.ownerName,
          vaultName: slip.vaultName,
          executorEmail: slip.executorEmail,
          issuedAt,
          version: issued.version,
          shard: issued.shard,
        }}
        onDone={onDone}
      />
    </section>
  );
}

/** Kế hoạch đã chạy: mã mở gói, gói sẽ bàn giao ở trái; điểm danh và tiến trình bàn giao ở phải. */
function RunningView({
  vaultId,
  setup,
  slip,
  issuer,
  onIssued,
}: {
  vaultId: string;
  setup: PlanSetup;
  slip: HandoverSlipContext;
  issuer: KeyIssuer;
  onIssued: (result: ExecutorKeyIssued) => void;
}) {
  const keyStatus = useExecutorKeyStatus(vaultId);
  let keyMissing = false;
  if (keyStatus.isSuccess) {
    keyMissing = !keyStatus.data.hasKey && keyStatus.data.canIssue;
  }
  let chipText = `Trạng thái kế hoạch: ${setup.planStatus}`;
  if (setup.planStatus === "ACTIVE") {
    chipText = "Kế hoạch đang chạy";
  }
  let keyMissingBanner: ReactNode = null;
  if (keyMissing) {
    keyMissingBanner = (
      <div className="space-y-2">
        <Notice
          tone="warning"
          role="alert"
          title="Kế hoạch đang chạy nhưng chưa có mã mở gói."
          action={
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0A281E] px-6 text-sm font-semibold text-white hover:bg-[#12392C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50"
              disabled={issuer.pending}
              onClick={() => {
                issuer.reset();
                void issuer.run("issue", onIssued);
              }}
            >
              Tạo mã mở gói
            </button>
          }
        >
          Không có mã thì người nhận không mở được tài sản.
        </Notice>
        {issuer.error && (
          <p role="alert" className="text-sm text-destructive">
            {issuer.error}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <HandoverHeader
        chipText={chipText}
        chipTone="success"
        subtitle="Điểm danh đúng hạn để kế hoạch tiếp tục chạy."
      />
      {keyMissingBanner}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <ExecutorKeyCard
            vaultId={vaultId}
            slip={slip}
            title="Mã mở gói"
            showIssueButton={!keyMissing}
          />
          <Panel title="Gói sẽ bàn giao">
            <PlanReviewSummary
              containers={setup.containers}
              assetsOutsideContainer={setup.assetsOutsideContainer}
            />
          </Panel>
        </div>
        <div className="space-y-6">
          <CheckInCard vaultId={vaultId} />
          <HandoverStepsCard
            title="Tiến trình bàn giao"
            subtitle="Chưa có báo tin. Khi Người thực thi báo tin, bước đang diễn ra sẽ được tô đậm tại đây."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Trang Bàn giao của Chủ kho. Kế hoạch nháp: việc cần làm để kích hoạt. Ngay sau khi kích hoạt: cấp và hiện mã mở gói
 * một lần (mã chỉ nằm trong state của component này, không vào cache, storage hay URL). Kế hoạch đã chạy: mã mở gói,
 * gói sẽ bàn giao, điểm danh và tiến trình bàn giao. Quyền và trạng thái luôn do Backend quyết định.
 */
export function OwnerHandoverOverview({
  vaultId,
  vaultName,
}: {
  vaultId: string;
  vaultName?: string | null;
}) {
  const planQuery = usePlanSetup(vaultId);
  const issuer = useExecutorKeyIssue(vaultId);
  const slip = useHandoverSlipContext(vaultId, vaultName);
  const [issued, setIssued] = useState<ExecutorKeyIssued | null>(null);

  if (issued !== null) {
    return <KeyReceiptView issued={issued} slip={slip} onDone={() => setIssued(null)} />;
  }
  if (issuer.pending) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 text-sm text-heritage-muted"
      >
        Kế hoạch đã kích hoạt. Đang tạo mã mở gói…
      </p>
    );
  }
  if (planQuery.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải kế hoạch bàn giao…
      </p>
    );
  }
  if (planQuery.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">Không tải được kế hoạch bàn giao.</p>
        <Button
          variant="outline"
          disabled={planQuery.isFetching}
          onClick={() => void planQuery.refetch()}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  if (planQuery.data.planStatus === "DRAFT") {
    return (
      <DraftView
        vaultId={vaultId}
        onActivated={() => {
          void issuer.issueIfMissing(setIssued);
        }}
      />
    );
  }
  return (
    <RunningView
      vaultId={vaultId}
      setup={planQuery.data}
      slip={slip}
      issuer={issuer}
      onIssued={setIssued}
    />
  );
}
