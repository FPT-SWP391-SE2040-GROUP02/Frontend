import { ROUTES } from "@/shared/config/routes.config";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthField, PasswordEye } from "./AuthField";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { MorphButton } from "./MorphButton";
import { useFieldFeedback } from "../lib/useFieldFeedback";
import { LinkGoogleAccountCard } from "./LinkGoogleAccountCard";
import { getGoogleErrorMessage } from "../lib/googleFeedback";
import type { BackendUserResponse } from "@/entities/user/model/backendUser.schema";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getAdminLoginErrorMessage,
  getLoginErrorMessage,
  getLoginRedirect,
  getLoginSubtitle,
  isCredentialError,
  isReceiveAssetsRedirect,
  isReceiveRedirect,
  MAINTENANCE_LOGIN_DENIED_MESSAGE,
} from "../lib/loginFeedback";
import { loginSchema, type LoginInput } from "../model/auth.schema";
import type { InvitationContext } from "../model/auth.types";
import { useLogin, useGoogleLogin, useLogout } from "../model/useAuth";
import { ROLES } from "@/shared/constants/roles";
import { isMaintenanceActive } from "@/shared/api/maintenance";

/**
 * @description Thuộc tính cấu hình cho component LoginForm.
 */
export interface LoginFormProps {
  /** Callback khi người dùng bấm đăng nhập bằng Passkey / Sinh trắc học */
  onPasskeyClick?: () => void;
  /** Unverified invitation marker; private package/owner details require server authorization. */
  invitationContext?: Pick<InvitationContext, "token">;
  /** Lớp CSS bổ trợ */
  className?: string;
  /**
   * Lối đăng nhập quản trị khi hệ thống bảo trì: chỉ email và mật khẩu (ẩn Google, đăng ký, quên mật khẩu);
   * tài khoản không phải Admin bị báo đỏ "không có quyền truy cập" và hủy phiên.
   */
  adminOnly?: boolean;
}

/** Bỏ query và hash để so đường dẫn. */
function pathnameOf(url: string): string {
  return url.split(/[?#]/)[0];
}

/** Trang thuộc khu Admin (cả /dashboard/users nằm trong khu Admin). */
function isAdminPath(url: string): boolean {
  const path = pathnameOf(url);
  return (
    path === ROUTES.ADMIN.ROOT ||
    path.startsWith(`${ROUTES.ADMIN.ROOT}/`) ||
    path === ROUTES.DASHBOARD.USERS
  );
}

/** Trang thuộc khu Verifier. */
function isVerifierPath(url: string): boolean {
  return pathnameOf(url).startsWith("/notary/");
}

/**
 * @description Form Đăng Nhập trang nhã tuân thủ 100% thiết kế Mockup 1, 2, 3 và 4.
 * - Mockup 1: Trạng thái mặc định nhập Email và Mật khẩu, hỗ trợ Google SSO.
 * - Lỗi API hiển thị theo transport; trạng thái khóa/lượt thử chờ contract BE.
 * - Lời mời chỉ hiển thị thông báo trung tính; chưa xác minh ngữ cảnh từ server.
 *
 * @param {LoginFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form đăng nhập
 */
export function LoginForm({
  onPasskeyClick,
  invitationContext,
  className = "",
  adminOnly = false,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [link, setLink] = useState<{ linkTicket: string; maskedEmail: string } | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectUrl = getLoginRedirect(searchParams.get("redirect"));
  // Đi từ liên kết lời mời nhận bàn giao: dùng chữ cho người nhận và mang lời mời theo sang trang đăng ký.
  const fromReceive = isReceiveRedirect(redirectUrl);
  const fromReceiveAssets = isReceiveAssetsRedirect(redirectUrl);
  // Người nhận tạo tài khoản mới thì vẫn mang đường dẫn quay lại, không bị mời lập kho.
  const keepRedirect = fromReceive || fromReceiveAssets;
  const registerFromReceive = `${ROUTES.AUTH.REGISTER}?${new URLSearchParams({ redirect: redirectUrl })}`;
  const { mutateAsync: login, isPending: loginPending, isError, error } = useLogin();
  const google = useGoogleLogin();
  const logout = useLogout();
  const [maintenanceDenied, setMaintenanceDenied] = useState(false);
  // Giữ dấu tích trên nút một nhịp rồi mới chuyển trang; trong nhịp đó form vẫn khóa.
  const passwordSignIn = useSuccessHold();
  const googleSignIn = useSuccessHold();
  // Server báo sai email hoặc mật khẩu: tô đỏ cả hai ô vì server không nói ô nào sai.
  const [rejected, setRejected] = useState(false);
  const isPending =
    loginPending ||
    google.isPending ||
    logout.isPending ||
    passwordSignIn.done ||
    googleSignIn.done;

  const emailParam = searchParams.get("email") ?? "";
  const isVerifiedBanner = searchParams.get("verified") === "true";

  const form = useForm<LoginInput>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam,
      password: "",
      rememberMe: true,
    },
  });
  const {
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const { field, shake, shakes } = useFieldFeedback(form);
  const clearRejected = () => setRejected(false);

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  /** Đang bảo trì (hoặc lối quản trị) mà tài khoản không phải Admin. */
  const isDenied = (user: BackendUserResponse): boolean =>
    (adminOnly || isMaintenanceActive()) && user.role !== ROLES.ADMIN;

  const finishLogin = (user: BackendUserResponse): void => {
    // Đang bảo trì mà tài khoản không phải Admin: báo đỏ "không có quyền" và hủy phiên vừa mở, không điều hướng.
    // Backend mới đã tự chặn (503); nhánh này giữ đúng hành vi cả khi Backend chưa cập nhật.
    if (isDenied(user)) {
      setLink(null);
      setMaintenanceDenied(true);
      logout.mutate(undefined);
      return;
    }
    if (!user.emailVerified) {
      navigate(
        `${ROUTES.AUTH.VERIFY_EMAIL}?${new URLSearchParams({ email: user.email, redirect: redirectUrl })}`,
      );
    } else if (user.role === ROLES.ADMIN && !isAdminPath(redirectUrl)) {
      // Link đăng nhập có thể còn redirect của phiên trước (ví dụ /executor); Admin chỉ quay lại trang Admin.
      navigate(ROUTES.ADMIN.ROOT);
    } else if (user.role === ROLES.VERIFIER && !isVerifierPath(redirectUrl)) {
      navigate(ROUTES.NOTARY.WORKSPACE);
    } else if (
      user.role === ROLES.EXECUTOR &&
      (!searchParams.get("redirect") || redirectUrl.startsWith(ROUTES.DASHBOARD.ROOT))
    ) {
      navigate(ROUTES.EXECUTOR.ROOT);
    } else {
      navigate(redirectUrl);
    }
  };

  /**
   * @description Xử lý nộp form đăng nhập
   * @param {LoginInput} data Dữ liệu email và mật khẩu
   */
  const onSubmit = async (data: LoginInput): Promise<void> => {
    // TODO: [P0][AUTH-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Hiển thị trạng thái khóa/lượt thử từ BE thay cho thông báo lỗi chung.
    // 2. [INPUT & OUTPUT]: ProblemDetails và Retry-After -> thông báo/thời gian thử lại từ server.
    // 3. [CÁC BƯỚC]: Chốt trường lỗi được phép hiển thị; parse trong loginFeedback;
    //    nối UI inline. POST login, Bearer RAM và điều hướng theo user đã triển khai.
    // 4. [HÀM / THƯ VIỆN]: getLoginErrorMessage, Zod, Axios headers, tests LoginForm.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Lỗi mạng/500 không giảm lượt; không tự khóa 15 phút;
    //    không in response nội bộ hoặc suy diễn unlockAt khi server không trả.
    if (isPending || typeof data.email !== "string" || typeof data.password !== "string") return;
    setMaintenanceDenied(false);
    setRejected(false);
    const credentials = {
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    };

    try {
      const outcome = await passwordSignIn.hold(
        () => login(credentials),
        (result) => "user" in result && !isDenied(result.user),
      );
      if (!mounted.current) return;
      if ("twoFactorRequired" in outcome) navigate(ROUTES.AUTH.TWO_FACTOR);
      else finishLogin(outcome.user);
    } catch (failure) {
      // Mutation giữ lỗi cho khung báo; ở đây chỉ rung và tô đỏ khi sai thông tin đăng nhập.
      if (mounted.current && isCredentialError(failure)) {
        setRejected(true);
        shake(["email", "password"]);
      }
    }
  };

  const handleGoogleCredential = async (idToken: string, nonce: string): Promise<void> => {
    if (isPending) return;
    setMaintenanceDenied(false);
    try {
      const result = await googleSignIn.hold(
        () =>
          google.mutateAsync({
            idToken,
            nonce,
            rememberMe: getValues("rememberMe") ?? false,
            returnUrl: redirectUrl,
          }),
        (outcome) => outcome.signedIn && !isDenied(outcome.user),
      );
      if (!mounted.current) return;
      if (result.signedIn) finishLogin(result.user);
      else if ("twoFactorRequired" in result) navigate(ROUTES.AUTH.TWO_FACTOR);
      else setLink({ linkTicket: result.linkTicket, maskedEmail: result.maskedEmail });
    } catch {
      // Mutation giữ lỗi cho UI; không retry cookie mutation tự động.
    }
  };

  let googleProgress: "busy" | "done" | null = null;
  if (googleSignIn.done) googleProgress = "done";
  else if (google.isPending) googleProgress = "busy";

  if (link)
    return (
      <LinkGoogleAccountCard
        linkTicket={link.linkTicket}
        email={link.maskedEmail}
        rememberMe={getValues("rememberMe") ?? false}
        returnUrl={redirectUrl}
        onComplete={finishLogin}
        onCancel={() => {
          setLink(null);
          google.reset();
        }}
      />
    );

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 1. KHỐI THÔNG BÁO XÁC MINH EMAIL THÀNH CÔNG */}
      {isVerifiedBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-heritage-success-bg border border-heritage-success-border text-heritage-success space-y-1 text-left"
        >
          <div className="flex items-center gap-2 font-semibold text-sm text-heritage-success">
            <CheckCircle2 className="w-5 h-5 text-heritage-success flex-shrink-0" />
            <span>Xác minh email thành công!</span>
          </div>
          <p className="text-sm text-heritage-success leading-relaxed pl-7">
            Địa chỉ email của bạn đã được kích hoạt. Vui lòng nhập mật khẩu để đăng nhập vào tài
            khoản.
          </p>
        </div>
      )}

      {/* 1b. KHỐI NGỮ CẢNH LỜI MỜI NHẬN DI SẢN (Mockup 4) */}
      {invitationContext && (
        <div className="p-4 rounded-2xl bg-heritage-primary-light border border-heritage-primary-light text-heritage-primary space-y-2">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-heritage-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed space-y-1">
              <p className="font-semibold text-sm">Bạn đang mở liên kết lời mời.</p>
              <p className="text-heritage-muted">
                Đăng nhập để tiếp tục. Thông tin và hiệu lực lời mời cần được hệ thống xác minh.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. KHỐI TIÊU ĐỀ CHÍNH */}
      <div className="space-y-1 text-left">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-heritage-text">
          {adminOnly
            ? "Đăng nhập quản trị"
            : invitationContext
              ? "Đăng nhập để tiếp tục"
              : "Đăng nhập"}
        </h1>
        <p className="text-sm sm:text-sm text-heritage-muted">
          {adminOnly
            ? "Hệ thống đang bảo trì. Chỉ tài khoản Quản trị viên được đăng nhập."
            : invitationContext
              ? "Tiếp tục để xác minh tư cách người nhận tài sản."
              : getLoginSubtitle(fromReceive, fromReceiveAssets)}
        </p>
      </div>

      {(isError || maintenanceDenied) && (
        <div
          id="login-error"
          role="alert"
          className="rounded-xl border border-heritage-danger-border bg-heritage-danger-bg p-4 text-sm text-heritage-danger"
        >
          <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
          {maintenanceDenied
            ? MAINTENANCE_LOGIN_DENIED_MESSAGE
            : adminOnly
              ? getAdminLoginErrorMessage(error)
              : getLoginErrorMessage(error)}
        </div>
      )}

      {/* Lối quản trị chỉ có email và mật khẩu: tài khoản Admin tạo trực tiếp trên hệ thống, không qua Google. */}
      {!adminOnly && (
        <>
          <GoogleSignInButton
            disabled={isPending}
            progress={googleProgress}
            onCredential={handleGoogleCredential}
          />
          {google.isError && (
            <p role="alert" className="text-sm text-heritage-danger">
              {getGoogleErrorMessage(google.error)}
            </p>
          )}

          {/* Dải phân cách hoặc dùng email */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-heritage-sunken"></div>
            <span className="absolute bg-heritage-surface px-3 text-[0.875rem] text-heritage-subtle">
              hoặc dùng email
            </span>
          </div>
        </>
      )}

      {/* 6. FORM NHẬP EMAIL VÀ PASSWORD */}
      <form
        noValidate
        onSubmit={(event) =>
          void handleSubmit(onSubmit, (invalid) => shake(Object.keys(invalid)))(event)
        }
        className="space-y-4"
      >
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="username"
          disabled={isPending}
          error={errors.email?.message}
          rejected={rejected}
          rejectedBy="login-error"
          shake={shakes.email}
          {...field("email", { onEdit: clearRejected })}
        />

        <div className="space-y-1">
          <AuthField
            id="login-password"
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={isPending}
            error={errors.password?.message}
            rejected={rejected}
            rejectedBy="login-error"
            shake={shakes.password}
            end={
              <PasswordEye
                shown={showPassword}
                disabled={isPending}
                onToggle={() => setShowPassword(!showPassword)}
              />
            }
            {...field("password", { onEdit: clearRejected })}
          />
          {!adminOnly && (
            <div className="text-right">
              <Link
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                className="inline-block py-1 text-[0.875rem] text-heritage-gold hover:underline font-semibold"
              >
                Quên mật khẩu?
              </Link>
            </div>
          )}
        </div>

        {/* Nút bấm Đăng nhập */}
        <MorphButton
          pending={loginPending || passwordSignIn.done}
          done={passwordSignIn.done}
          disabled={isPending}
          pendingLabel="Đang xác thực..."
          doneLabel="Đã đăng nhập"
        >
          {invitationContext ? (
            <>
              <span>Đăng nhập và tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </MorphButton>
      </form>

      {/* 7. NÚT PASSKEY NẾU CÓ */}
      {onPasskeyClick && (
        <button
          type="button"
          onClick={onPasskeyClick}
          disabled={isPending}
          className="text-sm text-heritage-primary hover:underline font-semibold block mx-auto pt-1"
        >
          Hoặc đăng nhập nhanh bằng Passkey / FaceID
        </button>
      )}

      {/* 8. CHUYỂN HƯỚNG TẠO TÀI KHOẢN MỚI (không có ở lối quản trị: tài khoản Admin chỉ tạo trên hệ thống) */}
      <div
        hidden={adminOnly}
        className="pt-4 border-t border-heritage-sunken text-sm text-heritage-muted"
      >
        {invitationContext ? (
          <p>
            Chưa có tài khoản?{" "}
            <Link
              to={`${ROUTES.AUTH.REGISTER}?invitation=${encodeURIComponent(invitationContext.token)}`}
              className="text-heritage-primary font-bold hover:underline"
            >
              Tạo tài khoản để nhận
            </Link>
          </p>
        ) : (
          <p>
            Chưa có tài khoản?{" "}
            <Link
              to={keepRedirect ? registerFromReceive : ROUTES.AUTH.REGISTER}
              className="text-heritage-primary font-bold hover:underline"
            >
              {keepRedirect ? "Tạo tài khoản" : "Tạo kho miễn phí"}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
