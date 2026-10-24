import { z } from "zod";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { ReactReduxContext } from "react-redux";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Input } from "@/shared/ui/input";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import type { AuthState } from "@/entities/user/model/authSlice";
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

const LABEL = "block space-y-1.5 text-sm font-semibold";
const HINT = "block text-xs font-normal text-heritage-muted";
const FIELD = "min-h-11 bg-white font-normal placeholder:text-heritage-muted";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <span role="alert" className="block text-sm font-normal text-destructive">
      {message}
    </span>
  );
}

/**
 * Form thêm/sửa người nhận theo thiết kế 154/155/172: hai cột, gợi ý dưới từng ô, khung thông tin cuối form.
 * CCCD đầy đủ chỉ ở form RAM; sửa giữ etag ban đầu và không cho thay CCCD. Xóa hồ sơ nằm ở hộp thoại riêng của hàng.
 * Backend chưa có trường "Quan hệ" nên form không có ô này.
 */
export function BeneficiaryForm({
  vaultId,
  record,
  onCancel,
  onOpenExisting,
}: {
  vaultId: string;
  record?: Beneficiary;
  /** Có thì hiện nút Hủy cạnh nút lưu (form đặt trong hộp thoại). */
  onCancel?: () => void;
  /** Gọi khi người dùng muốn mở hồ sơ đã có (CCCD đã tồn tại với cùng thông tin). */
  onOpenExisting?: (existing: Beneficiary) => void;
}) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const reduxContext = useContext(ReactReduxContext);
  const ownerEmail = reduxContext
    ? (reduxContext.store.getState() as { auth?: AuthState })?.auth?.user?.email
    : undefined;
  const [etag, setEtag] = useState(record?.etag);
  const [existing, setExisting] = useState<Beneficiary | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
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
  let note =
    "Cần ít nhất một cách liên hệ: email hoặc số điện thoại. Số CCCD được mã hóa; hệ thống chỉ hiện 4 số cuối.";
  if (record && record.containerIds.length > 0) {
    note = `Người này đang thuộc ${record.containerIds.length} gói bàn giao. Sửa thông tin sẽ cập nhật cấu hình kế hoạch bàn giao.`;
  } else if (record) {
    note = "Cần ít nhất một cách liên hệ: email hoặc số điện thoại.";
  }
  let submitLabel = "Thêm người nhận";
  if (record) {
    submitLabel = "Lưu thay đổi";
  }
  return (
    <div>
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setExisting(null);
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
          if (
            values.email &&
            ownerEmail &&
            values.email.trim().toLowerCase() === ownerEmail.trim().toLowerCase()
          ) {
            setError("email", {
              message: "Email người thụ hưởng không được trùng với email của Chủ kho.",
            });
            return;
          }
          const { citizenId, ...contact } = values;
          let createdNew = false;
          const saved = await action.execute(
            () =>
              record
                ? beneficiaryService.update(vaultId, record.id, { ...contact, etag: etag! })
                : beneficiaryService.create(vaultId, { ...contact, citizenId }),
            (result) => {
              if (result.isExisting) {
                setExisting(result);
                setError("citizenId", {
                  message: `Số CCCD này đã có trong kho: “${result.fullName}”. Hãy kiểm tra lại, hoặc mở hồ sơ đã có để sửa.`,
                });
                return;
              }
              createdNew = true;
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
          if (saved && !record && createdNew) reset();
        })}
      >
        <fieldset disabled={action.pending} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={LABEL}>
              Họ và tên *
              <Input
                placeholder="Ví dụ: Nguyễn Văn An"
                className={FIELD}
                {...register("fullName")}
                aria-invalid={Boolean(errors.fullName)}
              />
              <FieldError message={errors.fullName?.message} />
            </label>
            <label className={LABEL}>
              Ngày sinh *
              <Input
                type="date"
                className={FIELD}
                {...register("dateOfBirth")}
                aria-invalid={Boolean(errors.dateOfBirth)}
              />
              <span className={HINT}>Không được là ngày trong tương lai.</span>
              <FieldError message={errors.dateOfBirth?.message} />
            </label>
            {record ? (
              <div className={LABEL}>
                <span>Số CCCD</span>
                <p className="flex min-h-11 items-center gap-2 rounded-lg border border-heritage-border bg-[#ECE8DB] px-3 font-mono text-sm font-normal text-heritage-muted">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                  <span>•••••••• {record.citizenIdLast4}</span>
                </p>
                <span className={HINT}>Không đổi được sau khi lưu.</span>
              </div>
            ) : (
              <label className={LABEL}>
                Số CCCD *
                <Input
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="12 chữ số"
                  className={FIELD}
                  {...register("citizenId", { onChange: () => clearErrors("citizenId") })}
                  aria-invalid={Boolean(errors.citizenId)}
                />
                <span className={HINT}>
                  Đúng 12 chữ số, giữ cả số 0 ở đầu. Không đổi được sau khi lưu.
                </span>
              </label>
            )}
            <label className={LABEL}>
              Email
              <Input
                type="email"
                placeholder="ten@email.com"
                className={FIELD}
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError message={errors.email?.message} />
            </label>
            <label className={`${LABEL} sm:col-start-2`}>
              Số điện thoại
              <Input
                type="tel"
                placeholder="09xx xxx xxx"
                className={FIELD}
                {...register("phone")}
                aria-invalid={Boolean(errors.phone)}
              />
              <span className={HINT}>9 đến 15 chữ số, có thể bắt đầu bằng +.</span>
              <FieldError message={errors.phone?.message} />
            </label>
          </div>
          {errors.citizenId && !record ? (
            <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
              {errors.citizenId.message}
            </p>
          ) : (
            <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">{note}</p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            {existing && onOpenExisting && (
              <button
                type="button"
                className={buttonStyles.outline}
                onClick={() => onOpenExisting(existing)}
              >
                Mở hồ sơ đã có
              </button>
            )}
            {onCancel && (
              <button type="button" className={buttonStyles.outline} onClick={onCancel}>
                Hủy
              </button>
            )}
            <button type="submit" className={buttonStyles.gold}>
              {action.pending ? "Đang lưu…" : submitLabel}
            </button>
          </div>
        </fieldset>
      </form>
      {action.error && (
        <div role="alert" className="mt-4 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          <p>{action.error}</p>
          {action.error.includes("gói dịch vụ trả phí") && (
            <Link className="mt-1 inline-block font-semibold underline" to={ROUTES.BILLING.PLANS}>
              Xem gói dịch vụ
            </Link>
          )}
        </div>
      )}
      {action.succeeded && !existing && (
        <p role="status" className="mt-4 rounded-xl bg-[#E3EFE8] px-4 py-3 text-sm text-[#1F7A55]">
          Đã lưu thay đổi.
        </p>
      )}
    </div>
  );
}
