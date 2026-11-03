import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Lock, Mail } from "lucide-react";
import { setCredentials } from "@/entities/user/model/authSlice";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { loginMethodsService } from "../api/loginMethodsService";
import { sessionAuthService } from "../api/authService";
import { loginMethodKeys, useLoginMethods } from "../model/useLoginMethods";
import { newPasswordFieldsSchema } from "../model/loginMethods.schema";
import { GoogleSignInButton } from "./GoogleSignInButton";

type DialogKind = "link-google" | "set-password" | "change-password";

/**
 * Quản lý phương thức đăng nhập của chính người dùng (BE mục 6.4): liên kết Google, thêm mật khẩu
 * (tài khoản đăng ký bằng Google) hoặc đổi mật khẩu. Google đã liên kết thì khóa, không gỡ được.
 * Mọi thay đổi phải xác thực lại nên mật khẩu và Google ID token chỉ nằm trong state của dialog: không cache, không Web Storage,
 * không log. Không optimistic: danh sách đọc lại sau BE.
 */
export function LoginMethodsPanel() {
  const query = useLoginMethods();
  const client = useQueryClient();
  const dispatch = useDispatch();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  if (query.isPending) return <p role="status">Đang tải phương thức đăng nhập…</p>;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Không đọc được phương thức đăng nhập.</p>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  const methods = query.data;
  const password = methods.find((item) => item.method === "PASSWORD");
  const google = methods.find((item) => item.method === "GOOGLE");

  /** Đọc lại danh sách và cờ `hasPassword` của hồ sơ trong phiên (đổi khi đặt/gỡ mật khẩu). */
  const done = () => {
    setDialog(null);
    void client.invalidateQueries({ queryKey: loginMethodKeys.all });
    void sessionAuthService
      .getSession()
      .then((user) => dispatch(setCredentials({ user: toAuthUserViewModel(user) })))
      .catch(() => undefined);
  };

  return (
    <section
      aria-labelledby="login-methods-title"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="login-methods-title" className="text-xl font-medium text-heritage-primary">
          Phương thức đăng nhập
        </h2>
        <Chip tone="neutral">{methods.length}/2 phương thức</Chip>
      </div>
      <ul className="mt-4">
        <MethodRow
          icon={<Mail className="size-5" aria-hidden="true" />}
          title="Email và mật khẩu"
          chip={
            password ? <Chip tone="success">Đang dùng</Chip> : <Chip tone="neutral">Chưa đặt</Chip>
          }
          description={
            password ? `Đăng nhập bằng ${password.email ?? "email của bạn"}` : "Chưa đặt mật khẩu"
          }
          actions={
            password ? (
              <button
                type="button"
                className={buttonStyles.outline}
                onClick={() => setDialog("change-password")}
              >
                Đổi mật khẩu
              </button>
            ) : (
              <button
                type="button"
                className={buttonStyles.gold}
                onClick={() => setDialog("set-password")}
              >
                Thêm mật khẩu
              </button>
            )
          }
        />
        <MethodRow
          icon={<GoogleMark />}
          title="Google"
          chip={
            google ? (
              <Chip tone="success">Đã liên kết</Chip>
            ) : (
              <Chip tone="neutral">Chưa liên kết</Chip>
            )
          }
          description={
            google
              ? `Tài khoản ${google.email ?? "Google"}`
              : "Chưa liên kết. Liên kết để đăng nhập nhanh hơn."
          }
          actions={
            google ? (
              <button
                type="button"
                disabled
                aria-label="Không thể gỡ liên kết Google"
                title="Liên kết Google đã được khóa, không thể gỡ."
                className={`${buttonStyles.outline} inline-flex items-center gap-2 disabled:border-transparent disabled:bg-[#ECE8DB] disabled:text-[#8A8574] disabled:opacity-100`}
              >
                <Lock className="size-4" aria-hidden="true" />
                Đã khóa
              </button>
            ) : (
              <button
                type="button"
                className={buttonStyles.gold}
                onClick={() => setDialog("link-google")}
              >
                Liên kết Google
              </button>
            )
          }
        />
      </ul>
      <p className="mt-4 flex items-start gap-2 text-xs text-heritage-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
        Bạn đang dùng {methods.length} phương thức. Thêm phương thức cần xác thực lại.
      </p>
      {dialog === "link-google" && (
        <LinkGoogleDialog onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog === "change-password" && (
        <ChangePasswordDialog onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog === "set-password" && (
        <SetPasswordDialog onClose={() => setDialog(null)} onDone={done} />
      )}
    </section>
  );
}

/** Chữ G trung tính trong vòng tròn trắng; nút đăng nhập Google chính thức nằm trong hộp thoại. */
function GoogleMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 items-center justify-center rounded-full bg-white text-sm font-bold text-[#3C4043]"
    >
      G
    </span>
  );
}

function MethodRow({
  icon,
  title,
  chip,
  description,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  chip: React.ReactNode;
  description: string;
  actions: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-b border-heritage-border py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ECE8DB] text-heritage-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {title}
            {chip}
          </p>
          <p className="break-words text-sm text-heritage-muted">{description}</p>
        </div>
      </div>
      {actions}
    </li>
  );
}

interface DialogProps {
  onClose: () => void;
  onDone: () => void;
}

const DIALOG_CLASS = "max-w-lg bg-[#FBFAF5] p-7";
const DIALOG_TITLE = "text-xl font-semibold text-heritage-primary";

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={128}
        disabled={disabled}
        className="mt-1 min-h-11 bg-white font-normal placeholder:text-heritage-muted"
      />
    </label>
  );
}

/** Lỗi trong hộp thoại: khung hồng, đọc ra ngay (role=alert). */
function ErrorLine({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
      {message}
    </p>
  ) : null;
}

function CancelButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" className={buttonStyles.outline} onClick={onClick} disabled={disabled}>
      Hủy
    </button>
  );
}

/**
 * Liên kết Google theo hai bước: xác nhận mật khẩu hiện tại (BE kiểm tra, không đổi dữ liệu), rồi mới
 * hiện nút Google. Sửa mật khẩu sau khi đã xác nhận thì phải xác nhận lại. Lúc liên kết thật BE vẫn
 * kiểm tra lại mật khẩu, nên bước đầu chỉ là chặn sớm cho người dùng.
 */
function LinkGoogleDialog({ onClose, onDone }: DialogProps) {
  const action = usePrivateAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const verify = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword || verified) return;
    void action.execute(
      () => loginMethodsService.verifyPassword({ currentPassword }),
      () => setVerified(true),
    );
  };
  const submit = async (idToken: string, nonce: string) => {
    await action.execute(
      () => loginMethodsService.linkGoogle({ idToken, nonce, currentPassword }),
      () => onDone(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Liên kết Google</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Nhập mật khẩu hiện tại và xác nhận, rồi chọn tài khoản Google muốn liên kết.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={verify} className="space-y-4">
          <PasswordField
            id="link-google-password"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value);
              setVerified(false);
            }}
            autoComplete="current-password"
            disabled={action.pending}
          />
          {!verified && (
            <button
              type="submit"
              className={buttonStyles.gold}
              disabled={action.pending || currentPassword.length === 0}
            >
              {action.pending ? "Đang kiểm tra…" : "Xác nhận mật khẩu"}
            </button>
          )}
        </form>
        <ErrorLine message={action.error} />
        {verified ? (
          <>
            <p role="status" className="text-sm text-[#1F7A55]">
              Mật khẩu đúng. Bấm tài khoản Google để liên kết.
            </p>
            <GoogleSignInButton disabled={action.pending} onCredential={submit} />
          </>
        ) : (
          !action.error && (
            <p className="text-sm text-heritage-muted">Xác nhận mật khẩu để hiện nút Google.</p>
          )
        )}
        <DialogFooter>
          <CancelButton onClick={onClose} disabled={action.pending} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Đổi mật khẩu: mật khẩu hiện tại + mật khẩu mới (BE xác thực lại, không đổi phiên đăng nhập). */
function ChangePasswordDialog({ onClose, onDone }: DialogProps) {
  const action = usePrivateAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const fields = newPasswordFieldsSchema.safeParse({ newPassword, confirmPassword });
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
  // Lỗi "nhập lại không khớp" chỉ hiện sau khi người dùng đã gõ ô nhập lại hoặc bấm gửi.
  const fieldIssue =
    touched && !fields.success
      ? fields.error.issues.find((issue) => confirmTouched || issue.path[0] !== "confirmPassword")
      : undefined;
  const problem = sameAsCurrent
    ? "Mật khẩu mới không được trùng mật khẩu hiện tại."
    : (fieldIssue?.message ?? "");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword || sameAsCurrent) return;
    if (!fields.success) {
      setTouched(true);
      setConfirmTouched(true);
      return;
    }
    void action.execute(
      () => loginMethodsService.changePassword({ currentPassword, newPassword, confirmPassword }),
      () => onDone(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Đổi mật khẩu</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Nhập mật khẩu hiện tại và mật khẩu mới (ít nhất 8 ký tự).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <PasswordField
            id="change-password-current"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            disabled={action.pending}
          />
          <PasswordField
            id="change-password-new"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              setTouched(true);
            }}
            autoComplete="new-password"
            disabled={action.pending}
          />
          <PasswordField
            id="change-password-confirm"
            label="Nhập lại mật khẩu mới"
            placeholder="Nhập lại"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setTouched(true);
              setConfirmTouched(true);
            }}
            autoComplete="new-password"
            disabled={action.pending}
          />
          <ErrorLine message={problem || action.error} />
          <DialogFooter>
            <CancelButton onClick={onClose} disabled={action.pending} />
            <button
              type="submit"
              className={buttonStyles.gold}
              disabled={action.pending || !currentPassword || !newPassword || sameAsCurrent}
            >
              {action.pending ? "Đang đổi…" : "Đổi mật khẩu"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SetPasswordDialog({ onClose, onDone }: DialogProps) {
  const action = usePrivateAction();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const fields = newPasswordFieldsSchema.safeParse({ newPassword, confirmPassword });
  const problem = touched && !fields.success ? fields.error.issues[0].message : "";
  const submit = async (googleIdToken: string, nonce: string) => {
    if (!fields.success) {
      setTouched(true);
      return;
    }
    await action.execute(
      () => loginMethodsService.setPassword({ googleIdToken, nonce, newPassword, confirmPassword }),
      () => onDone(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Thêm mật khẩu</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Bạn sẽ đăng nhập được bằng cả Google và mật khẩu. Mật khẩu ít nhất 8 ký tự.
          </DialogDescription>
        </DialogHeader>
        <PasswordField
          id="set-password-new"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChange={(value) => {
            setNewPassword(value);
            setTouched(true);
          }}
          autoComplete="new-password"
          disabled={action.pending}
        />
        <PasswordField
          id="set-password-confirm"
          label="Nhập lại mật khẩu"
          placeholder="Nhập lại"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            setTouched(true);
          }}
          autoComplete="new-password"
          disabled={action.pending}
        />
        <ErrorLine message={problem} />
        {/* BE bắt xác thực lại bằng Google ID token mới trước khi đặt mật khẩu (mục 6.4). */}
        <p className="text-sm text-heritage-muted">
          Bước cuối: xác nhận bằng tài khoản Google đã liên kết để đặt mật khẩu.
        </p>
        <GoogleSignInButton disabled={action.pending || !fields.success} onCredential={submit} />
        <ErrorLine message={action.error} />
        <DialogFooter>
          <CancelButton onClick={onClose} disabled={action.pending} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
