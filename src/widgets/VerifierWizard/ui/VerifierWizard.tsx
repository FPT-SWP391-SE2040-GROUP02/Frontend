import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  VerifierCaseDetail,
  VerifierCaseList,
  VerifierReviewModals,
  useVerifierCase,
} from "@/features/verifier-review";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { WizardShell } from "@/shared/ui/wizard";
import {
  resolveVerifierSteps,
  VERIFIER_STEP_IDS,
  type VerifierStepId,
} from "../model/resolveVerifierSteps";

function isStepId(value: string | null): value is VerifierStepId {
  return value !== null && (VERIFIER_STEP_IDS as readonly string[]).includes(value);
}

/**
 * Wizard Người xét duyệt: 4 bước. Mốc "đã xem giấy tờ" và "đã đọc cảnh báo" chỉ lưu trên màn hình;
 * quyết định luôn do máy chủ chốt qua VerifierReviewModals.
 */
function VerifierWizardBody({ caseId }: { caseId: string | null }) {
  const [params, setParams] = useSearchParams();
  const [viewedDocuments, setViewedDocuments] = useState(false);
  const [readWarnings, setReadWarnings] = useState(false);
  const detail = useVerifierCase(caseId);
  let caseStatus: string | null = null;
  if (detail.data) caseStatus = detail.data.status;

  const resolution = resolveVerifierSteps({ caseId, caseStatus, viewedDocuments, readWarnings });
  const requested = params.get("step");
  let activeId: string = resolution.currentId ?? "decision";
  if (isStepId(requested)) activeId = requested;
  const activeIndex = resolution.steps.findIndex((step) => step.id === activeId);
  const active = resolution.steps[activeIndex];

  function select(id: string): void {
    const next = new URLSearchParams(params);
    next.set("step", id);
    setParams(next);
  }

  function pickCase(id: string): void {
    const next = new URLSearchParams();
    next.set("caseId", id);
    next.set("step", "documents");
    setParams(next);
  }

  let body = (
    <>
      <VerifierCaseDetail key={caseId} caseId={caseId ?? ""} />
      {detail.data && !detail.isError && (
        <VerifierReviewModals caseId={caseId ?? ""} detail={detail.data} />
      )}
    </>
  );
  if (activeId === "pick") {
    body = <VerifierCaseList scope="open" onSelect={pickCase} />;
  } else if (!caseId) {
    body = (
      <Notice tone="neutral" title="Chưa chọn hồ sơ">
        Quay lại bước đầu để chọn một hồ sơ trong hàng chờ.
      </Notice>
    );
  } else if (active.state === "blocked") {
    body = (
      <Notice tone="neutral" title="Hoàn thành bước trước đã">
        Bạn cần xem giấy tờ và đọc cảnh báo trước khi quyết định.
      </Notice>
    );
  }

  let checkpoint = null;
  if (activeId === "documents" && caseId && !viewedDocuments) {
    checkpoint = (
      <button
        type="button"
        className={buttonStyles.gold}
        onClick={() => {
          setViewedDocuments(true);
          select("warnings");
        }}
      >
        Tôi đã xem giấy tờ
      </button>
    );
  }
  if (activeId === "warnings" && viewedDocuments && !readWarnings) {
    checkpoint = (
      <button
        type="button"
        className={buttonStyles.gold}
        onClick={() => {
          setReadWarnings(true);
          select("decision");
        }}
      >
        Tôi đã đọc cảnh báo
      </button>
    );
  }
  const previous = resolution.steps[activeIndex - 1];
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
      {checkpoint}
    </>
  );

  return (
    <WizardShell
      roleLabel="Người xét duyệt"
      steps={resolution.steps}
      activeId={activeId}
      onSelectStep={select}
      exitHref={ROUTES.NOTARY.WORKSPACE}
      title={active.title}
      description={active.hint}
      footer={footer}
    >
      {detail.isError && (
        <Notice tone="warning" role="alert" title="Chưa tải được hồ sơ này">
          Bước quyết định tạm thời chưa mở. Quay lại bước đầu để chọn lại hồ sơ.
        </Notice>
      )}
      {body}
    </WizardShell>
  );
}

/** Mốc đã xem phải bắt đầu lại khi đổi hồ sơ, nên thân wizard được dựng lại theo caseId. */
export function VerifierWizard() {
  const [params] = useSearchParams();
  const caseId = params.get("caseId");
  return <VerifierWizardBody key={caseId ?? "none"} caseId={caseId} />;
}
