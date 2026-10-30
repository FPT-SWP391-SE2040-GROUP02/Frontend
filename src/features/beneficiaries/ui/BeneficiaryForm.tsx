import { z } from "zod";
import { useContext, useEffect, useMemo, useState } from "react";
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
import type { User } from "@/entities/user";
import { beneficiaryService } from "../api/beneficiaryService";
import { beneficiaryResponseSchema } from "../model/beneficiary.schema";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;

interface BeneficiaryFormValues {
  citizenId: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
}

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

const FIELD_LABELS: Record<string, string> = {
  citizenId: "Số CCCD",
  fullName: "Họ và tên",
  dateOfBirth: "Ngày sinh",
  email: "Email",
  phone: "Số điện thoại",
};

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
  const store = reduxContext?.store;
  const [currentUser, setCurrentUser] = useState<User | null>(
    () => (store?.getState() as { auth?: AuthState } | undefined)?.auth?.user ?? null,
  );

  useEffect(() => {
    if (!store) return;
    const unsubscribe = store.subscribe(() => {
      const user = (store.getState() as { auth?: AuthState } | undefined)?.auth?.user ?? null;
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [store]);

  const ownerEmail = currentUser?.email;
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [etag, setEtag] = useState(record?.etag);
  const [existing, setExisting] = useState<Beneficiary | null>(null);

  const formSchema = useMemo(
    () =>
      z
        .object({
          citizenId: z.string().max(32, "Số CCCD quá dài."),
          fullName: z
            .string()
            .min(1, "Vui lòng nhập họ tên.")
            .regex(/\S/, "Vui lòng nhập họ tên.")
            .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
            .max(200, "Họ tên tối đa 200 ký tự.")
            .regex(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái và khoảng trắng."),
          dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày sinh."),
          email: z
            .string()
            .min(1, "Vui lòng nhập email.")
            .max(254, "Email tối đa 254 ký tự.")
            .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()), "Email không hợp lệ."),
          phone: z.string().max(20, "Số điện thoại tối đa 20 ký tự.").optional().or(z.literal("")),
        })
        .superRefine((values, ctx) => {
          // 1. Kiểm tra ngày sinh không ở tương lai
          if (values.dateOfBirth && values.dateOfBirth > todayStr) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["dateOfBirth"],
              message: "Ngày sinh không được ở tương lai.",
            });
          }

          // 2. Kiểm tra CCCD khi thêm mới (không áp dụng khi sửa vì CCCD cố định)
          if (!record) {
            const rawCitizenId = values.citizenId.replace(/\s/g, "");
            if (!rawCitizenId) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["citizenId"],
                message: "Vui lòng nhập số CCCD.",
              });
            } else if (!/^\d{12}$/.test(rawCitizenId)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["citizenId"],
                message: "CCCD cần đủ 12 chữ số.",
              });
            }
          }

          // 3. Email bắt buộc và không trùng email Chủ kho
          const trimmedEmail = values.email?.trim() ?? "";
          if (!trimmedEmail) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["email"],
              message: "Vui lòng nhập email.",
            });
          } else if (ownerEmail && trimmedEmail.toLowerCase() === ownerEmail.trim().toLowerCase()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["email"],
              message: "Email người thụ hưởng không được trùng với email của Chủ kho.",
            });
          }

          // 4. Kiểm tra định dạng số điện thoại nếu có nhập
          const hasPhone = Boolean(values.phone?.trim());
          if (hasPhone && values.phone) {
            const cleanedPhone = values.phone.replace(/[\s.-]/g, "");
            if (!/^\+?[0-9]{9,15}$/.test(cleanedPhone)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["phone"],
                message: "Số điện thoại không hợp lệ (9 đến 15 chữ số).",
              });
            }
          }
        }),
    [record, todayStr, ownerEmail],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BeneficiaryFormValues>({
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
    "Email là bắt buộc để gửi thông báo nhận bàn giao. Số CCCD được mã hóa; hệ thống chỉ hiện 4 số cuối.";
  if (record && record.containerIds.length > 0) {
    note = `Người này đang thuộc ${record.containerIds.length} gói bàn giao. Sửa thông tin sẽ cập nhật cấu hình kế hoạch bàn giao.`;
  } else if (record) {
    note = "Email là bắt buộc để gửi thông báo nhận bàn giao.";
  }
  let submitLabel = "Thêm người nhận";
  if (record) {
    submitLabel = "Lưu thay đổi";
  }

  const errorFieldNames = Array.from(
    new Set(
      Object.keys(errors)
        .map((k) => FIELD_LABELS[k])
        .filter(Boolean),
    ),
  );

  return (
    <div>
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setExisting(null);
          const cleanCitizenId = values.citizenId.replace(/\s/g, "");
          let createdNew = false;
          const saved = await action.execute(
            () =>
              record
                ? beneficiaryService.update(vaultId, record.id, {
                    fullName: values.fullName.trim(),
                    dateOfBirth: values.dateOfBirth,
                    email: values.email.trim(),
                    phone: values.phone?.trim() ? values.phone.replace(/[\s.-]/g, "") : null,
                    etag: etag!,
                  })
                : beneficiaryService.create(vaultId, {
                    fullName: values.fullName.trim(),
                    dateOfBirth: values.dateOfBirth,
                    email: values.email.trim(),
                    phone: values.phone?.trim() ? values.phone.replace(/[\s.-]/g, "") : null,
                    citizenId: cleanCitizenId,
                  }),
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
              if (record) {
                reset({
                  citizenId: "",
                  fullName: result.fullName,
                  dateOfBirth: result.dateOfBirth,
                  email: result.email ?? "",
                  phone: result.phone ?? "",
                });
              }
            },
            (_failure, fieldErrors) => {
              // Ánh xạ lỗi xác thực từ máy chủ về trực tiếp từng ô input tương ứng
              for (const [key, msgs] of Object.entries(fieldErrors)) {
                const msg = msgs[0];
                if (!msg) continue;
                const normalized = key.toLowerCase();
                if (normalized.includes("citizen") || normalized === "citizenid") {
                  setError("citizenId", { type: "server", message: msg });
                } else if (normalized.includes("fullname") || normalized === "name") {
                  setError("fullName", { type: "server", message: msg });
                } else if (
                  normalized.includes("date") ||
                  normalized.includes("birth") ||
                  normalized === "dateofbirth"
                ) {
                  setError("dateOfBirth", { type: "server", message: msg });
                } else if (normalized.includes("email")) {
                  setError("email", { type: "server", message: msg });
                } else if (normalized.includes("phone")) {
                  setError("phone", { type: "server", message: msg });
                } else if (normalized.includes("contact")) {
                  setError("email", { type: "server", message: msg });
                }
              }
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
                {...register("fullName", { onChange: () => clearErrors("fullName") })}
                aria-invalid={Boolean(errors.fullName)}
              />
              <FieldError message={errors.fullName?.message} />
            </label>
            <label className={LABEL}>
              Ngày sinh *
              <Input
                type="date"
                className={FIELD}
                {...register("dateOfBirth", { onChange: () => clearErrors("dateOfBirth") })}
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
                  {...register("citizenId", {
                    onChange: () => {
                      clearErrors("citizenId");
                      setExisting(null);
                    },
                  })}
                  aria-invalid={Boolean(errors.citizenId)}
                />
                <span className={HINT}>
                  Đúng 12 chữ số, giữ cả số 0 ở đầu. Không đổi được sau khi lưu.
                </span>
                <FieldError message={errors.citizenId?.message} />
              </label>
            )}
            <label className={LABEL}>
              Email *
              <Input
                type="email"
                placeholder="ten@email.com"
                className={FIELD}
                {...register("email", {
                  onChange: () => {
                    clearErrors("email");
                  },
                })}
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
                {...register("phone", {
                  onChange: () => {
                    clearErrors("phone");
                  },
                })}
                aria-invalid={Boolean(errors.phone)}
              />
              <span className={HINT}>9 đến 15 chữ số, có thể bắt đầu bằng +.</span>
              <FieldError message={errors.phone?.message} />
            </label>
          </div>
          {existing ? (
            <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
              Số CCCD này đã có trong kho: “{existing.fullName}”. Hãy kiểm tra lại, hoặc mở hồ sơ đã
              có để sửa.
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
        <div
          role="alert"
          className="mt-4 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119] space-y-1"
        >
          <p className="font-semibold">{action.error}</p>
          {errorFieldNames.length > 0 && (
            <p className="text-xs text-[#7A1913]">
              Vui lòng kiểm tra và chỉnh sửa lại các ô có thông báo lỗi màu đỏ ở trên:{" "}
              <span className="font-semibold">{errorFieldNames.join(", ")}</span>.
            </p>
          )}
          {(action.error.includes("gói dịch vụ trả phí") ||
            action.error.includes("suất người nhận")) && (
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
