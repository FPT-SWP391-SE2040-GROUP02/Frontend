import { FileText, FileCheck, ShieldCheck } from "lucide-react";
import type { DeathCase } from "../model/deathCase.schema";

interface DeathCaseWizardStepsProps {
  record: DeathCase;
  isFormDirty: boolean;
}

/**
 * Thanh tiến trình 3 bước trực quan cho quy trình nộp hồ sơ chứng tử của Người thực thi (Executor).
 * Thể hiện rõ ràng các giai đoạn: Sự kiện tử -> Giấy tờ minh chứng -> Cam kết pháp lý & Nộp.
 */
export function DeathCaseWizardSteps({ record, isFormDirty }: DeathCaseWizardStepsProps) {
  const version = record.currentVersion;
  const missingInfo = record.missingRequirements.filter((item) => item !== "FILES");
  const missingFiles = record.missingRequirements.includes("FILES");
  const hasFiles = version.files.length > 0;
  const isSubmitted = !version.isDraft;

  // Xác định trạng thái của từng bước
  const step1Complete = missingInfo.length === 0 && !isFormDirty;
  const step2Complete = hasFiles && !missingFiles;
  const step3Complete = isSubmitted;

  const steps = [
    {
      no: 1,
      title: "Sự kiện tử",
      desc: "Họ tên, CCCD, ngày & nơi mất",
      icon: FileText,
      complete: step1Complete,
      active: !step1Complete,
    },
    {
      no: 2,
      title: "Hồ sơ & Giấy tờ",
      desc: `${version.files.length} tệp đã tải (CCCD, trích lục)`,
      icon: FileCheck,
      complete: step2Complete,
      active: step1Complete && !step2Complete,
    },
    {
      no: 3,
      title: "Cam kết & Ký nộp",
      desc: isSubmitted ? "Đã gửi Người xét duyệt" : "Xác nhận pháp lý & nộp",
      icon: ShieldCheck,
      complete: step3Complete,
      active: step1Complete && step2Complete && !step3Complete,
    },
  ];

  return (
    <nav
      aria-label="Tiến trình nộp hồ sơ báo tử"
      className="mb-6 rounded-2xl border border-heritage-border bg-heritage-surface p-4 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.no}
              className={`relative flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
                step.complete
                  ? "border-[#1f7a55]/30 bg-[#e1f2e9]/50 text-[#1f7a55] dark:border-[#62d2a2]/40 dark:bg-[#10382a]/30 dark:text-[#62d2a2]"
                  : step.active
                    ? "border-[#b88e4c]/50 bg-[#fbf3e0]/60 text-[#7a5a22] shadow-sm dark:border-[#e2c17d]/40 dark:bg-[#1d2c1d]/40 dark:text-[#e2c17d]"
                    : "border-heritage-border/60 bg-white/40 text-heritage-muted dark:bg-black/10"
              }`}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-semibold text-xs shadow-xs ${
                  step.complete
                    ? "bg-[#1f7a55] text-white dark:bg-[#62d2a2] dark:text-[#0a281e]"
                    : step.active
                      ? "bg-[#b88e4c] text-white dark:bg-[#e2c17d] dark:text-[#0a281e]"
                      : "bg-heritage-border text-heritage-muted"
                }`}
              >
                {step.no}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{step.title}</span>
                </div>
                <p className="mt-0.5 truncate text-xs opacity-90">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
