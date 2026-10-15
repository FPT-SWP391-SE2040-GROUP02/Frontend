import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { beneficiaryService } from "../api/beneficiaryService";
import { beneficiaryResponseSchema, createBeneficiarySchema } from "../model/beneficiary.schema";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;
const formSchema = createBeneficiarySchema
  .omit({ citizenId: true })
  .extend({ citizenId: z.string().max(32) });
/** CCCD đầy đủ chỉ ở form RAM; sửa giữ etag ban đầu và không cho thay CCCD. */
export function BeneficiaryForm({ vaultId, record }: { vaultId: string; record?: Beneficiary }) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const [etag, setEtag] = useState(record?.etag);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      citizenId: "",
      fullName: record?.fullName ?? "",
      dateOfBirth: record?.dateOfBirth ?? "",
      email: record?.email ?? "",
      phone: record?.phone ?? "",
      confirmMinor: false,
    },
  });
  const sync = () => {
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  };
  return (
    <details className="rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <summary className="min-h-11 cursor-pointer font-semibold">
        {record ? `${record.fullName} · ****${record.citizenIdLast4}` : "Thêm người nhận"}
      </summary>
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          if (!record && !/^\d{12}$/.test(values.citizenId.replace(/\s/g, ""))) {
            setError("citizenId", { message: "CCCD cần đủ 12 chữ số." });
            return;
          }
          if (!values.email?.trim() && !values.phone?.trim()) {
            setError("email", { message: "Cần ít nhất email hoặc số điện thoại." });
            return;
          }
          if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            setError("email", { message: "Email không hợp lệ." });
            return;
          }
          const { citizenId, ...contact } = values;
          const saved = await action.execute(
            () =>
              record
                ? beneficiaryService.update(vaultId, record.id, { ...contact, etag: etag! })
                : beneficiaryService.create(vaultId, { ...contact, citizenId }),
            (result) => {
              sync();
              setEtag(result.etag);
              if (record)
                reset({
                  citizenId: "",
                  fullName: result.fullName,
                  dateOfBirth: result.dateOfBirth,
                  email: result.email ?? "",
                  phone: result.phone ?? "",
                  confirmMinor: false,
                });
            },
          );
          if (saved && !record) reset();
        })}
      >
        <fieldset disabled={action.pending} className="space-y-4">
          {!record && (
            <label className="block space-y-2 text-sm">
              Số CCCD
              <Input
                autoComplete="off"
                {...register("citizenId")}
                aria-invalid={Boolean(errors.citizenId)}
              />
            </label>
          )}
          <label className="block space-y-2 text-sm">
            Họ tên
            <Input {...register("fullName")} aria-invalid={Boolean(errors.fullName)} />
          </label>
          <label className="block space-y-2 text-sm">
            Ngày sinh
            <Input
              type="date"
              {...register("dateOfBirth")}
              aria-invalid={Boolean(errors.dateOfBirth)}
            />
          </label>
          <label className="block space-y-2 text-sm">
            Email
            <Input type="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
          </label>
          <label className="block space-y-2 text-sm">
            Số điện thoại
            <Input type="tel" {...register("phone")} aria-invalid={Boolean(errors.phone)} />
          </label>
          <label className="flex min-h-11 items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm leading-6">
            <input type="checkbox" className="mt-1 size-5" {...register("confirmMinor")} />
            Nếu người nhận chưa đủ 18 tuổi, tôi đã đọc và xác nhận cảnh báo: việc bàn giao có thể
            cần người đại diện và xác minh bổ sung.
          </label>
          {Object.entries(errors).map(([key, error]) => (
            <p key={key} role="alert" className="text-sm text-destructive">
              {error?.message}
            </p>
          ))}
          <Button type="submit" className="min-h-11">
            {action.pending ? "Đang lưu…" : record ? "Lưu hồ sơ" : "Tạo hồ sơ người nhận"}
          </Button>
        </fieldset>
      </form>
      {record && (
        <div className="mt-6 space-y-3 border-t border-heritage-border pt-4">
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5"
              checked={deleteConfirmed}
              disabled={action.pending}
              onChange={(event) => setDeleteConfirmed(event.target.checked)}
            />
            Tôi xác nhận xóa hồ sơ người nhận này.
          </label>
          <Button
            variant="outline"
            disabled={action.pending || !deleteConfirmed || record.containerIds.length > 0}
            onClick={() =>
              void action.execute(() => beneficiaryService.remove(vaultId, record.id), sync)
            }
          >
            Xóa hồ sơ
          </Button>
          {record.containerIds.length > 0 && (
            <p className="text-xs text-heritage-muted">Gỡ khỏi các gói trước khi xóa hồ sơ.</p>
          )}
        </div>
      )}
      {action.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && (
        <p role="status" className="mt-4 text-sm text-heritage-primary">
          Đã lưu thay đổi.
        </p>
      )}
    </details>
  );
}
