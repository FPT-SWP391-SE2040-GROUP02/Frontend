import { useSearchParams } from "react-router-dom";
import { useActiveCaseId, useDeathCase } from "@/features/death-case/model/useDeathCase";
import { useHandoverProgress } from "@/features/death-case/model/useHandoverProgress";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { currentStepIndex } from "@/features/death-case/model/progressSteps";
import { ExecutorPermissions } from "@/features/death-case/ui/ExecutorPermissions";
import { ExecutorProgress } from "@/features/death-case/ui/ExecutorProgress";
import { ExecutorReport } from "@/features/death-case/ui/ExecutorReport";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { WizardShell } from "@/shared/ui/wizard";
import {
  EXECUTOR_STEP_IDS,
  resolveExecutorSteps,
  type ExecutorStepId,
} from "../model/resolveExecutorSteps";

function isStepId(value: string | null): value is ExecutorStepId {
  return value !== null && (EXECUTOR_STEP_IDS as readonly string[]).includes(value);
}

/**
 * Wizard Người thực hiện: 4 bước. Trạng thái từ kho, hồ sơ và tiến độ máy chủ trả về;
 * form báo tin và bảng tiến trình là các component có sẵn.
 */
export function ExecutorWizard() {
  const [params, setParams] = useSearchParams();
  const state = useSelectedExecutorVault();
  const caseId = useActiveCaseId(state.selected);
  const record = useDeathCase(caseId);
  const progress = useHandoverProgress(caseId ?? "", Boolean(caseId));

  let vaultsCount: number | null = null;
  if (state.query.isSuccess) vaultsCount = state.vaults.length;
  let progressIndex: number | null = null;
  if (!caseId) progressIndex = -1;
  if (caseId && record.data && (progress.isSuccess || progress.isError)) {
    progressIndex = currentStepIndex(record.data, progress.data, new Date());
  }
  let caseStatus: string | null = null;
  if (record.data) caseStatus = record.data.status;

  const resolution = resolveExecutorSteps({
    vaultsCount,
    vault: state.selected,
    caseStatus,
    progressIndex,
  });
  const requested = params.get("step");
  let activeId: string = resolution.currentId ?? "progress";
  if (isStepId(requested)) activeId = requested;
  const activeIndex = resolution.steps.findIndex((step) => step.id === activeId);
  const active = resolution.steps[activeIndex];

  function select(id: string): void {
    const next = new URLSearchParams(params);
    next.set("step", id);
    setParams(next);
  }

  const previous = resolution.steps[activeIndex - 1];
  const following = resolution.steps[activeIndex + 1];
  let nextStyle = buttonStyles.outline;
  let nextLabel = "Để sau";
  if (active.state === "done") {
    nextStyle = buttonStyles.gold;
    nextLabel = "Tiếp tục";
  }
  const footer = (
    <>
      <div>
        {previous && (
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => select(previous.id)}
          >
            Quay lại
          </button>
        )}
      </div>
      {following && (
        <button type="button" className={nextStyle} onClick={() => select(following.id)}>
          {nextLabel}
        </button>
      )}
    </>
  );

  let body = <ExecutorPermissions vaults={state.vaults} selected={state.selected} />;
  if (state.query.isPending) {
    body = <p role="status">Đang tải các kho được phân công…</p>;
  }
  if (activeId === "waiting") {
    body = (
      <VaultGate state={state}>
        {(vault) => (
          <Panel title="Chưa có việc cần làm">
            <p className="text-sm leading-6 text-heritage-muted">
              Kho của {vault.ownerFullName} đang hoạt động bình thường. Bước báo tin chỉ mở khi Chủ
              kho quá hạn điểm danh và thời gian gia hạn kết thúc. Bạn không cần làm gì lúc này.
            </p>
          </Panel>
        )}
      </VaultGate>
    );
  }
  if (activeId === "report") {
    if (active.state === "blocked") {
      body = (
        <Notice tone="neutral" title="Chưa đến lúc báo tin">
          Bước này mở khi Chủ kho quá hạn điểm danh và hết thời gian gia hạn.
        </Notice>
      );
    } else {
      body = <VaultGate state={state}>{(vault) => <ExecutorReport vault={vault} />}</VaultGate>;
    }
  }
  if (activeId === "progress") {
    if (active.state === "blocked") {
      body = (
        <Notice tone="neutral" title="Chưa có hồ sơ để theo dõi">
          Sau khi bạn nộp hồ sơ báo tử, tiến trình sẽ hiện ở đây.
        </Notice>
      );
    } else {
      body = <VaultGate state={state}>{(vault) => <ExecutorProgress vault={vault} />}</VaultGate>;
    }
  }

  return (
    <WizardShell
      roleLabel="Người thực hiện"
      steps={resolution.steps}
      activeId={activeId}
      onSelectStep={select}
      exitHref={ROUTES.EXECUTOR.ROOT}
      title={active.title}
      description={active.hint}
      footer={footer}
    >
      {state.query.isError && (
        <Notice tone="warning" role="alert" title="Chưa kiểm tra được nhiệm vụ của bạn">
          Các bước tạm thời chưa hiện là &quot;Xong&quot;. Kiểm tra mạng rồi bấm Thử lại bên dưới.
        </Notice>
      )}
      {body}
    </WizardShell>
  );
}
