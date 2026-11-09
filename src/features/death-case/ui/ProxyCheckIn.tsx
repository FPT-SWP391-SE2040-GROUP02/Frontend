import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import { deathCaseService } from "../api/deathCaseService";
import {
  nowForDateTimeInput,
  PROXY_CONTACT_METHODS,
  proxyCheckInFormSchema,
  toProxyCheckInRequest,
  type ProxyCheckInFormValues,
} from "../model/proxyCheckIn.schema";
import { executorVaultsKey } from "../model/useExecutorVaults";

const selectClass =
  "h-9 w-full min-w-0 rounded-[8px] border border-[#D5D0C3] bg-[var(--surface)] px-3 text-xs text-[var(--text-main)] outline-none focus-visible:border-[var(--gold)] focus-visible:ring-3 focus-visible:ring-[var(--gold)]/20";

/**
 * Nút điểm danh thay chủ kho. Chỉ đặt khi chủ kho quá hạn và kho chưa có hồ sơ chứng tử đang mở.
 * Điểm danh thay mở cả một kỳ mới, không hoàn tác được và có giới hạn số lần liên tiếp, nên phải khai đã liên lạc
 * với ai, lúc nào, cách nào rồi xác nhận. Không optimistic: chờ Backend xác nhận rồi tải lại danh sách kho,
 * khi đó kho hết quá hạn và nút tự ẩn. `left` là số lượt còn lại Backend trả; 0 thì khóa nút.
 */
export function ProxyCheckIn({ vaultId, left }: { vaultId: string; left?: number | null }) {
  const [confirming, setConfirming] = useState(false);
  const client = useQueryClient();
  const action = usePrivateAction();
  const form = useForm<ProxyCheckInFormValues>({
    resolver: zodResolver(proxyCheckInFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      contactedWho: "",
      contactedAt: nowForDateTimeInput(),
      contactMethod: "PHONE",
    },
  });
  const errors = form.formState.errors;
  const outOfTurns = left === 0;

  const open = () => {
    action.reset();
    form.reset({
      contactedWho: "",
      contactedAt: nowForDateTimeInput(),
      contactMethod: "PHONE",
    });
    setConfirming(true);
  };
  const submit = form.handleSubmit((values) => {
    void action.execute(
      () => deathCaseService.checkInForOwner(vaultId, toProxyCheckInRequest(values)),
      () => {
        setConfirming(false);
        void client.invalidateQueries({ queryKey: executorVaultsKey });
      },
    );
  });

  return (
    <div className="space-y-1">
      <button type="button" className={buttonStyles.outline} disabled={outOfTurns} onClick={open}>
        Điểm danh thay chủ kho
      </button>
      {outOfTurns ? (
        <p className="text-xs text-heritage-muted">
          Hết lượt điểm danh thay liên tiếp. Chỉ còn cách nộp giấy chứng tử.
        </p>
      ) : (
        <p className="text-xs text-heritage-muted">
          Điểm danh hộ Chủ kho cho đến khi có giấy chứng tử.
        </p>
      )}
      {confirming && (
        <Dialog open onOpenChange={(next) => !next && !action.pending && setConfirming(false)}>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={submit} noValidate className="space-y-4">
              <DialogHeader>
                <DialogTitle>Điểm danh thay chủ kho?</DialogTitle>
                <DialogDescription>
                  Kỳ điểm danh đang quá hạn sẽ đóng lại và một kỳ mới bắt đầu theo chu kỳ của Chủ
                  kho. Thao tác này không hoàn tác được và chỉ làm được một số lần liên tiếp. Chỉ
                  dùng khi bạn đã liên lạc được và Chủ kho vẫn ổn, hoặc đang chờ giấy chứng tử.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1">
                <label htmlFor="proxy-who" className="text-sm font-semibold">
                  Đã liên lạc với ai
                </label>
                <Input
                  id="proxy-who"
                  autoComplete="off"
                  placeholder="Ví dụ chính Chủ kho, hoặc chị Lan (vợ)"
                  aria-invalid={Boolean(errors.contactedWho)}
                  aria-describedby={errors.contactedWho ? "proxy-who-error" : undefined}
                  {...form.register("contactedWho")}
                />
                {errors.contactedWho && (
                  <p id="proxy-who-error" role="alert" className="text-sm text-destructive">
                    {errors.contactedWho.message}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="proxy-when" className="text-sm font-semibold">
                    Lúc nào
                  </label>
                  <Input
                    id="proxy-when"
                    type="datetime-local"
                    aria-invalid={Boolean(errors.contactedAt)}
                    aria-describedby={errors.contactedAt ? "proxy-when-error" : undefined}
                    {...form.register("contactedAt")}
                  />
                  {errors.contactedAt && (
                    <p id="proxy-when-error" role="alert" className="text-sm text-destructive">
                      {errors.contactedAt.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="proxy-how" className="text-sm font-semibold">
                    Cách nào
                  </label>
                  <select
                    id="proxy-how"
                    className={selectClass}
                    {...form.register("contactMethod")}
                  >
                    {PROXY_CONTACT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-heritage-muted">
                Chủ kho sẽ thấy lần điểm danh này trong nhật ký kho, ghi là do Người thực thi thực
                hiện và cách liên lạc.
              </p>
              {action.error && (
                <p role="alert" className="text-sm text-destructive">
                  {action.error}
                </p>
              )}
              <DialogFooter>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  disabled={action.pending}
                  onClick={() => setConfirming(false)}
                >
                  Hủy
                </button>
                <button type="submit" className={buttonStyles.gold} disabled={action.pending}>
                  {action.pending ? "Đang điểm danh…" : "Xác nhận điểm danh thay"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
