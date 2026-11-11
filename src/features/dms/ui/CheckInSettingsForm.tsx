import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { getVaultLockReason } from "@/entities/vault/model/vaultLock";
import { Button } from "@/shared/ui/button";
import { checkInStatusSchema, updateCheckInSettingsSchema } from "../model/checkIn.schema";
import { checkInService } from "../api/checkInService";

type Status = z.infer<typeof checkInStatusSchema>;
const formSchema = z.object({
  cycleDays: z.enum(["30", "60", "90"]),
});
const CYCLE_OPTIONS = [30, 60, 90];
const SELECT_CLASS =
  "block min-h-11 w-full rounded-lg border border-heritage-border bg-heritage-surface px-3";

/**
 * Lịch điểm danh: chủ kho chỉ chọn chu kỳ. Số thư nhắc trễ và khoảng cách giữa các thư do Admin đặt nên chỉ hiện để xem.
 * Giữ etag đọc ban đầu; 409 phải tải lại, không ghi đè.
 * Khi đang có kỳ chạy, lịch mới áp dụng từ kỳ sau và không đổi hạn hiện tại.
 */
export function CheckInSettingsForm({ vaultId, status }: { vaultId: string; status: Status }) {
  const [etag] = useState(status.settings.etag);
  // Kế hoạch đã sang hồ sơ chứng tử/bàn giao: khóa lịch (BE từ chối đổi cấu hình từ trạng thái này).
  const lockReason = getVaultLockReason({ status: "OPEN", planStatus: status.planStatus });
  const action = usePrivateAction();
  const client = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      cycleDays: String(status.settings.pendingCycleDays ?? status.settings.cycleDays) as
        "30" | "60" | "90",
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
                }),
              ),
            sync,
          ),
        )}
      >
        <fieldset disabled={action.pending || lockReason !== null} className="space-y-4">
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
        <p className="text-xs leading-5 text-heritage-muted">
          Quá hạn, hệ thống gửi tối đa {status.settings.maxLateReminders} thư nhắc trễ, cách nhau{" "}
          {status.settings.lateReminderGapDays} ngày. Sau thư cuối mà bạn vẫn chưa điểm danh, Người
          thực thi sẽ được báo để liên hệ kiểm tra.
        </p>
      </form>
      {status.settings.pendingCycleDays !== null && (
        <p className="text-sm">Chu kỳ chờ áp dụng: {status.settings.pendingCycleDays} ngày.</p>
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
