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

/** Ghi chú pháp lý: file phân chia số chỉ áp dụng cho dữ liệu trong LegacyVault. */
function LegacyDisclaimer() {
  return (
    <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5 text-sm leading-[1.55] text-[#78490b]">
      <strong className="font-semibold">
        File phân chia số chỉ áp dụng cho dữ liệu trong LegacyVault.
      </strong>{" "}
      Tài sản thật như nhà đất, tiền gửi do gia đình và luật sư xử lý ở ngoài hệ thống.
    </div>
  );
}

/** Câu dẫn đầu trang nháp: nói còn thiếu gì hoặc đã đủ để ký. */
function draftSubtitle(setup: PlanSetup): string {
  if (setup.canActivate) {
    return "Mọi việc đã xong. Bấm Xem trước và ký, đọc lại file phân chia một lượt rồi ký bằng mã PIN để kế hoạch bàn giao bắt đầu chạy.";
  }
  return "Hoàn tất các việc bên dưới, rồi bấm Xem trước file phân chia. File phân chia tự điền từ kho của bạn; đọc xong bạn mới ký.";
}

/** Kế hoạch còn nháp: thẻ việc ở trái; tiến độ và nút xem trước file phân chia ở phải. */
function DraftView({ vaultId, setup }: { vaultId: string; setup: PlanSetup }) {
  return (
    <div className="space-y-7">
      <HandoverHeader
        chipText="Kế hoạch chưa kích hoạt"
        chipTone="warning"
        subtitle={draftSubtitle(setup)}
      />
      <PlanSetupPanel
        vaultId={vaultId}
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
        Mỗi lần sửa gói, người nhận hoặc Người thực thi cần mã PIN. File phân chia bên trái luôn
        hiện nội dung đang áp dụng.
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Link className={buttonStyles.outline} to={ROUTES.DASHBOARD.ASSETS}>
          Sửa gói và người nhận
        </Link>
      </div>
    </section>
  );
}

/**
 * Kế hoạch đã chạy: thẻ việc chỉ còn tóm tắt; bên dưới là điểm danh, kế hoạch đang áp dụng, mã mở gói và tiến trình.
 * Bên phải: nút "Xem file phân chia đã ký" mở khung file phân chia đủ chữ ký.
 */
function RunningView({ vaultId, setup }: { vaultId: string; setup: PlanSetup }) {
  let chipText = `Trạng thái kế hoạch: ${setup.planStatus}`;
  if (setup.planStatus === "ACTIVE") {
    chipText = "Kế hoạch đang chạy";
  }
  return (
    <div className="space-y-7">
      <OwnerRequestNotice vaultId={vaultId} />
      <HandoverHeader
        chipText={chipText}
        chipTone="success"
        subtitle="File phân chia đã ký. Khi có việc xảy ra, người nhận gửi yêu cầu kèm giấy tờ và luật sư lập biên bản."
      />
      <PlanSetupPanel
        vaultId={vaultId}
        belowCards={
          <>
            <ActivePlanCard activatedAt={setup.activatedAt} />
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
 * Trang Bàn giao của Chủ kho. Cột trái là các thẻ việc, cột phải là tiến độ và nút xem trước file phân chia; file phân chia (sinh từ
 * kế hoạch, cả bản nháp lẫn đã ký) trượt ra từ bên phải, ký bằng PIN ở chân khung. Kế hoạch đã chạy thêm kế
 * hoạch đang áp dụng, mã mở gói (hệ thống tự giữ, Chủ kho chỉ đổi mã mới) và tiến trình bàn giao. Quyền và trạng thái
 * luôn do Backend quyết định.
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
