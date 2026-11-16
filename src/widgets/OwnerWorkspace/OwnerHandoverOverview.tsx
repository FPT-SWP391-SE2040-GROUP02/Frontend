import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import { PrintWillButton } from "@/entities/will/ui/PrintWillButton";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { checkInService } from "@/features/dms/api/checkInService";
import { dailyCheckInState } from "@/features/dms/model/dailyCheckIn";
import type { checkInStatusSchema } from "@/features/dms/model/checkIn.schema";
import { ExecutorKeyCard } from "@/features/executor-key";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import type { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";
import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { PlanWillDocument } from "@/features/plan-setup/ui/PlanWillDocument";
import { formatDate, formatTimeThenDate } from "@/shared/lib/dateFormat";
import { HandoverStepsCard } from "./HandoverStepsCard";

type CheckInStatus = z.infer<typeof checkInStatusSchema>;
type PlanSetup = z.infer<typeof planSetupSchema>;

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
          <p role="status" className="mt-3 text-sm text-[#E0C486]">
            Người thực thi đã điểm danh hộ bạn hôm nay. Mở lại từ 00:00 ngày tiếp theo (giờ Việt
            Nam).
          </p>
        )}
        {checkedInToday && (
          <p role="status" className="mt-3 text-sm text-[#E0C486]">
            Đã điểm danh hôm nay. Mở lại từ 00:00 ngày tiếp theo (giờ Việt Nam).
          </p>
        )}
        {!planAllowsCheckIn && (
          <p className="mt-3 text-sm text-white/70">
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
        <p role="status" className="mt-3 text-sm text-white/70">
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

/**
 * Dòng đầu trang: nhãn trạng thái kế hoạch và một câu giải thích ngắn. Tiêu đề "Bàn giao" đã có ở khung trang
 * nên ở đây không lặp lại.
 */
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
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
      <Chip tone={chipTone}>{chipText}</Chip>
      <p className="max-w-[62ch] text-heritage-muted">{subtitle}</p>
    </div>
  );
}

/** Ghi chú pháp lý: di chúc số chỉ áp dụng cho dữ liệu trong LegacyVault. */
function LegacyDisclaimer() {
  return (
    <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5 text-sm leading-[1.55] text-[#78490b]">
      <strong className="font-semibold">
        Di chúc số chỉ áp dụng cho dữ liệu trong LegacyVault.
      </strong>{" "}
      Tài sản thật như nhà đất, tiền gửi vẫn chia theo di chúc có người làm chứng, công chứng hoặc
      theo pháp luật.
    </div>
  );
}

/** Tờ di chúc: sinh từ dữ liệu kế hoạch, cùng nội dung ở trạng thái nháp và đã ký; kèm nút in (không có mã mở gói). */
function WillPaper({ setup }: { setup: PlanSetup }) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  let ownerFallback = { fullName: "", email: "" };
  if (user) {
    ownerFallback = { fullName: user.fullName, email: user.email };
  }
  return (
    <div className="space-y-4">
      <article
        aria-label="Di chúc"
        className="min-w-0 rounded-2xl border border-heritage-border bg-heritage-surface p-6 shadow-sm sm:p-10 lg:p-14"
      >
        <PlanWillDocument setup={setup} ownerFallback={ownerFallback} viewer="owner" />
      </article>
      <div className="flex justify-end">
        <PrintWillButton
          content={<PlanWillDocument setup={setup} ownerFallback={ownerFallback} viewer="reader" />}
        />
      </div>
    </div>
  );
}

/** Câu dẫn đầu trang nháp: nói còn thiếu gì hoặc đã đủ để ký. */
function draftSubtitle(setup: PlanSetup): string {
  if (setup.canActivate) {
    return "Di chúc đã đủ nội dung và Người thực thi đã ký nhận vai. Đọc lại một lượt rồi ký bằng mã PIN để kế hoạch bàn giao bắt đầu chạy.";
  }
  return "Di chúc dưới đây tự điền từ kho của bạn. Còn chỗ chưa điền; điền xong bạn mới ký được.";
}

/** Kế hoạch còn nháp: di chúc ở trái, điều kiện và ô ký ở phải. */
function DraftView({ vaultId, setup }: { vaultId: string; setup: PlanSetup }) {
  return (
    <div className="space-y-7">
      <HandoverHeader
        chipText="Kế hoạch chưa kích hoạt"
        chipTone="warning"
        subtitle={draftSubtitle(setup)}
      />
      <div className="grid max-w-[1180px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <WillPaper setup={setup} />
        </div>
        <div className="min-w-0 space-y-5">
          <PlanSetupPanel vaultId={vaultId} />
          <LegacyDisclaimer />
          <HandoverStepsCard />
          <p className="text-sm text-heritage-muted">
            Điểm danh định kỳ bắt đầu sau khi kích hoạt.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Thẻ "Kế hoạch đang áp dụng": lúc Chủ kho ký kích hoạt và lối sửa gói, người nhận. */
function ActivePlanCard({ activatedAt }: { activatedAt: string | null | undefined }) {
  let activatedText = "Chưa có";
  if (activatedAt) {
    activatedText = formatTimeThenDate(activatedAt);
  }
  return (
    <section
      aria-label="Kế hoạch đang áp dụng"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-[22px] shadow-sm"
    >
      <h2 className="text-[17px] font-semibold leading-[1.3] text-heritage-primary">
        Kế hoạch đang áp dụng
      </h2>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1 text-sm">
        <dt className="text-heritage-muted">Kích hoạt lúc</dt>
        <dd className="font-semibold">{activatedText}</dd>
      </dl>
      <p className="mt-3 text-sm text-heritage-muted">
        Mỗi lần sửa gói, người nhận hoặc Người thực thi cần mã PIN. Di chúc bên trái luôn hiện nội
        dung đang áp dụng.
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Link className={buttonStyles.outline} to={ROUTES.DASHBOARD.ASSETS}>
          Sửa gói và người nhận
        </Link>
      </div>
    </section>
  );
}

/** Kế hoạch đã chạy: di chúc đủ chữ ký ở trái; điểm danh, kế hoạch đang áp dụng, mã mở gói và tiến trình ở phải. */
function RunningView({ vaultId, setup }: { vaultId: string; setup: PlanSetup }) {
  let chipText = `Trạng thái kế hoạch: ${setup.planStatus}`;
  if (setup.planStatus === "ACTIVE") {
    chipText = "Kế hoạch đang chạy";
  }
  return (
    <div className="space-y-7">
      <HandoverHeader
        chipText={chipText}
        chipTone="success"
        subtitle="Di chúc đã có đủ chữ ký. Điểm danh đúng hạn để kế hoạch tiếp tục chạy."
      />
      <div className="grid max-w-[1180px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <WillPaper setup={setup} />
        </div>
        <div className="min-w-0 space-y-5">
          <CheckInCard vaultId={vaultId} />
          <ActivePlanCard activatedAt={setup.activatedAt} />
          <ExecutorKeyCard vaultId={vaultId} />
          <HandoverStepsCard
            title="Tiến trình bàn giao"
            subtitle="Chưa có báo tin. Khi Người thực thi báo tin, bước đang diễn ra sẽ được tô đậm tại đây."
          />
          <LegacyDisclaimer />
        </div>
      </div>
    </div>
  );
}

/**
 * Trang Bàn giao của Chủ kho. Cột trái luôn là di chúc sinh từ kế hoạch (cả ở trạng thái nháp lẫn đã ký). Kế hoạch
 * nháp: điều kiện và ô ký bằng PIN ở cột phải. Kế hoạch đã chạy: điểm danh, kế hoạch đang áp dụng, mã mở gói (hệ thống tự
 * giữ, Chủ kho chỉ đổi mã mới) và tiến trình bàn giao. Quyền và trạng thái luôn do Backend quyết định.
 */
export function OwnerHandoverOverview({ vaultId }: { vaultId: string }) {
  const planQuery = usePlanSetup(vaultId);

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
    return <DraftView vaultId={vaultId} setup={planQuery.data} />;
  }
  return <RunningView vaultId={vaultId} setup={planQuery.data} />;
}
