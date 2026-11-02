import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Lock, HelpCircle } from "lucide-react";
import { cn } from "cn";
import { LegacyVaultMark } from "../LegacyVaultArtwork";
import { Chip, Panel, type Tone } from "../heritageKit";
import type { WizardStep, WizardStepState } from "./wizard.types";

export interface WizardShellProps {
  /** Ví dụ "Chủ kho". Hiện ở đầu trang: "Bạn đang là: Chủ kho". */
  roleLabel: string;
  steps: WizardStep[];
  /** Bước đang mở, đọc từ URL ?step=… ; mặc định là currentId. */
  activeId: string;
  onSelectStep: (id: string) => void;
  /** Link "Xem toàn bộ trang quản lý". */
  exitHref: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Nút Tiếp tục / Để sau của từng bước. */
  footer?: ReactNode;
}

const STATE_LABEL: Record<WizardStepState, string> = {
  done: "Xong",
  current: "Đang làm",
  todo: "Chưa làm",
  blocked: "Bị chặn",
  unknown: "Chưa kiểm tra được",
};

const STATE_TONE: Record<WizardStepState, Tone> = {
  done: "success",
  current: "warning",
  todo: "neutral",
  blocked: "danger",
  unknown: "neutral",
};

function StepMarker({ state, index }: { state: WizardStepState; index: number }) {
  const base =
    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold";
  if (state === "done") {
    return (
      <span className={cn(base, "bg-[#1F7A55] text-white")} aria-hidden="true">
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span className={cn(base, "bg-[#F8E1DE] text-[#A32119]")} aria-hidden="true">
        <Lock className="size-4" />
      </span>
    );
  }
  if (state === "unknown") {
    return (
      <span className={cn(base, "bg-[#ECE8DB] text-heritage-muted")} aria-hidden="true">
        <HelpCircle className="size-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={cn(base, "bg-[#E0C486] text-[#0A281E]")} aria-hidden="true">
        {index + 1}
      </span>
    );
  }
  return (
    <span className={cn(base, "border border-heritage-border text-heritage-muted")}>
      {index + 1}
    </span>
  );
}

/**
 * Khung wizard toàn màn hình, không sidebar: cột bước bên trái (desktop), thanh ngang cuộn được từ 768px trở xuống.
 * Chỉ trình bày; trạng thái từng bước do resolver của từng vai tính từ dữ liệu máy chủ.
 */
export function WizardShell({
  roleLabel,
  steps,
  activeId,
  onSelectStep,
  exitHref,
  title,
  description,
  children,
  footer,
}: WizardShellProps) {
  const doneCount = steps.filter((step) => step.state === "done").length;
  const activeStep = steps.find((step) => step.id === activeId);
  return (
    <div className="min-h-screen bg-heritage-canvas text-heritage-text">
      <a
        href="#wizard-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface px-4 py-3 text-heritage-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Đến nội dung chính
      </a>
      <header className="border-b border-heritage-border bg-heritage-primary text-heritage-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <LegacyVaultMark className="size-8 shrink-0" />
            <p className="truncate text-sm">
              Bạn đang là: <strong className="font-semibold text-heritage-gold">{roleLabel}</strong>
            </p>
          </div>
          <Link
            to={exitHref}
            className="flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-heritage-gold focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            Xem toàn bộ trang quản lý
          </Link>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[260px_minmax(0,1fr)] lg:py-8">
        <nav aria-label="Các bước" className="min-w-0 md:sticky md:top-6 md:self-start">
          <p className="mb-3 hidden text-sm text-heritage-muted md:block">
            Đã xong {doneCount}/{steps.length} bước
          </p>
          <ol className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
            {steps.map((step, index) => {
              const active = step.id === activeId;
              return (
                <li key={step.id} className="shrink-0 md:shrink">
                  <button
                    type="button"
                    aria-current={active ? "step" : undefined}
                    onClick={() => onSelectStep(step.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold",
                      active && "border-heritage-primary bg-heritage-surface font-semibold",
                      !active && "border-transparent hover:bg-heritage-surface/70",
                    )}
                  >
                    <StepMarker state={step.state} index={index} />
                    <span className="min-w-0 flex-1">
                      <span className="block whitespace-nowrap md:whitespace-normal">
                        {step.title}
                      </span>
                      <span className="sr-only">{STATE_LABEL[step.state]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <main
          id="wizard-content"
          tabIndex={-1}
          className="min-w-0 space-y-6 focus:outline-none"
          aria-live="polite"
        >
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h1 className="text-2xl font-semibold text-heritage-primary">{title}</h1>
                <p className="text-sm leading-6 text-heritage-muted">{description}</p>
              </div>
              {activeStep && (
                <Chip tone={STATE_TONE[activeStep.state]}>{STATE_LABEL[activeStep.state]}</Chip>
              )}
            </div>
          </Panel>
          <div className="min-w-0 space-y-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-heritage-border pt-4">
              {footer}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
