import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
} from "@/shared/ui";
import { APP_MESSAGES } from "@/shared/constants";
import { dmsConfigSchema, type DmsConfigFormInput } from "../model/dms.schema";
import type { DmsHeartbeatConfig } from "../model/dms.types";
import { useDmsStatus, useUpdateDmsConfig } from "../model/useDms";
import { DmsNotificationChannels } from "./DmsNotificationChannels";

/** @description Thuộc tính mở/đóng form cấu hình DMS. */
interface DmsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** @description Form được mount sau khi query hoàn tất; mỗi lần mở lấy cấu hình hiện tại. */
function DmsConfigForm({
  initialConfig,
  onClose,
}: {
  initialConfig: DmsHeartbeatConfig;
  onClose: () => void;
}) {
  const { mutate, isPending, isError } = useUpdateDmsConfig();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof dmsConfigSchema>, unknown, DmsConfigFormInput>({
    resolver: zodResolver(dmsConfigSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: initialConfig,
  });
  /** @description Gửi cấu hình hợp lệ qua mutation hiện có và đóng sau phản hồi thành công. */
  const onSubmit = (values: DmsConfigFormInput): void => {
    if (!isPending) mutate(values, { onSuccess: onClose });
  };
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <fieldset disabled={isPending} className="space-y-4">
        <label className="block space-y-2">
          Chu kỳ kiểm tra (ngày)
          <Input
            type="number"
            {...register("checkIntervalDays", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.checkIntervalDays)}
            aria-describedby="dms-interval-error"
          />
          <span id="dms-interval-error" role="alert">
            {errors.checkIntervalDays?.message}
          </span>
        </label>
        <label className="block space-y-2">
          Thời gian ân hạn (ngày)
          <Input
            type="number"
            {...register("gracePeriodDays", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.gracePeriodDays)}
            aria-describedby="dms-grace-error"
          />
          <span id="dms-grace-error" role="alert">
            {errors.gracePeriodDays?.message}
          </span>
        </label>
        <label className="block space-y-2">
          Tần suất nhắc nhở (ngày)
          <Input
            type="number"
            {...register("reminderFrequencyDays", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.reminderFrequencyDays)}
            aria-describedby="dms-reminder-error"
          />
          <span id="dms-reminder-error" role="alert">
            {errors.reminderFrequencyDays?.message}
          </span>
        </label>
        <Controller
          control={control}
          name="channels"
          render={({ field }) => (
            <DmsNotificationChannels
              channels={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <div role="alert">
          {errors.channels?.message}
          {initialConfig.channels.map((channel, index) => (
            <p key={channel.type}>{errors.channels?.[index]?.targetValue?.message}</p>
          ))}
        </div>
        <label className="flex gap-3 items-center min-h-11">
          <input type="checkbox" {...register("notifyExecutorOnGracePeriod")} />
          Thông báo cho người thực thi khi vào thời gian ân hạn
        </label>
      </fieldset>
      {isError && <p role="alert">{APP_MESSAGES.ERROR.DEFAULT}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={isPending}>
          Lưu cấu hình
        </Button>
      </div>
    </form>
  );
}

/** @description Phân biệt loading/error/empty trước khi lắp form; không giữ dữ liệu mẫu. */
export function DmsConfigModal({ isOpen, onClose }: DmsConfigModalProps) {
  const { data, isLoading, isError, refetch } = useDmsStatus(isOpen);
  if (!isOpen) return null;
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)]">
        <DialogHeader>
          <DialogTitle>Cấu hình nhịp sinh tồn</DialogTitle>
          <DialogDescription>Điều chỉnh chu kỳ và kênh thông báo.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p role="status">{APP_MESSAGES.UI.LOADING}</p>
        ) : isError ? (
          <div role="alert">
            <p>{APP_MESSAGES.ERROR.LOAD_FAILED}</p>
            <Button onClick={() => void refetch()}>{APP_MESSAGES.UI.RETRY}</Button>
          </div>
        ) : !data ? (
          <p role="status">{APP_MESSAGES.UI.EMPTY}</p>
        ) : (
          <DmsConfigForm initialConfig={data.config} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
