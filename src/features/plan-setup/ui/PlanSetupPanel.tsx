import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { inviteExecutorSchema, type planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import type { VaultServiceData } from "@/entities/vault/model/vaultServicePresentation";
import { VaultServiceInfo } from "@/entities/vault/ui/VaultServiceInfo";

const missingLabels: Record<string, string> = {
  ACCOUNT_NOT_ACTIVE: "Tài khoản chưa hoạt động.",
  EMAIL_VERIFICATION_REQUIRED: "Cần xác minh email.",
  VAULT_NOT_OPEN: "Kho phải đang mở.",
  PAID_SERVICE_REQUIRED: "Cần gói trả phí còn hạn.",
  OWNER_EKYC_REQUIRED: "Chủ kho cần hoàn tất xác minh danh tính eKYC.",
  READY_CONTAINER_REQUIRED: "Cần ít nhất một gói có tài sản và người nhận hợp lệ.",
  PRIMARY_EXECUTOR_REQUIRED: "Cần Executor chính đã chấp nhận nhiệm vụ.",
  BACKUP_EXECUTOR_REQUIRED: "Executor chính là người nhận: cần dự phòng độc lập đã chấp nhận.",
  PLAN_NOT_DRAFT: "Kế hoạch đã rời trạng thái nháp.",
  NO_ASSET: "Gói chưa có tài sản.",
  NO_DESIGNATION: "Gói chưa có người nhận.",
};
const warningLabels: Record<string, string> = {
  NO_BACKUP_EXECUTOR:
    "Chưa có Executor dự phòng. Nếu Executor chính không thể thực hiện nhiệm vụ, kế hoạch có thể chậm trễ.",
};
const statuses = {
  INVITED: "Chờ phản hồi",
  ACCEPTED: "Đã chấp nhận",
  DECLINED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  REVOKED: "Đã thu hồi",
  SUSPENDED: "Cần chấp nhận lại",
};
/** Owner-scoped readiness; no auto-invite or activation, all confirmations default false. */
export function PlanSetupPanel({
  vaultId,
  beneficiaries = [],
  vaultService,
}: {
  vaultId: string;
  beneficiaries?: { id: string; label: string }[];
  vaultService?: VaultServiceData;
}) {
  const query = useQuery({
    queryKey: ["plan-setup", vaultId],
    queryFn: ({ signal }) => planSetupService.get(vaultId, signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang kiểm tra điều kiện kích hoạt…</p>;
  if (query.isError)
    return (
      <div role="alert">
        <p>Không tải được điều kiện kích hoạt.</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  return (
    <PlanSetupForm
      key={`${vaultId}:${query.data.configVersion}:${query.data.policyVersion}:${query.data.planStatus}`}
      vaultId={vaultId}
      setup={query.data}
      beneficiaries={beneficiaries}
      vaultService={vaultService}
    />
  );
}

function PlanSetupForm({
  vaultId,
  setup,
  beneficiaries,
  vaultService,
}: {
  vaultId: string;
  setup: z.infer<typeof planSetupSchema>;
  beneficiaries: { id: string; label: string }[];
  vaultService?: VaultServiceData;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [acknowledge, setAcknowledge] = useState(false);
  const form = useForm<z.infer<typeof inviteExecutorSchema>>({
    resolver: zodResolver(inviteExecutorSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "", role: "PRIMARY", beneficiaryId: null },
  });
  const sync = () => {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  };
  const draft = setup.planStatus === "DRAFT";
  return (
    <section
      className="space-y-6 rounded-xl border border-heritage-border bg-heritage-surface p-6"
      aria-label="Kích hoạt kế hoạch"
    >
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Kích hoạt kế hoạch</h2>
        {vaultService && vaultService.id === vaultId && (
          <div className="space-y-2 rounded-lg border border-heritage-border bg-heritage-canvas p-4">
            <h3 className="text-sm font-medium">Gói dịch vụ của kho</h3>
            <VaultServiceInfo service={vaultService} />
          </div>
        )}
        <p>
          {draft
            ? "Kế hoạch đang nháp; gói Sẵn sàng chưa tự kích hoạt lịch điểm danh."
            : `Trạng thái kế hoạch: ${setup.planStatus}`}
        </p>
        {draft && (
          <ul className="list-disc space-y-2 pl-6">
            {setup.missingRequirements.map((item) => (
              <li key={item}>
                {Object.hasOwn(missingLabels, item)
                  ? missingLabels[item]
                  : "Còn điều kiện cần kiểm tra với máy chủ."}
              </li>
            ))}
          </ul>
        )}
        {setup.missingRequirements.includes("OWNER_EKYC_REQUIRED") && (
          <Link className="inline-flex min-h-11 items-center underline" to={ROUTES.DASHBOARD.ROOT}>
            Đi xác minh danh tính
          </Link>
        )}
        {draft && setup.canActivate && (
          <p role="status">Đủ điều kiện hiện tại. Đọc cảnh báo trước khi kích hoạt.</p>
        )}
      </div>
      {setup.containers.length > 0 && (
        <div className="space-y-3 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Gói trong kho</h3>
          <ul className="divide-y divide-heritage-border rounded-lg border">
            {setup.containers.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
              >
                <span className="min-w-0 break-words font-medium">{c.name}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "READY"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.status === "READY" ? "Sẵn sàng bàn giao" : "Chưa đủ điều kiện"}
                  </span>
                  <span className="text-heritage-muted">
                    {c.assetCount} tài sản · {c.designationCount} người nhận
                  </span>
                  {c.missingRequirements.length > 0 && (
                    <span className="text-xs text-destructive">
                      {c.missingRequirements
                        .map((code) => missingLabels[code] ?? "Gói còn điều kiện cần kiểm tra.")
                        .join(" ")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {setup.containers.length === 0 && <p>Chưa có gói nào để bàn giao.</p>}
      {setup.assetsOutsideContainer.length > 0 && (
        <div className="space-y-3 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Tài sản chưa thuộc gói</h3>
          <p className="text-sm text-heritage-muted">
            Những tài sản này chưa được giao cho ai và sẽ không nằm trong phạm vi bàn giao.
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            {setup.assetsOutsideContainer.map((a) => (
              <li key={a.id} className="break-words">
                {a.name}{" "}
                <span className="text-heritage-muted">
                  ({a.kind === "FILE" ? "Tệp" : "Văn bản"})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {setup.assetsOutsideContainer.length === 0 && <p>Không có tài sản ngoài gói.</p>}
      {setup.warnings.length > 0 && (
        <div className="space-y-2 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Cảnh báo</h3>
          <ul className="list-disc space-y-1 pl-6 text-sm text-amber-800">
            {setup.warnings.map((w) => (
              <li key={w}>{Object.hasOwn(warningLabels, w) ? warningLabels[w] : w}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-4 border-t border-heritage-border pt-4">
        <h3 className="font-semibold">Executor của kho</h3>
        <p className="text-sm leading-6">{setup.executorScopeText}</p>
        {setup.executors.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-heritage-border p-4">
            <p>
              {item.role === "PRIMARY" ? "Executor chính" : "Executor dự phòng"}:{" "}
              {item.inviteeEmail} · {statuses[item.status]}
            </p>
            {item.status === "INVITED" && !item.invitationSentAt && (
              <p role="status" className="text-sm text-amber-800">
                Chưa xác nhận gửi được email. Cần cấu hình SMTP và bật gửi lời mời; người được mời
                chưa thể nhận nhiệm vụ từ email này.
              </p>
            )}
            {draft &&
              (["INVITED", "EXPIRED", "SUSPENDED"].includes(item.status) ||
                (item.status === "ACCEPTED" &&
                  item.acceptedScopeVersion !== setup.executorScopeVersion)) && (
                <Button
                  variant="outline"
                  disabled={action.pending}
                  onClick={() =>
                    void action.execute(
                      () => planSetupService.resend(vaultId, item.id, item.etag),
                      sync,
                    )
                  }
                >
                  Gửi lại lời mời
                </Button>
              )}
          </div>
        ))}
        {draft && (
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(async (values) => {
              if (await action.execute(() => planSetupService.invite(vaultId, values), sync))
                form.reset();
            })}
          >
            <fieldset disabled={action.pending} className="space-y-4">
              <label className="block space-y-2 text-sm">
                Email Executor
                <Input
                  type="email"
                  {...form.register("email")}
                  aria-invalid={Boolean(form.formState.errors.email)}
                />
              </label>
              {form.formState.errors.email && (
                <p role="alert">{form.formState.errors.email.message}</p>
              )}
              <label className="block space-y-2 text-sm">
                Vai trò Executor
                <select
                  {...form.register("role")}
                  className="block min-h-11 w-full rounded-lg border px-3"
                >
                  <option value="PRIMARY">Executor chính</option>
                  <option value="BACKUP">Executor dự phòng</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm">
                Executor cũng là người nhận?
                <select
                  className="block min-h-11 w-full rounded-lg border px-3"
                  {...form.register("beneficiaryId", {
                    setValueAs: (value: unknown) =>
                      typeof value === "string" ? value.trim() || null : null,
                  })}
                >
                  <option value="">Không phải người nhận trong kho</option>
                  {beneficiaries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              {form.formState.errors.beneficiaryId && (
                <p role="alert">Chọn ID hồ sơ người nhận hợp lệ thuộc kho.</p>
              )}
              <Button type="submit">Tạo lời mời Executor</Button>
            </fieldset>
          </form>
        )}
      </div>
      {draft && (
        <div className="space-y-4 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Thông tin trước khi kích hoạt</h3>
          <p className="text-sm leading-6">{setup.policyText}</p>
          <p className="text-xs text-heritage-muted">Phiên bản: {setup.policyVersion}</p>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={acknowledge}
              disabled={action.pending}
              onChange={(event) => setAcknowledge(event.target.checked)}
            />
            Tôi đã đọc cảnh báo về điểm danh, hạn phản hồi, tải và lưu/xóa dữ liệu; tôi chủ động
            kích hoạt kế hoạch này.
          </label>
          <Button
            disabled={!setup.canActivate || !acknowledge || action.pending}
            onClick={() =>
              void action.execute(
                () =>
                  planSetupService.activate(vaultId, {
                    configVersion: setup.configVersion,
                    policyVersion: setup.policyVersion,
                    acknowledgePolicy: acknowledge,
                  }),
                sync,
              )
            }
          >
            Kích hoạt kế hoạch
          </Button>
        </div>
      )}
      {action.pending && <p role="status">Đang gửi yêu cầu…</p>}
      {action.error && (
        <div role="alert" className="space-y-3 text-destructive">
          <p>{action.error}</p>
          <Button variant="outline" onClick={sync}>
            Tải lại điều kiện
          </Button>
        </div>
      )}
    </section>
  );
}
