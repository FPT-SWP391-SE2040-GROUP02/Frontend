import { z } from "zod";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { ReactReduxContext } from "react-redux";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { ActionButton } from "@/shared/ui/ActionButton";
import { DatePickerInput } from "@/shared/ui/date-picker-input";
import {
  AttentionField,
  ErrorSummary,
  jumpToField,
  type SummaryItem,
} from "@/shared/ui/FormAttention";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ROUTES } from "@/shared/config/routes.config";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { User } from "@/entities/user";
import { beneficiaryService } from "../api/beneficiaryService";
import { beneficiaryResponseSchema } from "../model/beneficiary.schema";
import {
  CITIZEN_ID_FORMAT_MESSAGE,
  MIN_AGE_MESSAGE,
  PHONE_FORMAT_MESSAGE,
  isValidCitizenIdFormat,
  isVietnamPhone,
  latestAdultBirthDate,
} from "../model/beneficiaryFormat";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;

interface BeneficiaryFormValues {
  citizenId: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  message?: string;
}

const FIELD = "min-h-11 bg-white pr-10 font-normal placeholder:text-heritage-muted";
const GROUP_TITLE = "text-sm font-semibold text-heritage-muted";
/** Chờ ô rung một nhịp rồi mới cuộn tới ô sai đầu tiên, giữ như mẫu gốc. */
const JUMP_DELAY_MS = 200;
const MESSAGE_MAX = 300;

type FieldName = keyof BeneficiaryFormValues;

/** Thứ tự các ô trên form, dùng cho khung tóm tắt lỗi và để chọn ô sai đầu tiên. */
const FIELD_ORDER: FieldName[] = [
  "fullName",
  "dateOfBirth",
  "citizenId",
  "email",
  "phone",
  "message",
];

const FIELD_LABELS: Record<FieldName, string> = {
  citizenId: "Số CCCD",
  fullName: "Họ và tên",
  dateOfBirth: "Ngày sinh",
  email: "Email",
  phone: "Số điện thoại",
  message: "Lời nhắn",
};

/**
 * Form thêm/sửa người nhận: ô định danh, nhóm thông tin liên hệ, gợi ý một dòng, hai nút ghim ở đáy hộp thoại.
 * Lỗi "chưa nhập" chỉ hiện khi bấm lưu; lỗi định dạng hiện khi rời ô; sau lần bấm đầu thì kiểm ngay khi gõ.
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
  const success = useSuccessHold();
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
      z.object({
        citizenId: z
          .string()
          .max(32, "Số CCCD quá dài.")
          .superRefine((value, ctx) => {
            // CCCD chỉ nhập khi thêm mới; sửa hồ sơ thì số này cố định.
            if (record) {
              return;
            }
            const raw = value.replace(/\s/g, "");
            let message = "";
            if (!raw) {
              message = "Vui lòng nhập số CCCD.";
            } else if (!/^\d{12}$/.test(raw)) {
              message = "CCCD cần đủ 12 chữ số.";
            } else if (!isValidCitizenIdFormat(raw)) {
              message = CITIZEN_ID_FORMAT_MESSAGE;
            }
            if (message !== "") {
              ctx.addIssue({ code: "custom", message });
            }
          }),
        fullName: z
          .string()
          .min(1, "Vui lòng nhập họ tên.")
          .regex(/\S/, "Vui lòng nhập họ tên.")
          .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
          .max(200, "Họ tên tối đa 200 ký tự.")
          .regex(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái và khoảng trắng."),
        dateOfBirth: z.string().superRefine((value, ctx) => {
          let message = "";
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            message = "Vui lòng nhập hoặc chọn ngày sinh hợp lệ.";
          } else if (value > todayStr) {
            message = "Ngày sinh không được ở tương lai.";
          } else if (value !== record?.dateOfBirth && value > latestAdultBirthDate()) {
            // Phải đủ 18 tuổi. Khi sửa chỉ kiểm nếu ngày sinh được đổi, giống backend.
            message = MIN_AGE_MESSAGE;
          }
          if (message !== "") {
            ctx.addIssue({ code: "custom", message });
          }
        }),
        email: z.string().superRefine((value, ctx) => {
          // Email bắt buộc và không trùng email Chủ kho.
          const trimmed = value.trim();
          let message = "";
          if (!trimmed) {
            message = "Vui lòng nhập email.";
          } else if (trimmed.length > 254) {
            message = "Email tối đa 254 ký tự.";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            message = "Email không hợp lệ.";
          } else if (ownerEmail && trimmed.toLowerCase() === ownerEmail.trim().toLowerCase()) {
            message = "Email người thụ hưởng không được trùng với email của Chủ kho.";
          }
          if (message !== "") {
            ctx.addIssue({ code: "custom", message });
          }
        }),
        phone: z
          .string()
          .max(20, "Số điện thoại tối đa 20 ký tự.")
          .superRefine((value, ctx) => {
            // Số điện thoại Việt Nam nếu có nhập. Khi sửa chỉ kiểm lúc đổi số, để hồ sơ cũ vẫn sửa được.
            const changed = !record || value !== (record.phone ?? "");
            if (value.trim() && changed && !isVietnamPhone(value)) {
              ctx.addIssue({ code: "custom", message: PHONE_FORMAT_MESSAGE });
            }
          })
          .optional(),
        message: z.string().max(MESSAGE_MAX, "Lời nhắn tối đa 300 ký tự.").optional(),
      }),
    [record, todayStr, ownerEmail],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    trigger,
    control,
    formState: { errors, isSubmitted },
  } = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    // Tự cuộn mượt rồi mới đặt con trỏ (showProblems), nên tắt tự nhảy con trỏ của thư viện.
    shouldFocusError: false,
    defaultValues: {
      citizenId: "",
      fullName: record?.fullName ?? "",
      dateOfBirth: record?.dateOfBirth ?? "",
      email: record?.email ?? "",
      phone: record?.phone ?? "",
      message: record?.message ?? "",
    },
  });

  const sync = () => {
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  };

  let assignedNote = "";
  if (record && record.assetIds.length > 0) {
    assignedNote = `Người này đang được gán ${record.assetIds.length} tài sản. Sửa thông tin sẽ cập nhật cấu hình kế hoạch bàn giao.`;
  }
  let submitLabel = "Thêm người nhận";
  if (record) {
    submitLabel = "Lưu thay đổi";
  }

  const baseId = useId();
  const inputId = (name: FieldName) => `${baseId}-${name}`;
  const typedValues = useWatch({ control });
  const birth = useController({ control, name: "dateOfBirth" });
  // Các ô sai ở lần bấm lưu gần nhất (khung tóm tắt) và số lần rung của từng ô.
  const [listed, setListed] = useState<FieldName[]>([]);
  const [shakes, setShakes] = useState<Partial<Record<FieldName, number>>>({});
  const jumpTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(jumpTimer.current), []);

  /** Liệt kê ô sai lên đầu form, rung các ô đó rồi cuộn tới ô đầu tiên. */
  function showProblems(names: FieldName[]): void {
    const ordered = FIELD_ORDER.filter((name) => names.includes(name));
    if (ordered.length === 0) {
      return;
    }
    setListed(ordered);
    setShakes((current) => {
      const next = { ...current };
      for (const name of ordered) {
        next[name] = (next[name] ?? 0) + 1;
      }
      return next;
    });
    window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(() => jumpToField(inputId(ordered[0])), JUMP_DELAY_MS);
  }

  /** Trước lần bấm lưu đầu tiên: gõ lại thì ẩn lỗi cũ (sau đó thư viện tự kiểm khi gõ). */
  function editField(name: FieldName): void {
    if (!isSubmitted) {
      clearErrors(name);
    }
  }

  /** Rời ô trước lần bấm lưu đầu tiên: ô đã nhập thì báo lỗi định dạng ngay, ô trống thì chưa nhắc. */
  function leaveField(name: FieldName, typed: string): void {
    if (!isSubmitted && typed.trim() !== "") {
      void trigger(name);
    }
  }

  /** Gắn một ô vào khung báo lỗi: id, trạng thái lỗi và câu mô tả đang hiện. */
  function fieldProps(name: FieldName, hasHint: boolean) {
    let describedBy: string | undefined;
    if (hasHint) {
      describedBy = `${inputId(name)}-hint`;
    }
    if (errors[name]) {
      describedBy = `${inputId(name)}-error`;
    }
    return {
      id: inputId(name),
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": describedBy,
    };
  }

  function registerField(name: FieldName) {
    return register(name, {
      onChange: () => {
        editField(name);
        if (name === "citizenId") {
          setExisting(null);
        }
      },
      onBlur: (event: { target: { value: string } }) => leaveField(name, event.target.value),
    });
  }

  /** Thuộc tính chung của khung ô: lỗi, dấu tích sau lần bấm đầu, và nhịp rung. */
  function attention(name: FieldName) {
    return {
      inputId: inputId(name),
      error: errors[name]?.message,
      good: isSubmitted && !errors[name] && Boolean(typedValues[name]),
      shake: shakes[name] ?? 0,
    };
  }

  const summary: SummaryItem[] = [];
  if (listed.length > 0) {
    for (const name of FIELD_ORDER) {
      if (listed.includes(name) || errors[name]) {
        summary.push({ inputId: inputId(name), label: FIELD_LABELS[name], fixed: !errors[name] });
      }
    }
  }
  const messageLength = (typedValues.message ?? "").length;

  return (
    <div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          const submit = handleSubmit(
            async (values) => {
              setExisting(null);
              setListed([]);
              const cleanCitizenId = values.citizenId.replace(/\s/g, "");
              let createdNew = false;
              const send = () =>
                record
                  ? beneficiaryService.update(vaultId, record.id, {
                      fullName: values.fullName.trim(),
                      dateOfBirth: values.dateOfBirth,
                      email: values.email.trim(),
                      phone: values.phone?.trim() ? values.phone.replace(/[\s.-]/g, "") : null,
                      message: values.message?.trim() ?? "",
                      etag: etag!,
                    })
                  : beneficiaryService.create(vaultId, {
                      fullName: values.fullName.trim(),
                      dateOfBirth: values.dateOfBirth,
                      email: values.email.trim(),
                      phone: values.phone?.trim() ? values.phone.replace(/[\s.-]/g, "") : null,
                      message: values.message?.trim() ? values.message.trim() : null,
                      citizenId: cleanCitizenId,
                    });
              const saved = await action.execute(
                () => success.hold(send, (result) => !result.isExisting),
                (result) => {
                  if (result.isExisting) {
                    setExisting(result);
                    setError("citizenId", {
                      message: `Số CCCD này đã có trong kho: “${result.fullName}”. Hãy kiểm tra lại, hoặc mở hồ sơ đã có để sửa.`,
                    });
                    showProblems(["citizenId"]);
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
                      message: result.message ?? "",
                    });
                  }
                },
                (_failure, fieldErrors) => {
                  // Ánh xạ lỗi xác thực từ máy chủ về trực tiếp từng ô input tương ứng
                  const wrong: FieldName[] = [];
                  const fail = (name: FieldName, message: string) => {
                    setError(name, { type: "server", message });
                    wrong.push(name);
                  };
                  for (const [key, msgs] of Object.entries(fieldErrors)) {
                    const msg = msgs[0];
                    if (!msg) continue;
                    const normalized = key.toLowerCase();
                    if (normalized.includes("citizen") || normalized === "citizenid") {
                      fail("citizenId", msg);
                    } else if (normalized.includes("fullname") || normalized === "name") {
                      fail("fullName", msg);
                    } else if (
                      normalized.includes("date") ||
                      normalized.includes("birth") ||
                      normalized === "dateofbirth"
                    ) {
                      fail("dateOfBirth", msg);
                    } else if (normalized.includes("email")) {
                      fail("email", msg);
                    } else if (normalized.includes("phone")) {
                      fail("phone", msg);
                    } else if (normalized.includes("message")) {
                      fail("message", msg);
                    } else if (normalized.includes("contact")) {
                      fail("email", msg);
                    }
                  }
                  showProblems(wrong);
                },
              );
              if (saved && !record && createdNew) reset();
            },
            (invalid) => showProblems(Object.keys(invalid) as FieldName[]),
          );
          void submit(event);
        }}
      >
        <ErrorSummary items={summary} />
        <fieldset disabled={action.pending} className="space-y-5">
          <div className="space-y-3">
            <AttentionField {...attention("fullName")} label="Họ và tên *">
              <Input
                {...fieldProps("fullName", false)}
                {...registerField("fullName")}
                placeholder="Nguyễn Văn An"
                className={FIELD}
              />
            </AttentionField>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <AttentionField
                {...attention("dateOfBirth")}
                label="Ngày sinh *"
                hint="Từ đủ 18 tuổi."
                checkClassName="is-inset"
              >
                <DatePickerInput
                  {...fieldProps("dateOfBirth", true)}
                  value={birth.field.value}
                  max={latestAdultBirthDate()}
                  placeholder="ngày/tháng/năm"
                  className="min-h-11 bg-white font-normal placeholder:text-heritage-muted"
                  onChange={(iso) => {
                    birth.field.onChange(iso);
                    editField("dateOfBirth");
                  }}
                  onBlur={(event) => {
                    birth.field.onBlur();
                    leaveField("dateOfBirth", event.target.value);
                  }}
                />
              </AttentionField>
              {record ? (
                <div className="space-y-1.5 text-sm">
                  <span className="block font-semibold">Số CCCD</span>
                  <p className="flex min-h-11 items-center gap-2 rounded-lg border border-heritage-border bg-heritage-sunken px-3 font-mono text-heritage-muted">
                    <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                    <span>{record.citizenId}</span>
                  </p>
                  <span className="block text-heritage-muted">Không đổi được sau khi lưu.</span>
                </div>
              ) : (
                <AttentionField
                  {...attention("citizenId")}
                  label="Số CCCD *"
                  hint="Không đổi được sau khi lưu."
                >
                  <Input
                    {...fieldProps("citizenId", true)}
                    {...registerField("citizenId")}
                    autoComplete="off"
                    inputMode="numeric"
                    placeholder="12 chữ số"
                    className={FIELD}
                  />
                </AttentionField>
              )}
            </div>
          </div>
          <div role="group" aria-labelledby={`${baseId}-contact`} className="space-y-3">
            <p id={`${baseId}-contact`} className={GROUP_TITLE}>
              Thông tin liên hệ
            </p>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <AttentionField
                {...attention("email")}
                label="Email *"
                hint="Thư bàn giao gửi tới đây."
              >
                <Input
                  {...fieldProps("email", true)}
                  {...registerField("email")}
                  type="email"
                  placeholder="ten@email.com"
                  className={FIELD}
                />
              </AttentionField>
              <AttentionField {...attention("phone")} label="Số điện thoại" optional>
                <Input
                  {...fieldProps("phone", false)}
                  {...registerField("phone")}
                  type="tel"
                  placeholder="0912 345 678"
                  className={FIELD}
                />
              </AttentionField>
            </div>
          </div>
          <AttentionField
            {...attention("message")}
            good={false}
            label="Lời nhắn gửi người nhận"
            optional
            hint={
              <span className="flex justify-between gap-3">
                <span>
                  In trong thư bàn giao, gửi trước bước xác minh danh tính: đừng ghi mật khẩu, số
                  tài khoản hay nội dung tài sản.
                </span>
                <span className="shrink-0 tabular-nums">{`${messageLength}/${MESSAGE_MAX}`}</span>
              </span>
            }
          >
            <Textarea
              {...fieldProps("message", true)}
              {...registerField("message")}
              rows={3}
              maxLength={MESSAGE_MAX}
              placeholder="Ví dụ: Con ơi, bố để lại phần này để con lo cho cháu. Con đừng buồn nhé."
              className="min-h-20 bg-white font-normal placeholder:text-heritage-muted"
            />
          </AttentionField>
          {existing && (
            <p
              role="alert"
              className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
            >
              Số CCCD này đã có trong kho: “{existing.fullName}”. Hãy kiểm tra lại, hoặc mở hồ sơ đã
              có để sửa.
            </p>
          )}
          {!existing && assignedNote !== "" && (
            <p className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning">
              {assignedNote}
            </p>
          )}
        </fieldset>
        {action.error && (
          <div
            role="alert"
            className="space-y-1 rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
          >
            <p className="font-semibold">{action.error}</p>
            {action.error.includes("gói dịch vụ trả phí") && (
              <Link className="mt-1 inline-block font-semibold underline" to={ROUTES.BILLING.PLANS}>
                Xem gói dịch vụ
              </Link>
            )}
          </div>
        )}
        {action.succeeded && !existing && (
          <p
            role="status"
            className="rounded-xl bg-heritage-success-bg px-4 py-3 text-sm text-heritage-success"
          >
            Đã lưu thay đổi.
          </p>
        )}
        {/* Ghim ở đáy hộp thoại (lề p-7, từ màn sm là p-6) để luôn thấy nút lưu mà không phải cuộn. */}
        <div className="sticky -bottom-7 z-10 -mx-7 -mb-7 flex flex-wrap justify-end gap-3 border-t border-heritage-border bg-heritage-surface px-7 py-4 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6">
          {existing && onOpenExisting && (
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={() => onOpenExisting(existing)}
            >
              Mở hồ sơ đã có
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={onCancel}
            >
              Hủy
            </button>
          )}
          <ActionButton
            type="submit"
            className={buttonStyles.dark}
            disabled={action.pending}
            pending={action.pending}
            done={success.done}
            pendingLabel="Đang lưu…"
            doneLabel="Đã lưu"
          >
            {submitLabel}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
