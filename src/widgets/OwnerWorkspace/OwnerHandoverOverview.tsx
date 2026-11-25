import { useState } from "react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import type { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";
import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { OwnerRequestNotice } from "@/features/handover-request";
import { PaperPreviewButton } from "@/entities/handoverRecord";
import { DepositSlipPaper } from "./DepositSlipPaper";
import { HandoverStepsCard } from "./HandoverStepsCard";

type PlanSetup = z.infer<typeof planSetupSchema>;

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

/** Ghi chú pháp lý: biên bản chỉ chia các tài sản đã lưu trong LegacyVault. */
function LegacyDisclaimer() {
  return (
    <div className="rounded-xl border border-heritage-warning-border bg-heritage-warning-bg px-4 py-3.5 text-sm leading-[1.55] text-heritage-warning">
      <strong className="font-semibold">
        Biên bản này chỉ chia các tài sản đã lưu trong LegacyVault.
      </strong>{" "}
      Tài sản thật như nhà đất, tiền gửi do gia đình và luật sư xử lý riêng, ngoài hệ thống.
    </div>
  );
}

/** Câu dẫn đầu trang nháp: nói còn thiếu gì hoặc đã đủ để ký. */
function draftSubtitle(setup: PlanSetup): string {
  if (setup.willAwaitingExecutor) {
    return "Bạn đã ký biên bản phân chia. Kế hoạch có hiệu lực khi Người thực thi xem biên bản và ký nhận vai.";
  }
  if (setup.canActivate) {
    return "Mọi việc đã xong. Bấm Xem trước và ký, đọc lại biên bản phân chia rồi ký bằng mã PIN. Người thực thi xem bản bạn ký và ký sau cùng.";
  }
  return "Hoàn tất các việc bên dưới, rồi bấm Xem trước biên bản phân chia. Biên bản phân chia tự điền từ kho của bạn; đọc xong bạn mới ký.";
}

function draftChip(setup: PlanSetup): string {
  if (setup.willAwaitingExecutor) {
    return "Chờ Người thực thi ký";
  }
  return "Kế hoạch chưa kích hoạt";
}

/** Bước ký của kế hoạch: nháp, Chủ kho đã ký đang chờ Người thực thi, hoặc trạng thái máy chủ trả. */
function signingStage(setup: PlanSetup): string {
  if (setup.planStatus === "DRAFT" && setup.willAwaitingExecutor) {
    return "AWAITING_EXECUTOR";
  }
  return setup.planStatus;
}

/** Chủ kho vừa ký (nháp sang chờ ký) hoặc kế hoạch vừa có hiệu lực. */
function isSigningProgress(from: string | null, to: string): boolean {
  if (from === "DRAFT") {
    return to === "AWAITING_EXECUTOR" || to === "ACTIVE";
  }
  return from === "AWAITING_EXECUTOR" && to === "ACTIVE";
}

/** Kế hoạch còn nháp: thẻ việc ở trái; tiến độ và nút xem trước biên bản phân chia ở phải. */
function DraftView({
  vaultId,
  setup,
  justActivated,
}: {
  vaultId: string;
  setup: PlanSetup;
  justActivated: boolean;
}) {
  return (
    <div className="space-y-7">
      <HandoverHeader
        chipText={draftChip(setup)}
        chipTone="warning"
        subtitle={draftSubtitle(setup)}
      />
      <PlanSetupPanel
        vaultId={vaultId}
        justActivated={justActivated}
        belowCards={
          <>
            <HandoverStepsCard />
            <p className="text-sm text-heritage-muted">
              Người nhận chỉ gửi yêu cầu nhận được sau khi kích hoạt.
            </p>
          </>
        }
        sideNote={<LegacyDisclaimer />}
      />
    </div>
  );
}

/** Thẻ "Kế hoạch đang áp dụng": lúc Chủ kho ký kích hoạt và lối sửa phần phân chia, người nhận. */
function ActivePlanCard({ setup }: { setup: PlanSetup }) {
  const activatedAt = setup.activatedAt;
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
        Mỗi lần sửa phần phân chia, người nhận hoặc Người thực thi cần mã PIN. Biên bản phân chia
        bên trái luôn hiện nội dung đang áp dụng.
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Link className={buttonStyles.outline} to={ROUTES.DASHBOARD.ASSETS}>
          Sửa phân chia và người nhận
        </Link>
        <PaperPreviewButton
          label="Xem phiếu gửi"
          title="Phiếu gửi tài sản"
          fileName="Phieu-gui-tai-san"
          paper={<DepositSlipPaper setup={setup} />}
        />
      </div>
    </section>
  );
}

/**
 * Kế hoạch đã chạy: thẻ việc chỉ còn tóm tắt; bên dưới là kế hoạch đang áp dụng, mã nhận và tiến trình.
 * Bên phải: nút "Xem biên bản phân chia đã ký" mở khung biên bản phân chia đủ chữ ký.
 */
function RunningView({
  vaultId,
  setup,
  justActivated,
}: {
  vaultId: string;
  setup: PlanSetup;
  justActivated: boolean;
}) {
  let chipText = `Trạng thái kế hoạch: ${setup.planStatus}`;
  if (setup.planStatus === "ACTIVE") {
    chipText = "Kế hoạch đang chạy";
  }
  let headerClass = "";
  if (justActivated) {
    headerClass = "activated-rise";
  }
  return (
    <div className="space-y-7">
      <OwnerRequestNotice vaultId={vaultId} />
      <div className={headerClass}>
        <HandoverHeader
          chipText={chipText}
          chipTone="success"
          subtitle="Biên bản phân chia đã ký. Khi có việc xảy ra, người nhận gửi yêu cầu kèm giấy tờ và luật sư lập biên bản."
        />
      </div>
      <PlanSetupPanel
        vaultId={vaultId}
        justActivated={justActivated}
        belowCards={
          <>
            <ActivePlanCard setup={setup} />
            <HandoverStepsCard
              title="Tiến trình bàn giao"
              subtitle="Chưa có yêu cầu nhận tài sản. Khi người nhận gửi yêu cầu, bước đang diễn ra sẽ được tô đậm tại đây."
            />
          </>
        }
        sideNote={<LegacyDisclaimer />}
      />
    </div>
  );
}

/**
 * Trang Bàn giao của Chủ kho. Cột trái là các thẻ việc, cột phải là tiến độ và nút xem trước biên bản phân chia; biên bản phân chia (sinh từ
 * kế hoạch, cả bản nháp lẫn đã ký) trượt ra từ bên phải, ký bằng PIN ở chân khung. Kế hoạch đã chạy thêm kế
 * hoạch đang áp dụng, mã nhận (hệ thống tự giữ, Chủ kho chỉ đổi mã mới) và tiến trình bàn giao. Quyền và trạng thái
 * luôn do Backend quyết định.
 */
export function OwnerHandoverOverview({ vaultId }: { vaultId: string }) {
  const planQuery = usePlanSetup(vaultId);
  // Chỉ coi là "vừa đổi" khi trang đang mở thấy bước ký tiến lên; mở lại trang thì không.
  const [seenStage, setSeenStage] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);
  let currentStage: string | null = null;
  if (planQuery.data !== undefined) {
    currentStage = signingStage(planQuery.data);
  }
  if (currentStage !== null && currentStage !== seenStage) {
    setSeenStage(currentStage);
    setJustActivated(isSigningProgress(seenStage, currentStage));
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
      <div
        role="alert"
        className="space-y-3 rounded-2xl border border-heritage-danger-border bg-heritage-danger-bg p-6"
      >
        <p className="text-sm text-heritage-danger">Không tải được kế hoạch bàn giao.</p>
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
    return <DraftView vaultId={vaultId} setup={planQuery.data} justActivated={justActivated} />;
  }
  return <RunningView vaultId={vaultId} setup={planQuery.data} justActivated={justActivated} />;
}
