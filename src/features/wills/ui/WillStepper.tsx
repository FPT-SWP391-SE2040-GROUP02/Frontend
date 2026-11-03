import React from "react";
import { Check } from "lucide-react";

/**
 * @file WillStepper.tsx
 * @description Thanh tiến trình Stepper 4 bước cho Digital Will Wizard (Áp dụng Hick's Law).
 * Tuân thủ WCAG 2.1 AA Touch Target (>= 44px) và Master UI Kit Heritage Forest & Champagne Gold.
 */

export interface StepItem {
  number: number;
  title: string;
  subtitle: string;
}

interface WillStepperProps {
  currentStep: number;
  steps: StepItem[];
  onStepClick?: (stepNumber: number) => void;
  canNavigateToStep?: (stepNumber: number) => boolean;
}

export const WillStepper: React.FC<WillStepperProps> = ({
  currentStep,
  steps,
  onStepClick,
  canNavigateToStep = () => true,
}) => {
  return (
    <nav aria-label="Tiến trình lập di chúc số" className="w-full">
      <ol className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isAccessible = canNavigateToStep(step.number);

          return (
            <li key={step.number} className="relative">
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick?.(step.number)}
                className={`w-full min-h-[56px] p-3.5 rounded-[18px] border text-left transition-all flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-heritage-gold focus-visible:outline-none ${
                  isCurrent
                    ? "bg-heritage-sidebar text-white border-heritage-sidebar shadow-md ring-1 ring-heritage-gold"
                    : isCompleted
                      ? "bg-heritage-surface text-heritage-text border-[#A2C4AF] hover:border-heritage-primary"
                      : "bg-heritage-surface/70 text-heritage-muted border-heritage-border opacity-75 cursor-not-allowed"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step indicator circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCurrent
                      ? "bg-heritage-gold text-heritage-primary"
                      : isCompleted
                        ? "bg-heritage-primary-light text-heritage-success"
                        : "bg-heritage-canvas text-heritage-muted"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>

                <div className="overflow-hidden">
                  <span
                    className={`text-[11px] uppercase tracking-wider font-bold block truncate ${
                      isCurrent ? "text-heritage-gold" : "text-heritage-muted"
                    }`}
                  >
                    Bước {step.number}
                  </span>
                  <span
                    className={`text-xs font-bold block truncate ${
                      isCurrent ? "text-white" : "text-heritage-text"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
