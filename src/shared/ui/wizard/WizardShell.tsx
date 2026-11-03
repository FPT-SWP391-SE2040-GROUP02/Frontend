import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LegacyVaultMark } from "../LegacyVaultArtwork";
import { Chip, Panel, type Tone } from "../heritageKit";
import { STEP_STATE_LABEL, Stepper } from "../Stepper";
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

const STATE_TONE: Record<WizardStepState, Tone> = {
  done: "success",
  current: "warning",
  todo: "neutral",
  blocked: "danger",
  unknown: "neutral",
};

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
          <Stepper
            steps={steps.map((step) => ({ id: step.id, label: step.title, state: step.state }))}
            ariaLabel="Danh sách các bước"
            orientation="vertical"
            activeId={activeId}
            onSelect={onSelectStep}
          />
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
                <Chip tone={STATE_TONE[activeStep.state]}>
                  {STEP_STATE_LABEL[activeStep.state]}
                </Chip>
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
