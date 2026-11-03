import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { WizardShell } from "@/shared/ui/wizard";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { AutoCreateVault } from "@/features/vault-management/ui/AutoCreateVault";
import { OWNER_STEP_IDS, resolveOwnerSteps, type OwnerStepId } from "../model/resolveOwnerSteps";
import { ActivateStep } from "./steps/ActivateStep";
import { AssetsStep } from "./steps/AssetsStep";
import { DoneStep } from "./steps/DoneStep";
import { ExecutorStep } from "./steps/ExecutorStep";
import { IdentityStep } from "./steps/IdentityStep";
import { PackageStep } from "./steps/PackageStep";
import { RecipientsStep } from "./steps/RecipientsStep";
import { ServiceTierStep } from "./steps/ServiceTierStep";
import type { OwnerStepProps } from "./steps/stepTypes";

function isStepId(value: string | null): value is OwnerStepId {
  return value !== null && (OWNER_STEP_IDS as readonly string[]).includes(value);
}

function OwnerWizardBody({
  vault,
  serviceTierSlot,
}: {
  vault: VaultResponse;
  serviceTierSlot: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const assets = useVaultAssets(vault.id, { pageIndex: 1, pageSize: 1 });
  const beneficiaries = useBeneficiaries(vault.id, { pageIndex: 1, pageSize: 1 });
  const setupQuery = usePlanSetup(vault.id);
  const setup = setupQuery.data ?? null;

  let assetsCount: number | null = null;
  if (assets.data) assetsCount = assets.data.totalCount;
  let beneficiariesCount: number | null = null;
  if (beneficiaries.data) beneficiariesCount = beneficiaries.data.totalCount;

  const resolution = resolveOwnerSteps({ assetsCount, beneficiariesCount, setup });
  const requested = params.get("step");
  let activeId: string = resolution.currentId ?? "done";
  if (isStepId(requested)) activeId = requested;
  const activeIndex = resolution.steps.findIndex((step) => step.id === activeId);
  const active = resolution.steps[activeIndex];

  function select(id: string): void {
    const next = new URLSearchParams(params);
    next.set("step", id);
    next.delete("page");
    setParams(next);
  }

  const stepProps: OwnerStepProps = { vault, setup, onSelectStep: select };
  let body: ReactNode = null;
  if (activeId === "assets") body = <AssetsStep />;
  if (activeId === "identity") body = <IdentityStep />;
  if (activeId === "service-tier") body = <ServiceTierStep catalog={serviceTierSlot} />;
  if (activeId === "recipients") body = <RecipientsStep />;
  if (activeId === "package") body = <PackageStep {...stepProps} />;
  if (activeId === "executor") body = <ExecutorStep {...stepProps} />;
  if (activeId === "activate") body = <ActivateStep {...stepProps} />;
  if (activeId === "done") body = <DoneStep {...stepProps} />;

  const previous = resolution.steps[activeIndex - 1];
  const following = resolution.steps[activeIndex + 1];
  let nextLabel = "Để sau";
  let nextStyle = buttonStyles.outline;
  if (active.state === "done") {
    nextLabel = "Tiếp tục";
    nextStyle = buttonStyles.gold;
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

  return (
    <WizardShell
      roleLabel="Chủ kho"
      steps={resolution.steps}
      activeId={activeId}
      onSelectStep={select}
      exitHref={ROUTES.DASHBOARD.ROOT}
      title={active.title}
      description={active.hint}
      footer={footer}
    >
      {setupQuery.isError && (
        <Notice
          tone="warning"
          role="alert"
          title="Chưa kiểm tra được tiến độ kế hoạch"
          action={
            <Button
              variant="outline"
              disabled={setupQuery.isFetching}
              onClick={() => void setupQuery.refetch()}
            >
              Thử lại
            </Button>
          }
        >
          Các bước phụ thuộc máy chủ tạm thời chưa hiện là &quot;Xong&quot;. Kiểm tra mạng rồi bấm
          Thử lại.
        </Notice>
      )}
      {body}
    </WizardShell>
  );
}

/** Wizard Chủ kho: 7 bước + màn hoàn tất. Trạng thái bước chỉ lấy từ dữ liệu máy chủ. */
export function OwnerWizard({ serviceTierSlot }: { serviceTierSlot: ReactNode }) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const enabled = authenticated && Boolean(accessTokenMemory.get());
  const vault = useOwnerVault(enabled);
  if (!enabled) return <p role="status">Vui lòng đăng nhập để thiết lập kế hoạch.</p>;
  if (vault.isPending) {
    return (
      <p role="status" className="p-6 text-sm text-heritage-muted">
        Đang tải kho của bạn…
      </p>
    );
  }
  if (vault.isError) {
    if (isOwnerVaultMissing(vault.error)) {
      return (
        <div className="mx-auto max-w-xl p-6">
          <AutoCreateVault />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl p-6">
        <Notice
          tone="danger"
          role="alert"
          title="Chưa tải được kho của bạn"
          action={
            <Button disabled={vault.isFetching} onClick={() => void vault.refetch()}>
              Thử lại
            </Button>
          }
        >
          Kiểm tra mạng rồi bấm Thử lại.
        </Notice>
      </div>
    );
  }
  return (
    <OwnerWizardBody key={vault.data.id} vault={vault.data} serviceTierSlot={serviceTierSlot} />
  );
}
