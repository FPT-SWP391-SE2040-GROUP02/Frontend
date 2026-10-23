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
const CYCLE_OPTIONS = [30, 60, 90];
const GRACE_OPTIONS = [7, 14, 30];
const SELECT_CLASS =
  "block min-h-11 w-full rounded-lg border border-heritage-border bg-heritage-surface px-3";

/**
 * Lịch điểm danh: chu kỳ và thời gian ân hạn. Giữ etag đọc ban đầu; 409 phải tải lại, không ghi đè.
 * Khi đang có kỳ chạy, lịch mới áp dụng từ kỳ sau và không đổi hạn hiện tại.
 */
export function CheckInSettingsForm({ vaultId, status }: { vaultId: string; status: Status }) {
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

  function sync(result: Status): void {
    client.setQueryData(["vault-check-in", vaultId], result);
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  }

  return (
    <div className="space-y-4">
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
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="block space-y-2 text-sm">
            Chu kỳ
            <select {...form.register("cycleDays")} className={SELECT_CLASS}>
              {CYCLE_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} ngày
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            Thời gian ân hạn
            <select {...form.register("graceDays")} className={SELECT_CLASS}>
              {GRACE_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} ngày
                </option>
              ))}
            </select>
          </label>
          <Button
            type="submit"
            size="lg"
            className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
          >
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
