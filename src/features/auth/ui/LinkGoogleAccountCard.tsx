import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { linkGoogleSchema, type LinkGoogleInput } from "../model/auth.schema";
import { useLinkGoogle } from "../model/useAuth";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { AuthField, PasswordEye } from "./AuthField";
import { MorphButton } from "./MorphButton";
import { useFieldFeedback } from "../lib/useFieldFeedback";
import { getLoginRedirect, isCredentialError } from "../lib/loginFeedback";
import { getGoogleErrorMessage } from "../lib/googleFeedback";
import { ROUTES } from "@/shared/config/routes.config";
import type { BackendUserResponse } from "@/entities/user/model/backendUser.schema";

/**
 * @description Thuộc tính cho component Liên kết tài khoản Google.
 */
export interface LinkGoogleAccountCardProps {
  /** Email tài khoản Google cần liên kết */
  email?: string;
  /** Ticket chỉ từ Google response trong RAM; không lấy từ email/URL. */
  linkTicket?: string;
  rememberMe?: boolean;
  returnUrl?: string;
  /** Điều hướng dùng cùng chính sách email/role với đăng nhập thường. */
  onComplete?: (user: BackendUserResponse) => void;
  /** Bỏ vé khỏi form và quay lại Google; giữ nguyên redirect của màn đăng nhập. */
  onCancel?: () => void;
  /** Tên đầy đủ từ hồ sơ Google */
  fullName?: string;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Xác nhận mật khẩu để Liên kết Google (Mockup 5 - LienKetGoogle.dc.html).
 * Đảm bảo nguyên tắc bảo mật: Không tự động gộp tài khoản nếu người dùng chưa xác nhận mật khẩu hiện có.
 *
 * @param {LinkGoogleAccountCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card xác nhận liên kết
 */
export function LinkGoogleAccountCard({
  email = "",
  fullName = "",
  linkTicket,
  rememberMe = false,
  returnUrl,
  onComplete,
  onCancel,
  className = "",
}: LinkGoogleAccountCardProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const navigate = useNavigate();
  const { mutateAsync: linkAccount, isPending, isError, error } = useLinkGoogle();
  // Giữ dấu tích trên nút một nhịp rồi mới chuyển trang; trong nhịp đó form vẫn khóa.
  const success = useSuccessHold();
  // Server báo sai mật khẩu: tô đỏ ô, câu giải thích nằm ở khung báo lỗi.
  const [rejected, setRejected] = useState(false);
  const isBusy = isPending || success.done;

  const form = useForm<LinkGoogleInput>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(linkGoogleSchema),
    defaultValues: {
      password: "",
    },
  });
  const {
    handleSubmit,
    formState: { errors },
  } = form;
  const { field, shake, shakes } = useFieldFeedback(form);

  /**
   * @description Xử lý nộp form xác nhận mật khẩu liên kết
   * @param {LinkGoogleInput} data Dữ liệu mật khẩu
   */
  const onSubmit = async (data: LinkGoogleInput): Promise<void> => {
    // Ticket phải đến từ Google response trong RAM.
    if (isBusy || !linkTicket) return;
    setRejected(false);
    try {
      const outcome = await success.hold(
        () => linkAccount({ linkTicket, password: data.password, rememberMe }),
        (result) => "user" in result,
      );
      if (!mounted.current) return;
      // Admin đã bật 2FA: chưa có phiên, sang bước nhập mã.
      if ("twoFactorRequired" in outcome) navigate(ROUTES.AUTH.TWO_FACTOR);
      else if (onComplete) onComplete(outcome.user);
      else navigate(getLoginRedirect(returnUrl ?? null));
    } catch (failure) {
      // Mutation giữ lỗi cho khung báo; ở đây chỉ rung và tô đỏ khi sai mật khẩu.
      if (mounted.current && isCredentialError(failure)) {
        setRejected(true);
        shake(["password"]);
      }
    }
  };

  if (!linkTicket)
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl">Liên kết Google</h1>
        <p role="alert" className="text-sm text-heritage-danger">
          Thiếu phiên liên kết Google hợp lệ. Vui lòng quay lại đăng nhập.
        </p>
        <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center underline">
          Quay lại đăng nhập
        </Link>
      </div>
    );

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-1">
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-serif text-2xl sm:text-3xl font-normal text-heritage-text"
        >
          Email này đã có tài khoản
        </h1>
        <p className="text-sm sm:text-sm text-heritage-muted leading-relaxed">
          Địa chỉ <span className="font-medium text-heritage-text">{email}</span> đã được dùng cho
          một tài khoản LegacyVault. Nhập mật khẩu để liên kết với Google.
        </p>
      </div>

      {/* Thẻ người dùng Google (User Pill) */}
      {fullName && (
        <div className="p-3 rounded-2xl bg-white border border-heritage-sunken flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-heritage-primary-light text-heritage-primary font-bold text-base flex items-center justify-center flex-shrink-0">
            {fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-heritage-text truncate">{fullName}</p>
            <p className="text-[0.875rem] text-heritage-muted truncate">{email}, từ Google</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-heritage-gold flex-shrink-0" />
        </div>
      )}
      {isError && (
        <div
          id="google-link-error"
          role="alert"
          className="rounded-xl border border-heritage-danger-border bg-heritage-danger-bg p-4 text-sm text-heritage-danger"
        >
          <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
          {getGoogleErrorMessage(error)}
        </div>
      )}
      {/* Form nhập mật khẩu hiện tại */}
      <form
        noValidate
        onSubmit={(event) =>
          void handleSubmit(onSubmit, (invalid) => shake(Object.keys(invalid)))(event)
        }
        className="space-y-4"
      >
        <AuthField
          id="google-link-password"
          label="Mật khẩu hiện có"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          disabled={isBusy}
          error={errors.password?.message}
          rejected={rejected}
          rejectedBy="google-link-error"
          shake={shakes.password}
          end={
            <PasswordEye
              shown={showPassword}
              disabled={isBusy}
              onToggle={() => setShowPassword(!showPassword)}
            />
          }
          {...field("password", { onEdit: () => setRejected(false) })}
        />

        <MorphButton
          pending={isBusy}
          done={success.done}
          disabled={isBusy}
          pendingLabel="Đang xác nhận..."
          doneLabel="Đã liên kết"
        >
          <span>Xác nhận và liên kết</span>
        </MorphButton>
      </form>

      {/* Nút hủy chuyển về dùng email khác */}
      <div className="pt-4 border-t border-heritage-sunken text-center">
        {onCancel ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="min-h-11 text-sm text-heritage-primary underline"
          >
            Quay lại đăng nhập Google
          </button>
        ) : (
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="text-sm text-heritage-primary hover:underline font-semibold"
          >
            Dùng email khác
          </Link>
        )}
      </div>
    </div>
  );
}
