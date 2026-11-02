import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { handoverService } from "@/features/handover/api/handoverService";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { WizardShell } from "@/shared/ui/wizard";
import {
  RECIPIENT_STEP_IDS,
  resolveRecipientSteps,
  type RecipientStepId,
} from "../model/resolveRecipientSteps";

function isStepId(value: string | null): value is RecipientStepId {
  return value !== null && (RECIPIENT_STEP_IDS as readonly string[]).includes(value);
}

/**
 * Wizard Người nhận: 4 bước. Trạng thái lấy từ các lượt bàn giao máy chủ trả về;
 * các thao tác thật (xác minh, đồng ý/từ chối, tải) vẫn do HandoverPortal đảm nhiệm.
 */
export function RecipientWizard() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ["handover", "turns"],
    queryFn: ({ signal }) => handoverService.list(signal),
    retry: false,
  });
  let statuses: string[] | null = null;
  if (query.data) statuses = query.data.map((turn) => turn.status);
  const resolution = resolveRecipientSteps({ turnStatuses: statuses });
  const requested = params.get("step");
  let activeId: string = resolution.currentId ?? "download";
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

  let body = <HandoverPortal />;
  if (activeId === "invitation") {
    body = (
      <div className="space-y-6">
        <Panel title="Ai để lại gì cho bạn?">
          <p className="text-sm leading-6 text-heritage-muted">
            Một người đã chọn bạn làm người nhận. Bạn chỉ xem được nội dung sau khi xác minh danh
            tính và đồng ý nhận. Dưới đây là các lời mời gửi cho tài khoản này.
          </p>
        </Panel>
        <HandoverPortal />
      </div>
    );
  }
  if (query.isError) {
    body = (
      <Notice tone="danger" role="alert" title="Chưa tải được lời mời của bạn">
        Kiểm tra mạng rồi bấm &quot;Tải lại lượt bàn giao&quot; ở phía dưới.
        <div className="mt-4">
          <HandoverPortal />
        </div>
      </Notice>
    );
  }

  return (
    <WizardShell
      roleLabel="Người nhận"
      steps={resolution.steps}
      activeId={activeId}
      onSelectStep={select}
      exitHref={ROUTES.BENEFICIARY.CLAIM}
      title={active.title}
      description={active.hint}
      footer={footer}
    >
      {body}
    </WizardShell>
  );
}
