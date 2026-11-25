import { ROUTES } from "@/shared/config/routes.config";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { emailMatchesMask } from "@/shared/lib/invitedEmail";
import { getRegisterErrorMessage, getRegisterRejectedField } from "../lib/registerFeedback";
import { useFieldFeedback } from "../lib/useFieldFeedback";
import { registerSchema, type RegisterInput } from "../model/auth.schema";
import { NEW_PASSWORD_HINT } from "../model/password.schema";
import { PHONE_SHARING_HINT } from "../model/phone.schema";
import { useRegister } from "../model/useAuth";
import { AuthField, PasswordEye } from "./AuthField";
import { MorphButton } from "./MorphButton";

/**
 * @description Thuộc tính cấu hình cho RegisterForm component.
 */
export interface RegisterFormProps {
  /** Callback khi đăng ký thành công */
  onSuccess?: () => void;
  /** Đường dẫn nội bộ cần quay lại sau khi xác thực email, ví dụ trang nhận lời mời. */
  redirect?: string | null;
  /** true khi người dùng đến từ liên kết lời mời: ẩn ghi chú chia sẻ số điện thoại vì không áp dụng cho người nhận. */
  fromInvitation?: boolean;
  /** Email điền sẵn theo thư mời: ô email bị khóa (chỉ đọc), người dùng không đổi được. */
  lockedEmail?: string | null;
  /**
   * Email được mời đã che bớt (ví dụ m•••••h@example.com) khi chưa có email đầy đủ để điền sẵn: nhắc người dùng dùng
   * đúng email đó và chặn gửi form nếu email gõ vào không khớp dạng che. Backend vẫn là nơi kiểm cuối cùng.
   */
  invitedEmailMasked?: string | null;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Form Tạo tài khoản Mới.
 *
 * @param {RegisterFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form đăng ký
 *
 * @example
 * ```tsx
 * <RegisterForm onSuccess={() => navigate(ROUTES.AUTH.LOGIN)} />
 * ```
 */
export function RegisterForm({
  onSuccess,
  redirect = null,
  fromInvitation = false,
  lockedEmail = null,
  invitedEmailMasked = null,
  className = "",
}: RegisterFormProps) {
  const navigate = useNavigate();
  const { mutateAsync: registerUser, isPending, isError, error } = useRegister();
  // Giữ dấu tích trên nút một nhịp rồi mới sang trang xác minh email.
  const created = useSuccessHold();
  const locked = isPending || created.done;
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const form = useForm<RegisterInput>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(registerSchema),
    defaultValues: lockedEmail ? { email: lockedEmail } : undefined,
  });
  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = form;
  const { field, shake, shakes } = useFieldFeedback(form);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  // Ô bị server từ chối (email hoặc số điện thoại đã dùng); sửa ô đó thì hết đỏ.
  const [rejected, setRejected] = useState<"email" | "phone" | null>(null);
  const clearRejected = (name: "email" | "phone") => {
    if (rejected === name) setRejected(null);
  };

  // Ghi chú chia sẻ số điện thoại chỉ hiện với Chủ kho và Người thực thi; người nhận không thấy.
  let phoneHint: string | undefined = undefined;
  if (!fromInvitation) {
    phoneHint = PHONE_SHARING_HINT;
  }
  let emailHint: string | undefined = undefined;
  if (lockedEmail) {
    emailHint = "Email đã điền sẵn theo thư mời, không đổi được.";
  } else if (invitedEmailMasked) {
    emailHint = `Hãy dùng đúng email được mời: ${invitedEmailMasked}`;
  }

  const onSubmit = async (data: RegisterInput): Promise<void> => {
    // TODO: [P0][AUTH-04] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Giữ ngữ cảnh lời mời qua đăng ký và xác minh khi contract được duyệt.
    // 2. [INPUT & OUTPUT]: Invitation marker chưa tin cậy + form -> return context đã validate.
    // 3. [CÁC BƯỚC]: Chốt API xác minh lời mời/callback; truyền context qua màn chờ email;
    //    Backend kiểm quyền trước khi mở tài nguyên. Luồng register 202 hiện có đã triển khai.
    // 4. [HÀM / THƯ VIỆN]: useRegister, React Router, Zod; API invitation cần được chốt.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Lời mời hết hạn/sai account; không tự cấp role,
    //    không coi đăng ký là đăng nhập hoặc làm lộ nội dung từ marker chưa xác minh.
    if (locked) return;

    if (!lockedEmail && invitedEmailMasked && !emailMatchesMask(data.email, invitedEmailMasked)) {
      setError("email", { type: "validate", message: "Email này không phải email được mời." });
      shake(["email"]);
      return;
    }

    setRejected(null);
    try {
      await created.hold(() => registerUser(data));
    } catch (failure) {
      // Mutation giữ lỗi cho khung báo; ở đây chỉ rung và tô đỏ ô bị trùng.
      const name = getRegisterRejectedField(failure);
      if (mounted.current && name !== null) {
        setRejected(name);
        shake([name]);
      }
      return;
    }
    if (!mounted.current) return;
    onSuccess?.();
    const verifyParams = new URLSearchParams({ email: data.email });
    if (redirect) {
      verifyParams.set("redirect", redirect);
    }
    navigate(`${ROUTES.AUTH.VERIFY_EMAIL}?${verifyParams}`);
  };

  return (
    <form
      noValidate
      onSubmit={(event) =>
        void handleSubmit(onSubmit, (invalid) => shake(Object.keys(invalid)))(event)
      }
      className={`space-y-5 w-full ${className}`}
    >
      {isError && (
        <div
          id="register-error"
          role="alert"
          className="rounded-xl border border-heritage-danger-border bg-heritage-danger-bg p-4 text-sm text-heritage-danger"
        >
          <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
          {getRegisterErrorMessage(error)}
        </div>
      )}
      <AuthField
        id="register-fullName"
        label="Họ và tên"
        autoComplete="name"
        disabled={locked}
        error={errors.fullName?.message}
        shake={shakes.fullName}
        {...field("fullName")}
      />

      <AuthField
        id="register-email"
        label="Email"
        type="email"
        autoComplete="email"
        disabled={locked}
        readOnly={Boolean(lockedEmail)}
        hint={emailHint}
        error={errors.email?.message}
        rejected={rejected === "email"}
        rejectedBy="register-error"
        shake={shakes.email}
        {...field("email", { onEdit: () => clearRejected("email") })}
      />

      <AuthField
        id="register-phone"
        label="Số điện thoại"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        disabled={locked}
        hint={phoneHint}
        error={errors.phone?.message}
        rejected={rejected === "phone"}
        rejectedBy="register-error"
        shake={shakes.phone}
        {...field("phone", { onEdit: () => clearRejected("phone") })}
      />

      <AuthField
        id="register-password"
        label="Mật khẩu"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        disabled={locked}
        hint={NEW_PASSWORD_HINT}
        error={errors.password?.message}
        shake={shakes.password}
        end={
          <PasswordEye
            shown={showPassword}
            disabled={locked}
            onToggle={() => setShowPassword(!showPassword)}
          />
        }
        {...field("password", { partner: "confirmPassword" })}
      />

      <AuthField
        id="register-confirmPassword"
        label="Xác nhận mật khẩu"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        disabled={locked}
        error={errors.confirmPassword?.message}
        shake={shakes.confirmPassword}
        {...field("confirmPassword")}
      />

      {/* Submit Button */}
      <MorphButton
        pending={locked}
        done={created.done}
        pendingLabel="Đang khởi tạo tài khoản..."
        doneLabel="Đã tạo tài khoản"
      >
        Tạo tài khoản
      </MorphButton>
    </form>
  );
}
