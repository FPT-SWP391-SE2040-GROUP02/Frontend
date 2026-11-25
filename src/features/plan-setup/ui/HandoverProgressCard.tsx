import type { ReactNode } from "react";
import { Check, CircleAlert, Clock, Lock, Send } from "lucide-react";
import type { z } from "zod";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { computeHandoverProgress, warningText } from "../lib/handoverProgress";
import type { planSetupSchema } from "../model/planSetup.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Cách hiện trạng thái sau khi ký: tiêu đề, câu gợi ý, màu thẻ và biểu tượng. */
interface SignedState {
  title: string;
  hint: string;
  cardClass: string;
  badgeClass: string;
  icon: ReactNode;
}

/** Chủ kho đã ký, kế hoạch còn nháp cho tới khi Người thực thi xem biên bản và ký nhận vai. */
const AWAITING_EXECUTOR: SignedState = {
  title: "Bạn đã ký, chờ Người thực thi ký",
  hint: "Kế hoạch có hiệu lực khi Người thực thi xem biên bản và ký nhận vai.",
  cardClass: "border-heritage-warning-border bg-heritage-warning-bg",
  badgeClass: "bg-heritage-surface text-heritage-warning",
  icon: <Clock className="size-6" aria-hidden="true" />,
};

function signedState(planStatus: string): SignedState {
  if (planStatus === "ACTIVE") {
    return {
      title: "Kế hoạch đang chạy",
      hint: "Biên bản phân chia có hiệu lực từ lúc bạn ký. Bạn vẫn có thể sửa hoặc thu hồi trước khi qua đời.",
      cardClass: "border-heritage-success-border bg-heritage-success-bg",
      badgeClass: "bg-heritage-success text-white",
      icon: <Check className="activated-check size-6" strokeWidth={3} aria-hidden="true" />,
    };
  }
  if (planStatus === "CLOSED") {
    return {
      title: "Kế hoạch đã đóng",
      hint: "Bạn vẫn xem lại được biên bản phân chia đã ký.",
      cardClass: "border-heritage-border bg-heritage-surface",
      badgeClass: "bg-heritage-sunken text-heritage-muted",
      icon: <Lock className="size-5" aria-hidden="true" />,
    };
  }
  return {
    title: "Kế hoạch đang bàn giao",
    hint: "Bạn vẫn xem lại được biên bản phân chia đã ký.",
    cardClass: "border-heritage-warning-border bg-heritage-warning-bg",
    badgeClass: "bg-heritage-surface text-heritage-warning",
    icon: <Send className="size-5" aria-hidden="true" />,
  };
}

/**
 * Đầu thẻ sau khi ký: huy hiệu trạng thái thay cho thanh tiến độ (đã ký thì không còn gì để điền).
 * `notice` chỉ có ngay lúc trạng thái vừa đổi: huy hiệu hiện ra, dấu tích được vẽ và có câu báo.
 */
function SignedHeading({ state, notice }: { state: SignedState; notice: string }) {
  let badgeClass = `flex size-12 shrink-0 items-center justify-center rounded-full ${state.badgeClass}`;
  if (notice !== "") {
    badgeClass = `${badgeClass} activated-badge`;
  }
  return (
    <div className="flex items-center gap-3.5">
      <span className={badgeClass}>{state.icon}</span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold leading-[1.3] text-heritage-primary">
          {state.title}
        </h2>
        {notice !== "" && (
          <p role="status" className="mt-0.5 text-sm text-heritage-success">
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Cột phải của trang Bàn giao: tiến độ, các điều kiện chưa đạt và nút mở khung xem trước biên bản phân chia. Chữ nút đổi theo
 * trạng thái: "Xem trước biên bản phân chia" (còn thiếu), "Xem trước và ký" (đủ điều kiện), "Xem biên bản phân chia đã ký"
 * (đã ký). Thanh tiến độ chỉ có khi còn nháp và Chủ kho chưa ký.
 */
export function HandoverProgressCard({
  setup,
  onOpenPreview,
  justActivated = false,
}: {
  setup: PlanSetup;
  onOpenPreview: () => void;
  justActivated?: boolean;
}) {
  const progress = computeHandoverProgress(setup);
  const isDraft = setup.planStatus === "DRAFT";
  const remaining = progress.total - progress.done;

  let percent = 100;
  if (progress.total > 0) {
    percent = Math.round((progress.done / progress.total) * 100);
  }
  const awaitingExecutor = isDraft && setup.willAwaitingExecutor === true;
  const showProgressBar = isDraft && !awaitingExecutor;
  let signed = signedState(setup.planStatus);
  if (awaitingExecutor) {
    signed = AWAITING_EXECUTOR;
  }
  let title = signed.title;
  let buttonText = "Xem biên bản phân chia đã ký";
  let hint = signed.hint;
  let cardClass = signed.cardClass;
  if (showProgressBar) {
    cardClass = "border-heritage-border bg-heritage-surface";
    if (setup.canActivate) {
      title = "Đã đủ điều kiện để ký";
      buttonText = "Xem trước và ký";
      hint = "Đọc kỹ rồi ký bằng PIN. Người thực thi xem bản bạn ký và ký sau cùng.";
    } else {
      title = `Còn ${remaining} điều kiện chưa đạt`;
      if (remaining === 0) {
        title = "Còn điều kiện cần kiểm tra";
      }
      buttonText = "Xem trước biên bản phân chia";
      hint = "Bạn có thể xem trước bất cứ lúc nào; chỗ chưa điền sẽ được đánh dấu đỏ.";
    }
  }

  const missingItems: ReactNode[] = [];
  const warnings: ReactNode[] = [];
  if (isDraft) {
    for (const text of progress.missingTexts) {
      missingItems.push(<li key={text}>{text}</li>);
    }
    for (const code of setup.warnings) {
      warnings.push(<li key={code}>{warningText(code)}</li>);
    }
  }

  let notice = "";
  if (justActivated && awaitingExecutor) {
    notice = "Bạn vừa ký xong biên bản phân chia.";
  }
  if (justActivated && !isDraft) {
    notice = "Biên bản đã đủ chữ ký, kế hoạch bắt đầu chạy.";
  }
  let heading: ReactNode = <SignedHeading state={signed} notice={notice} />;
  if (showProgressBar) {
    heading = (
      <>
        <h2 className="text-[17px] font-semibold leading-[1.3] text-heritage-primary">{title}</h2>
        <div
          className="mt-3.5 h-2 overflow-hidden rounded-full bg-heritage-canvas shadow-[inset_2px_2px_5px_rgba(0,0,0,.06),inset_-2px_-2px_5px_rgba(255,255,255,.8)]"
          role="progressbar"
          aria-label="Tiến độ điền biên bản phân chia"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        >
          <div
            className="h-full rounded-full bg-heritage-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </>
    );
  }

  return (
    <section
      aria-label="Tiến độ bàn giao"
      className={`rounded-2xl border p-[22px] shadow-sm ${cardClass}`}
    >
      {heading}
      {missingItems.length > 0 && (
        <ul className="mt-3.5 list-disc space-y-1 pl-5 text-sm text-heritage-danger">
          {missingItems}
        </ul>
      )}
      {warnings.length > 0 && (
        <div className="mt-3.5 flex items-start gap-3 rounded-xl border border-heritage-warning-border bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-semibold">Cảnh báo</h3>
            <ul className="list-disc space-y-1 pl-5">{warnings}</ul>
          </div>
        </div>
      )}
      <button type="button" className={`${buttonStyles.dark} mt-4 w-full`} onClick={onOpenPreview}>
        {buttonText}
      </button>
      <p className="mt-2.5 text-[13px] text-heritage-muted">{hint}</p>
    </section>
  );
}
