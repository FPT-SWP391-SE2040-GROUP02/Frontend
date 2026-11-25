import type { ReactNode } from "react";
import { Check, CircleAlert, Lock, Send } from "lucide-react";
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
 * `justActivated` chỉ bật ngay sau cú ký: huy hiệu hiện ra, dấu tích được vẽ và có câu báo đã ký xong.
 */
function SignedHeading({ state, justActivated }: { state: SignedState; justActivated: boolean }) {
  let badgeClass = `flex size-12 shrink-0 items-center justify-center rounded-full ${state.badgeClass}`;
  if (justActivated) {
    badgeClass = `${badgeClass} activated-badge`;
  }
  return (
    <div className="flex items-center gap-3.5">
      <span className={badgeClass}>{state.icon}</span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold leading-[1.3] text-heritage-primary">
          {state.title}
        </h2>
        {justActivated && (
          <p role="status" className="mt-0.5 text-sm text-heritage-success">
            Bạn vừa ký xong biên bản phân chia.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Cột phải của trang Bàn giao: tiến độ, các điều kiện chưa đạt và nút mở khung xem trước biên bản phân chia. Chữ nút đổi theo
 * trạng thái: "Xem trước biên bản phân chia" (còn thiếu), "Xem trước và ký" (đủ điều kiện), "Xem biên bản phân chia đã ký" (đã kích hoạt).
 * Thanh tiến độ chỉ có ở bản nháp.
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
  const signed = signedState(setup.planStatus);
  let title = signed.title;
  let buttonText = "Xem biên bản phân chia đã ký";
  let hint = signed.hint;
  let cardClass = signed.cardClass;
  if (isDraft) {
    cardClass = "border-heritage-border bg-heritage-surface";
    if (setup.canActivate) {
      title = "Đã đủ điều kiện để ký";
      buttonText = "Xem trước và ký";
      hint = "Đọc kỹ rồi ký bằng PIN trong khung xem trước.";
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

  let heading: ReactNode = <SignedHeading state={signed} justActivated={justActivated} />;
  if (isDraft) {
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
