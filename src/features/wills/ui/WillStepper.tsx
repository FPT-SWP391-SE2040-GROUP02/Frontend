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
                className={`w-full min-h-[56px] p-3.5 rounded-[18px] border text-left transition-all flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none ${
                  isCurrent
                    ? "bg-[#0B291E] text-white border-[#0B291E] shadow-md ring-1 ring-[#B88E4C]"
                    : isCompleted
                    ? "bg-[#FAF9F5] text-[#14241C] border-[#A2C4AF] hover:border-[#0B291E]"
                    : "bg-[#FAF9F5]/70 text-[#66786E] border-[#DCD9D0] opacity-75 cursor-not-allowed"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step indicator circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCurrent
                      ? "bg-[#B88E4C] text-[#0B291E]"
                      : isCompleted
                      ? "bg-[#E5EDE8] text-[#059669]"
                      : "bg-[#EFECE6] text-[#66786E]"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>

                <div className="overflow-hidden">
                  <span
                    className={`text-[11px] uppercase tracking-wider font-bold block truncate ${
                      isCurrent ? "text-[#B88E4C]" : "text-[#66786E]"
                    }`}
                  >
                    Bước {step.number}
                  </span>
                  <span
                    className={`text-xs font-bold block truncate ${
                      isCurrent ? "text-white" : "text-[#14241C]"
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
