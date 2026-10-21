import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { StatusBanner } from "@/shared/ui/status-banner";
import { ROUTES } from "@/shared/config/routes.config";
import { beneficiaryService } from "../api/beneficiaryService";
import { beneficiaryResponseSchema, createBeneficiarySchema } from "../model/beneficiary.schema";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;
// Ghi đè thông báo lỗi mặc định (tiếng Anh) của schema dùng chung bằng tiếng Việt để hiện ngay dưới từng ô.
const formSchema = createBeneficiarySchema
  .omit({ citizenId: true, fullName: true, dateOfBirth: true })
  .extend({
    citizenId: z.string().max(32, "Số CCCD quá dài."),
    fullName: z.string().max(200, "Họ tên tối đa 200 ký tự.").regex(/\S/, "Vui lòng nhập họ tên."),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày sinh."),
  });

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <span role="alert" className="block text-sm text-destructive">
      {message}
    </span>
  );
}

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
    },
  });
  const sync = () => {
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  };
  return (
    <div>
      <form
        noValidate
        className="space-y-4"
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
              <FieldError message={errors.citizenId?.message} />
            </label>
          )}
          <label className="block space-y-2 text-sm">
            Họ tên
            <Input
              placeholder="Ví dụ: Nguyễn Văn An"
              {...register("fullName")}
              aria-invalid={Boolean(errors.fullName)}
            />
            <FieldError message={errors.fullName?.message} />
          </label>
          <label className="block space-y-2 text-sm">
            Ngày sinh
            <Input
              type="date"
              {...register("dateOfBirth")}
              aria-invalid={Boolean(errors.dateOfBirth)}
            />
            <FieldError message={errors.dateOfBirth?.message} />
          </label>
          <label className="block space-y-2 text-sm">
            Email
            <Input type="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
            <FieldError message={errors.email?.message} />
          </label>
          <label className="block space-y-2 text-sm">
            Số điện thoại
            <Input type="tel" {...register("phone")} aria-invalid={Boolean(errors.phone)} />
            <FieldError message={errors.phone?.message} />
          </label>
          <Button
            type="submit"
            size="lg"
            className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
          >
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
            size="lg"
            className="border-red-300 text-red-700 hover:bg-red-50"
            disabled={action.pending || !deleteConfirmed || record.containerIds.length > 0}
            onClick={() =>
              void action.execute(() => beneficiaryService.remove(vaultId, record.id), sync)
            }
          >
            Xóa hồ sơ
          </Button>
          {record.containerIds.length > 0 && (
            <p className="text-xs text-heritage-muted">
              Gỡ khỏi các gói bàn giao trước khi xóa hồ sơ.
            </p>
          )}
        </div>
      )}
      {action.error && (
        <StatusBanner tone="error" className="mt-4">
          <p>{action.error}</p>
          {action.error.includes("gói dịch vụ trả phí") && (
            <Link className="inline-block underline" to={ROUTES.BILLING.PLANS}>
              Xem gói dịch vụ
            </Link>
          )}
        </StatusBanner>
      )}
      {action.succeeded && (
        <StatusBanner tone="success" className="mt-4">
          <p>Đã lưu thay đổi.</p>
        </StatusBanner>
      )}
    </div>
  );
}
