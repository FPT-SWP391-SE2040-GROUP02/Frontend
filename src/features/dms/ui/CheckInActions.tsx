import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { checkInStatusSchema, updateCheckInSettingsSchema } from "../model/checkIn.schema";
import { checkInService } from "../api/checkInService";

type Status = z.infer<typeof checkInStatusSchema>;
const formSchema = z.object({
  cycleDays: z.enum(["30", "60", "90"]),
  graceDays: z.enum(["7", "14", "30"]),
});
/** POST/PATCH do người dùng chủ động; server sở hữu thời gian và quyền điểm danh. */
export function CheckInActions({ vaultId, status }: { vaultId: string; status: Status }) {
  const [etag] = useState(status.settings.etag);
  const action = usePrivateAction();
  const client = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      cycleDays: String(status.settings.pendingCycleDays ?? status.settings.cycleDays) as
        "30" | "60" | "90",
      graceDays: String(status.settings.pendingGraceDays ?? status.settings.graceDays) as
        "7" | "14" | "30",
    },
  });
  const sync = (result: Status) => {
    client.setQueryData(["vault-check-in", vaultId], result);
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  };
  return (
    <div className="space-y-6 border-t border-heritage-border pt-6">
      <div className="space-y-3">
        <Button
          disabled={
            action.pending ||
            !["ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"].includes(status.planStatus)
          }
          onClick={() => void action.execute(() => checkInService.checkIn(), sync)}
        >
          Tôi vẫn hoạt động — điểm danh
        </Button>
        <p className="text-xs leading-5 text-heritage-muted">
          Chỉ được xác nhận sau phản hồi máy chủ. Kế hoạch nháp hoặc đang bàn giao không thể điểm
          danh.
        </p>
      </div>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          action.execute(
            () =>
              checkInService.updateSettings(
                updateCheckInSettingsSchema.parse({
                  etag,
                  cycleDays: Number(values.cycleDays),
                  graceDays: Number(values.graceDays),
                }),
              ),
            sync,
          ),
        )}
      >
        <h3 className="font-semibold">Lịch điểm danh</h3>
        <fieldset disabled={action.pending} className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm">
            Chu kỳ
            <select
              {...form.register("cycleDays")}
              className="block min-h-11 w-full rounded-lg border border-heritage-border bg-heritage-surface px-3"
            >
              {[30, 60, 90].map((days) => (
                <option key={days} value={days}>
                  {days} ngày
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            Thời gian ân hạn
            <select
              {...form.register("graceDays")}
              className="block min-h-11 w-full rounded-lg border border-heritage-border bg-heritage-surface px-3"
            >
              {[7, 14, 30].map((days) => (
                <option key={days} value={days}>
                  {days} ngày
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="outline" className="min-h-11 sm:col-span-2">
            Lưu lịch điểm danh
          </Button>
        </fieldset>
        <p className="text-xs leading-5 text-heritage-muted">
          Khi đang có kỳ chạy, lịch mới áp dụng từ kỳ sau; không đổi hạn hiện tại.
        </p>
      </form>
      {status.settings.pendingCycleDays !== null && (
        <p className="text-sm">
          Chu kỳ chờ áp dụng: {status.settings.pendingCycleDays} ngày; ân hạn:{" "}
          {status.settings.pendingGraceDays ?? status.settings.graceDays} ngày.
        </p>
      )}
      {action.pending && <p role="status">Đang gửi yêu cầu…</p>}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && <p role="status">Máy chủ đã xác nhận yêu cầu.</p>}
    </div>
  );
}
