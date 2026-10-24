import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { History, ScanFace } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { devToolsService } from "../api/devToolsService";
import {
  CHECK_IN_STATE_LABELS,
  CLOCK_STATE_LABELS,
  DEV_MILESTONES,
  DEV_TOOLS_FOOTNOTE,
  DEV_TOOLS_NOTICE,
  EKYC_RESET_DESCRIPTION,
  RESET_DONE,
  ekycResetDone,
  planStatusLabel,
} from "../model/devTools.content";
import {
  devClockSchema,
  devEkycResetSchema,
  type DevClock,
  type DevMilestone,
} from "../model/devTools.schema";
import { adminKeys } from "../model/useAdmin";
import { devToolsKeys, useDevClock, useDevVaults } from "../model/useDevTools";
import { AdminActionDialog } from "./AdminActionDialog";
import { AdminErrorMessage } from "./AdminStateMessage";

type PendingDialog =
  { kind: "travel"; milestone: DevMilestone } | { kind: "reset" } | { kind: "ekyc" } | null;

/**
 * Công cụ thử nghiệm (chỉ Development): chọn một kho thử rồi tua tới từng mốc của luồng điểm danh,
 * chứng tử và báo còn sống. Mọi thay đổi do Backend quyết định; màn hình chỉ hiện kết quả máy chủ trả về.
 */
export function AdminDevTools() {
  const [params, setParams] = useSearchParams();
  const vaultId = params.get("vault") ?? "";
  const vaults = useDevVaults();
  const clock = useDevClock(vaultId);
  const client = useQueryClient();
  const [dialog, setDialog] = useState<PendingDialog>(null);
  const [done, setDone] = useState("");

  function selectVault(nextId: string) {
    setDone("");
    const next = new URLSearchParams(params);
    if (nextId) next.set("vault", nextId);
    else next.delete("vault");
    setParams(next, { replace: true });
  }

  function publish(result: unknown, message: string) {
    const parsed = devClockSchema.safeParse(result);
    if (parsed.success) client.setQueryData(devToolsKeys.clock(parsed.data.vaultId), parsed.data);
    // Tua đổi trạng thái kế hoạch và có thể mở sự cố: làm mới danh sách kho và dữ liệu quản trị.
    void client.invalidateQueries({ queryKey: adminKeys.all });
    setDone(message);
  }

  const selected = vaults.data?.find((item) => item.vaultId === vaultId);
  const vaultLabel = selected ? `${selected.vaultName} (${selected.ownerName})` : "Hồ sơ đã chọn";

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Notice tone="warning">{DEV_TOOLS_NOTICE}</Notice>
        <span className="rounded-md bg-[#7A5B25] px-3 py-1 text-xs font-bold tracking-wide text-white">
          DEVELOPMENT
        </span>
      </div>

      {done && (
        <Notice tone="success" role="status">
          {done}
        </Notice>
      )}

      <Panel title="Hồ sơ cần tua" labelledBy="dev-tools-vault">
        {vaults.isPending && <Skeleton className="h-11 rounded-xl" />}
        {vaults.isError && (
          <AdminErrorMessage
            error={vaults.error}
            onRetry={() => void vaults.refetch()}
            retrying={vaults.isFetching}
          />
        )}
        {vaults.isSuccess && vaults.data.length === 0 && (
          <p className="text-sm text-heritage-muted">
            Chưa có kho nào. Tạo kho và kích hoạt kế hoạch bằng tài khoản Chủ kho trước.
          </p>
        )}
        {vaults.isSuccess && vaults.data.length > 0 && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold" htmlFor="dev-tools-vault-select">
              Chọn hồ sơ thử
            </label>
            <select
              id="dev-tools-vault-select"
              value={vaultId}
              onChange={(event) => selectVault(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-heritage-border bg-white px-4 text-sm"
            >
              <option value="">— Chọn một kho —</option>
              {vaults.data.map((item) => (
                <option key={item.vaultId} value={item.vaultId}>
                  {item.vaultName} · {item.ownerName} · {planStatusLabel(item.planStatus)}
                </option>
              ))}
            </select>
            {clock.isSuccess && (
              <ClockSummary data={clock.data} onReset={() => setDialog({ kind: "reset" })} />
            )}
          </div>
        )}
      </Panel>

      {vaultId && (
        <Panel title="Các mốc có thể tua" labelledBy="dev-tools-milestones">
          {clock.isPending && <Skeleton className="h-40 rounded-xl" />}
          {clock.isError && (
            <AdminErrorMessage
              error={clock.error}
              onRetry={() => void clock.refetch()}
              retrying={clock.isFetching}
            />
          )}
          {clock.isSuccess && (
            <ol className="divide-y divide-heritage-border">
              {clock.data.milestones.map((milestone, index) => (
                <MilestoneRow
                  key={milestone.key}
                  index={index + 1}
                  milestone={milestone}
                  busy={clock.isFetching}
                  onTravel={() => setDialog({ kind: "travel", milestone })}
                />
              ))}
            </ol>
          )}
          <p className="mt-4 text-sm text-heritage-muted">{DEV_TOOLS_FOOTNOTE}</p>
        </Panel>
      )}

      <Panel title="Đặt lại eKYC" labelledBy="dev-tools-ekyc">
        <p className="text-sm text-heritage-muted">{EKYC_RESET_DESCRIPTION}</p>
        <button
          type="button"
          className={`${buttonStyles.outline} mt-4`}
          onClick={() => {
            setDone("");
            setDialog({ kind: "ekyc" });
          }}
        >
          <ScanFace className="size-4" aria-hidden="true" />
          Đặt lại eKYC của một tài khoản
        </button>
      </Panel>

      {dialog?.kind === "travel" && (
        <AdminActionDialog
          title={`Tua tới “${DEV_MILESTONES[dialog.milestone.key].title}”?`}
          description={`${vaultLabel} sẽ ${DEV_MILESTONES[dialog.milestone.key].effect}. Thao tác thay đổi dữ liệu của hồ sơ thử và không hoàn tác được. Chỉ dùng trên môi trường Development.`}
          submitLabel="Tua tới mốc này"
          fields={[]}
          defaultValues={{}}
          confirmLabel="Tôi hiểu đây là dữ liệu thử."
          submit={() => devToolsService.timeTravel(vaultId, { milestone: dialog.milestone.key })}
          onClose={() => setDialog(null)}
          onDone={(result) => publish(result, DEV_MILESTONES[dialog.milestone.key].done)}
        />
      )}
      {dialog?.kind === "reset" && (
        <AdminActionDialog
          title="Về thời gian hiện tại?"
          description={`Đồng hồ của ${vaultLabel} sẽ trở về thời gian thực. Trạng thái đã phát sinh khi tua, như sự cố đã mở, được giữ nguyên. Chỉ dùng trên môi trường Development.`}
          submitLabel="Về thời gian hiện tại"
          fields={[]}
          defaultValues={{}}
          submit={() => devToolsService.resetClock(vaultId)}
          onClose={() => setDialog(null)}
          onDone={(result) => publish(result, RESET_DONE)}
        />
      )}
      {dialog?.kind === "ekyc" && (
        <AdminActionDialog
          title="Đặt lại eKYC?"
          description="Toàn bộ dữ liệu eKYC của tài khoản sẽ bị xóa và không hoàn tác được. Chủ kho phải làm lại eKYC trước khi mua gói mới hoặc kích hoạt kế hoạch. Chỉ dùng trên môi trường Development."
          submitLabel="Đặt lại eKYC"
          fields={[{ name: "email", label: "Email tài khoản", kind: "text", maxLength: 256 }]}
          defaultValues={{ email: "" }}
          confirmLabel="Tôi hiểu đây là dữ liệu thử."
          submit={(values) => devToolsService.resetEkyc({ email: values.email })}
          onClose={() => setDialog(null)}
          onDone={(result) => {
            const parsed = devEkycResetSchema.safeParse(result);
            if (parsed.success) setDone(ekycResetDone(parsed.data));
          }}
        />
      )}
    </div>
  );
}

function ClockSummary({ data, onReset }: { data: DevClock; onReset: () => void }) {
  const shifted = data.clockState === "SHIFTED";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Chip tone="success">Kế hoạch: {planStatusLabel(data.planStatus)}</Chip>
        <Chip tone={data.checkInState === "OVERDUE" ? "warning" : "neutral"}>
          Điểm danh: {CHECK_IN_STATE_LABELS[data.checkInState]}
        </Chip>
        <Chip tone={shifted ? "neutral" : "success"}>
          Đồng hồ: {CLOCK_STATE_LABELS[data.clockState]}
        </Chip>
      </div>
      <button type="button" className={buttonStyles.outline} disabled={!shifted} onClick={onReset}>
        <History className="size-4" aria-hidden="true" />
        Về thời gian hiện tại
      </button>
    </div>
  );
}

function MilestoneRow({
  index,
  milestone,
  busy,
  onTravel,
}: {
  index: number;
  milestone: DevMilestone;
  busy: boolean;
  onTravel: () => void;
}) {
  const content = DEV_MILESTONES[milestone.key];
  const passed = milestone.state === "PASSED";
  const available = milestone.state === "AVAILABLE";
  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
          passed
            ? "border-[#1F5A45] bg-[#1F5A45] text-white"
            : "border-heritage-border text-heritage-text"
        }`}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-heritage-text">{content.title}</p>
        <p className="text-sm text-heritage-muted">
          {content.description}{" "}
          {content.code && (
            <code className="rounded bg-[#ECE8DB] px-1.5 py-0.5 text-xs">{content.code}</code>
          )}
        </p>
        {milestone.state === "NOT_APPLICABLE" && milestone.note && (
          <p className="mt-1 text-xs text-heritage-muted">{milestone.note}</p>
        )}
      </div>
      <Chip tone={passed ? "success" : "neutral"}>
        {passed ? "Đã tua" : available ? "Chưa tua" : "Chưa áp dụng"}
      </Chip>
      <button
        type="button"
        className={passed ? buttonStyles.outline : buttonStyles.gold}
        disabled={!available || busy}
        onClick={onTravel}
      >
        {passed ? "Đã qua mốc này" : "Tua tới mốc này"}
      </button>
    </li>
  );
}
