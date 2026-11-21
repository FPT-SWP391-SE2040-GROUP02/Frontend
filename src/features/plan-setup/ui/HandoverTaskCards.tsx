import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDate } from "@/shared/lib/dateFormat";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { planSetupService } from "../api/planSetupService";
import type { executorSchema, planSetupSchema } from "../model/planSetup.schema";
import { currentHolder } from "../lib/executorHolder";
import { handoverTaskElementId, type HandoverTaskId } from "../lib/handoverTasks";
import { InviteDialog, RevokeDialog } from "./ExecutorsSection";

type PlanSetup = z.infer<typeof planSetupSchema>;
type Executor = z.infer<typeof executorSchema>;

const PRIMARY_LINK = buttonStyles.gold;
const SECONDARY_LINK = buttonStyles.outline;

/** Thẻ một việc: dấu tích (xong) hoặc số thứ tự (chưa xong), tiêu đề, mô tả và nút thao tác. */
function TaskCard({
  task,
  order,
  done,
  title,
  flashing,
  children,
}: {
  task: HandoverTaskId;
  order: number;
  done: boolean;
  title: string;
  flashing: boolean;
  children: ReactNode;
}) {
  let mark: ReactNode = (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fdeceb] font-bold text-[#a32119]"
      aria-hidden="true"
    >
      {order}
    </span>
  );
  let doneText: ReactNode = null;
  if (done) {
    mark = (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3efe8] text-[#1f7a55]"
        aria-hidden="true"
      >
        <Check className="size-5" />
      </span>
    );
    doneText = <span className="sr-only"> (đã xong)</span>;
  }
  let ringStyle = "";
  if (flashing) {
    ringStyle = "ring-4 ring-heritage-gold";
  }
  return (
    <section
      id={handoverTaskElementId(task)}
      tabIndex={-1}
      aria-label={title}
      className={`flex scroll-mt-24 gap-3.5 rounded-2xl border border-heritage-border bg-heritage-surface p-5 shadow-sm outline-none transition-shadow duration-500 motion-reduce:transition-none ${ringStyle}`}
    >
      {mark}
      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] font-semibold leading-[1.3]">
          {title}
          {doneText}
        </h2>
        {children}
      </div>
    </section>
  );
}

const DESCRIPTION = "mt-1 text-sm leading-6 text-heritage-muted";

function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-2.5">{children}</div>;
}

type ExecutorDialog = "invite" | "revoke" | null;

/** Thẻ Người thực thi: nút Chọn, Gửi lại, Đổi người tùy trạng thái lời mời. Mọi kết quả do Backend quyết định. */
function ExecutorTask({
  vaultId,
  setup,
  done,
  readOnly,
  flashing,
}: {
  vaultId: string;
  setup: PlanSetup;
  done: boolean;
  readOnly: boolean;
  flashing: boolean;
}) {
  const client = useQueryClient();
  const resendAction = usePrivateAction();
  const [dialog, setDialog] = useState<ExecutorDialog>(null);
  const [notice, setNotice] = useState("");
  const holder: Executor | null = currentHolder(setup.executors);

  function sync(): void {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  }

  function resend(executor: Executor): void {
    setNotice("");
    void resendAction.execute(
      () => planSetupService.resend(vaultId, executor.id, executor.etag),
      (result) => {
        if (result.invitationSentAt) {
          setNotice(`Đã gửi lại lời mời tới ${result.inviteeEmail}.`);
        } else {
          setNotice(
            `Đã tạo lời mời mới cho ${result.inviteeEmail} nhưng chưa gửi được email. Hãy bấm Gửi lại lời mời.`,
          );
        }
        sync();
      },
    );
  }

  let description: ReactNode = (
    <p className={DESCRIPTION}>
      Chưa chọn. Người thực thi là người làm thủ tục sau khi bạn qua đời (không xem được nội dung
      kho).
    </p>
  );
  let actions: ReactNode;
  if (holder === null) {
    actions = (
      <button
        type="button"
        className={PRIMARY_LINK}
        disabled={resendAction.pending}
        onClick={() => setDialog("invite")}
      >
        Chọn Người thực thi
      </button>
    );
  } else {
    let who = holder.inviteeEmail;
    if (holder.fullName) {
      who = `${holder.fullName} (${holder.inviteeEmail})`;
    }
    if (holder.status === "ACCEPTED") {
      let acceptedText = "đã ký nhận vai.";
      if (holder.acceptedAt !== null) {
        acceptedText = `đã ký nhận vai ngày ${formatDate(holder.acceptedAt)}.`;
      }
      description = (
        <p className={DESCRIPTION}>
          {who} — {acceptedText}
        </p>
      );
    } else if (holder.status === "SUSPENDED") {
      description = (
        <p className={DESCRIPTION}>{who} — cần đồng ý lại. Bấm Gửi lại lời mời để họ xác nhận.</p>
      );
    } else {
      description = <p className={DESCRIPTION}>{who} — đã gửi lời mời, đang chờ họ ký nhận vai.</p>;
    }
    let resendButton: ReactNode = null;
    if (holder.status === "INVITED" || holder.status === "SUSPENDED") {
      resendButton = (
        <button
          type="button"
          className={SECONDARY_LINK}
          disabled={resendAction.pending}
          onClick={() => resend(holder)}
        >
          Gửi lại lời mời
        </button>
      );
    }
    actions = (
      <>
        {resendButton}
        <button
          type="button"
          className={SECONDARY_LINK}
          disabled={resendAction.pending}
          onClick={() => setDialog("revoke")}
        >
          Đổi người
        </button>
      </>
    );
  }
  if (readOnly) {
    actions = null;
  }

  let undeliverable: ReactNode = null;
  if (holder !== null && holder.emailUndeliverable) {
    undeliverable = (
      <p role="alert" className="mt-2 text-sm text-[#a32119]">
        Máy chủ thư báo không gửi được thư tới email này. Có thể email không tồn tại.
      </p>
    );
  }
  let pendingText: ReactNode = null;
  if (resendAction.pending) {
    pendingText = (
      <p role="status" className="mt-2 text-sm text-heritage-muted">
        Đang gửi lại lời mời…
      </p>
    );
  }
  let noticeText: ReactNode = null;
  if (notice !== "" && !resendAction.pending) {
    noticeText = (
      <p role="status" className="mt-2 text-sm text-[#1f7a55]">
        {notice}
      </p>
    );
  }
  let errorText: ReactNode = null;
  if (resendAction.error !== "") {
    errorText = (
      <p role="alert" className="mt-2 text-sm text-[#a32119]">
        {resendAction.error}
      </p>
    );
  }

  return (
    <TaskCard task="executor" order={2} done={done} title="Người thực thi" flashing={flashing}>
      {description}
      {undeliverable}
      {pendingText}
      {noticeText}
      {errorText}
      {actions !== null && <Actions>{actions}</Actions>}
      {dialog === "invite" && (
        <InviteDialog
          vaultId={vaultId}
          replacing={null}
          existingExecutors={setup.executors}
          sync={sync}
          onSuccess={(result) => setNotice(`Đã gửi lời mời tới ${result.inviteeEmail}.`)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "revoke" && holder !== null && (
        <RevokeDialog
          vaultId={vaultId}
          executor={holder}
          sync={sync}
          onClose={() => setDialog(null)}
        />
      )}
    </TaskCard>
  );
}

/** Tóm tắt các gói sẵn sàng: số gói, số tài sản, những người nhận (không ghi tên tài sản). */
function packagesSummary(setup: PlanSetup): string {
  let packageCount = 0;
  let assetCount = 0;
  for (const container of setup.containers) {
    if (container.status === "READY") {
      packageCount = packageCount + 1;
      assetCount = assetCount + container.assetCount;
    }
  }
  let summary = `${packageCount} gói · ${assetCount} tài sản`;
  if (setup.recipients !== undefined && setup.recipients.length > 0) {
    const names: string[] = [];
    for (const recipient of setup.recipients) {
      names.push(recipient.fullName);
    }
    summary = `${summary} · ${names.length} người nhận (${names.join(", ")})`;
  }
  return `${summary}.`;
}

function PackagesTask({
  setup,
  done,
  readOnly,
  flashing,
}: {
  setup: PlanSetup;
  done: boolean;
  readOnly: boolean;
  flashing: boolean;
}) {
  let description = "Cần ít nhất một gói có tài sản và người nhận hợp lệ.";
  if (done) {
    description = packagesSummary(setup);
  }
  const unassignedLinks: ReactNode[] = [];
  for (const container of setup.containers) {
    if (container.designationCount === 0) {
      unassignedLinks.push(
        <Link
          key={container.id}
          className={SECONDARY_LINK}
          to={ROUTES.DASHBOARD.GROUP_DETAIL(container.id)}
        >
          Chọn người nhận cho gói “{container.name}”
        </Link>,
      );
    }
  }
  let mainLink: ReactNode = (
    <Link className={SECONDARY_LINK} to={ROUTES.DASHBOARD.ASSETS}>
      Quản lý gói
    </Link>
  );
  if (!done) {
    mainLink = (
      <Link className={PRIMARY_LINK} to={ROUTES.DASHBOARD.ASSETS}>
        Tạo gói và chọn người nhận
      </Link>
    );
  }
  let outsideNote: ReactNode = null;
  if (setup.assetsOutsideContainer.length > 0) {
    outsideNote = (
      <p className={DESCRIPTION}>
        Còn {setup.assetsOutsideContainer.length} tài sản chưa nằm trong gói nào nên sẽ không được
        bàn giao.
      </p>
    );
  }
  return (
    <TaskCard
      task="packages"
      order={3}
      done={done}
      title="Gói tài sản và người nhận"
      flashing={flashing}
    >
      <p className={DESCRIPTION}>{description}</p>
      {outsideNote}
      {!readOnly && (
        <Actions>
          {mainLink}
          {unassignedLinks}
        </Actions>
      )}
    </TaskCard>
  );
}

/**
 * Cột trái của trang Bàn giao: bốn thẻ việc (eKYC, Người thực thi, Gói tài sản và người nhận, Gói dịch vụ). Trạng thái
 * xong hay chưa lấy từ `missingRequirements` của Backend. `readOnly` (kế hoạch đã chạy) chỉ hiện tóm tắt, không có nút.
 */
export function HandoverTaskCards({
  vaultId,
  setup,
  flashTask,
  readOnly,
}: {
  vaultId: string;
  setup: PlanSetup;
  flashTask: HandoverTaskId | null;
  readOnly: boolean;
}) {
  const missing = setup.missingRequirements;
  const ekycDone = !missing.includes("OWNER_EKYC_REQUIRED");
  const executorDone = !missing.includes("PRIMARY_EXECUTOR_REQUIRED");
  const packagesDone = !missing.includes("READY_CONTAINER_REQUIRED");
  const planDone = !missing.includes("PAID_SERVICE_REQUIRED");

  let ekycDescription = "Chủ kho cần hoàn tất xác minh danh tính eKYC.";
  if (ekycDone) {
    ekycDescription = "Đã xác minh. Tên trên file phân chia lấy từ hồ sơ này.";
  }
  let planDescription = "Cần gói trả phí còn hạn.";
  if (planDone) {
    planDescription = "Gói dịch vụ trả phí còn hạn.";
  }

  return (
    <div className="space-y-4">
      <TaskCard
        task="ekyc"
        order={1}
        done={ekycDone}
        title="Xác minh danh tính (eKYC)"
        flashing={flashTask === "ekyc"}
      >
        <p className={DESCRIPTION}>{ekycDescription}</p>
        {!ekycDone && !readOnly && (
          <Actions>
            <Link className={PRIMARY_LINK} to={ROUTES.DASHBOARD.IDENTITY}>
              Đi xác minh danh tính
            </Link>
          </Actions>
        )}
      </TaskCard>
      <ExecutorTask
        vaultId={vaultId}
        setup={setup}
        done={executorDone}
        readOnly={readOnly}
        flashing={flashTask === "executor"}
      />
      <PackagesTask
        setup={setup}
        done={packagesDone}
        readOnly={readOnly}
        flashing={flashTask === "packages"}
      />
      <TaskCard
        task="plan"
        order={4}
        done={planDone}
        title="Gói dịch vụ"
        flashing={flashTask === "plan"}
      >
        <p className={DESCRIPTION}>{planDescription}</p>
        {!planDone && !readOnly && (
          <Actions>
            <Link className={PRIMARY_LINK} to={ROUTES.BILLING.PLANS}>
              Xem gói dịch vụ
            </Link>
          </Actions>
        )}
      </TaskCard>
    </div>
  );
}
