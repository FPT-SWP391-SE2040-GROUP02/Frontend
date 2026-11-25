import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "cn";

/** "current": làm được ngay; "done": đã xong; "locked": phải xong bước trước. */
export type SigningStepState = "current" | "done" | "locked";

const NUMBER_STYLE: Record<SigningStepState, string> = {
  current: "bg-heritage-primary text-white",
  done: "bg-heritage-success text-white",
  locked: "border border-heritage-border-strong text-heritage-muted",
};

/** Câu cho trình đọc màn hình, thay cho dấu tích và ổ khóa nhìn thấy được. */
const STATE_TEXT: Record<SigningStepState, string> = {
  current: "",
  done: " (đã xong)",
  locked: " (đang khóa)",
};

/** Các bước phải làm theo thứ tự trước khi ký. */
export function SigningSteps({ children }: { children: ReactNode }) {
  return <ol className="space-y-5">{children}</ol>;
}

export function SigningStep({
  number,
  title,
  state,
  children,
}: {
  number: number;
  title: string;
  state: SigningStepState;
  children: ReactNode;
}) {
  const locked = state === "locked";
  let mark: ReactNode = number;
  if (state === "done") {
    mark = <Check className="size-4" />;
  }
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          NUMBER_STYLE[state],
        )}
      >
        {mark}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p
          className={cn(
            "flex min-h-7 items-center gap-2 text-sm font-semibold",
            locked && "text-heritage-muted",
          )}
        >
          <span>
            {title}
            <span className="sr-only">{STATE_TEXT[state]}</span>
          </span>
          {locked && <Lock className="size-4 shrink-0" aria-hidden="true" />}
        </p>
        <div className={cn(locked && "text-heritage-muted")}>{children}</div>
      </div>
    </li>
  );
}
