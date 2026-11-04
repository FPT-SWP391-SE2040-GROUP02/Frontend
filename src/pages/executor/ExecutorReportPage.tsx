import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { useActiveCaseId, useDeathCase } from "@/features/death-case/model/useDeathCase";
import { reportHeading } from "@/features/death-case/model/reportHeading";
import { ExecutorReport } from "@/features/death-case/ui/ExecutorReport";
import { Chip } from "@/shared/ui/heritageKit";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";

/** Báo tin: mở hồ sơ chứng tử, soạn nháp, gửi và nộp bản bổ sung. */
export function ExecutorReportPage() {
  const state = useSelectedExecutorVault();
  const caseId = useActiveCaseId(state.selected);
  const record = useDeathCase(caseId).data;
  const { objectionHours } = usePolicyWindows();
  const heading = reportHeading(caseId ? record : null, objectionHours);
  return (
    <ExecutorWorkspace
      title={heading.title}
      description={heading.description}
      badge={heading.badge && <Chip tone={heading.badge.tone}>{heading.badge.label}</Chip>}
    >
      <VaultGate state={state}>{(vault) => <ExecutorReport vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
