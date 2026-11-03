import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { ChoiceGroup } from "@/shared/ui/ChoiceGroup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { checkInStatusSchema, updateCheckInSettingsSchema } from "../model/checkIn.schema";
import { checkInService } from "../api/checkInService";

type Status = z.infer<typeof checkInStatusSchema>;
type SettingField = "cycleDays" | "graceDays";
const formSchema = z.object({
  cycleDays: z.enum(["30", "60", "90"]),
  graceDays: z.enum(["7", "14", "30"]),
});
const SETTINGS: ReadonlyArray<{
  field: SettingField;
  label: string;
  title: string;
  hint: string;
  options: readonly string[];
}> = [
  {
    field: "cycleDays",
    label: "Chu kỳ",
    title: "Chu kỳ điểm danh",
    hint: "Mỗi chu kỳ bạn cần điểm danh một lần.",
    options: ["30", "60", "90"],
  },
  {
    field: "graceDays",
    label: "Thời gian ân hạn",
    title: "Thời gian ân hạn",
    hint: "Nếu quá hạn, hệ thống nhắc bạn và người tin cậy trong thời gian ân hạn trước khi làm gì tiếp.",
    options: ["7", "14", "30"],
  },
];

const TILE_CLASS =
  "group flex aspect-square min-h-11 w-full flex-col justify-between rounded-2xl border border-heritage-border bg-heritage-surface p-4 text-left hover:border-heritage-gold-border hover:shadow-md aria-expanded:border-heritage-primary aria-expanded:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95";
const PENCIL_CLASS =
  "size-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200 group-hover:text-heritage-primary motion-safe:group-hover:rotate-12";

/**
 * Lịch điểm danh: hai ô vuông (chu kỳ, ân hạn); bấm một ô thì ô nhún xuống và hộp cấu hình nhỏ
 * hiện lên giữa màn hình để đổi giá trị đó.
 * Giữ etag đọc ban đầu; 409 phải tải lại, không ghi đè.
 * Khi đang có kỳ chạy, lịch mới áp dụng từ kỳ sau và không đổi hạn hiện tại.
 */
export function CheckInSettingsForm({ vaultId, status }: { vaultId: string; status: Status }) {
  const [etag] = useState(status.settings.etag);
  // `field` giữ nguyên khi đóng để hộp còn đủ nội dung trong lúc chạy hoạt ảnh đóng.
  const [field, setField] = useState<SettingField>("cycleDays");
  const [open, setOpen] = useState(false);
  const action = usePrivateAction();
  const client = useQueryClient();
  const formId = useId();
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
  const current: Record<SettingField, number> = {
    cycleDays: status.settings.cycleDays,
    graceDays: status.settings.graceDays,
  };
  const pending: Record<SettingField, number | null> = {
    cycleDays: status.settings.pendingCycleDays,
    graceDays: status.settings.pendingGraceDays,
  };
  const active = SETTINGS.find((setting) => setting.field === field) ?? SETTINGS[0];

  function sync(result: Status): void {
    client.setQueryData(["vault-check-in", vaultId], result);
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    setOpen(false);
  }

  function openEditor(next: SettingField): void {
    form.reset();
    setField(next);
    setOpen(true);
  }

  function closeEditor(): void {
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(2,minmax(0,9.5rem))] gap-3">
        {SETTINGS.map((setting) => {
          const waiting = pending[setting.field];
          let hint = "Bấm để đổi";
          if (waiting !== null) {
            hint = `Chờ áp dụng: ${waiting} ngày`;
          }
          return (
            <button
              key={setting.field}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open && field === setting.field}
              onClick={() => openEditor(setting.field)}
              className={TILE_CLASS}
            >
              <span className="flex items-start justify-between gap-2 text-xs text-heritage-muted">
                {setting.label}
                <Pencil className={PENCIL_CLASS} aria-hidden="true" />
              </span>
              <span className="text-2xl font-semibold text-heritage-primary">
                {current[setting.field]} ngày
              </span>
              <span className="text-xs text-heritage-muted">{hint}</span>
            </button>
          );
        })}
      </div>
      {action.succeeded && <p role="status">Máy chủ đã xác nhận yêu cầu.</p>}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !action.pending) closeEditor();
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-heritage-primary">
              {active.title}
            </DialogTitle>
            <DialogDescription>{active.hint}</DialogDescription>
          </DialogHeader>
          <form
            id={formId}
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
            <fieldset disabled={action.pending}>
              <Controller
                control={form.control}
                name={field}
                render={({ field: control }) => (
                  <ChoiceGroup
                    variant="segmented"
                    ariaLabel={active.title}
                    disabled={action.pending}
                    value={control.value}
                    onChange={control.onChange}
                    options={active.options.map((days) => ({
                      value: days,
                      label: `${days} ngày`,
                    }))}
                  />
                )}
              />
            </fieldset>
            <p className="text-xs leading-5 text-heritage-muted">
              Khi đang có kỳ chạy, lịch mới áp dụng từ kỳ sau; không đổi hạn hiện tại.
            </p>
            {action.pending && <p role="status">Đang gửi yêu cầu…</p>}
            {action.error && (
              <p role="alert" className="text-sm text-heritage-danger">
                {action.error}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={action.pending}
              onClick={closeEditor}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="dark"
              size="lg"
              disabled={action.pending}
              className="disabled:bg-heritage-neutral-bg disabled:text-heritage-muted disabled:opacity-100"
            >
              Lưu lịch điểm danh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
