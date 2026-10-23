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

type DialogKind = "link-google" | "unlink-google" | "set-password" | "remove-password";

/**
 * Quản lý phương thức đăng nhập của chính người dùng (BE mục 6.4): liên kết/gỡ Google, đặt/gỡ mật
 * khẩu. Mọi thay đổi phải xác thực lại nên mật khẩu và Google ID token chỉ nằm trong state của
 * dialog: không cache, không Web Storage, không log. Không optimistic: danh sách đọc lại sau BE.
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

  const lastMethod = methods.length === 1;
  let lastMethodHint = "Hãy liên kết Google";
  if (google && !password) lastMethodHint = "Hãy đặt mật khẩu";

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
      {lastMethod && (
        <p role="status" className="mt-4 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          Đây là phương thức đăng nhập cuối cùng nên không thể gỡ. {lastMethodHint} trước.
        </p>
      )}
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
                disabled={!password.canRemove || !google}
                onClick={() => setDialog("remove-password")}
              >
                Gỡ mật khẩu
              </button>
            ) : (
              <button
                type="button"
                className={buttonStyles.gold}
                onClick={() => setDialog("set-password")}
              >
                Đặt mật khẩu
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
                aria-label="Gỡ liên kết Google"
                className={`${buttonStyles.outline} disabled:border-transparent disabled:bg-[#ECE8DB] disabled:text-[#8A8574] disabled:opacity-100`}
                disabled={!google.canRemove}
                onClick={() => setDialog("unlink-google")}
              >
                Gỡ liên kết
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
        Bạn đang dùng {methods.length} phương thức. Bạn cần giữ ít nhất một phương thức. Gỡ hoặc
        thêm phương thức cần xác thực lại.
      </p>
      {dialog === "link-google" && (
        <LinkGoogleDialog onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog === "unlink-google" && (
        <UnlinkGoogleDialog onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog === "set-password" && (
        <SetPasswordDialog onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog === "remove-password" && (
        <RemovePasswordDialog onClose={() => setDialog(null)} onDone={done} />
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">{children}</p>;
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

function UnlinkGoogleDialog({ onClose, onDone }: DialogProps) {
  const action = usePrivateAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword) return;
    void action.execute(
      () => loginMethodsService.unlinkGoogle({ currentPassword }),
      () => onDone(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Gỡ liên kết Google?</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Sau khi gỡ, bạn chỉ đăng nhập bằng email và mật khẩu. Bạn nhập mật khẩu hiện tại để xác
            nhận.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <PasswordField
            id="unlink-google-password"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            disabled={action.pending}
          />
          {action.error ? (
            <ErrorLine message={action.error} />
          ) : (
            <InfoBox>
              Mật khẩu sai sẽ báo “Mật khẩu hiện tại chưa đúng” và bạn vẫn đang đăng nhập.
            </InfoBox>
          )}
          <DialogFooter>
            <CancelButton onClick={onClose} disabled={action.pending} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#A32119] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#8A1B14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50"
              disabled={action.pending || !currentPassword}
            >
              {action.pending ? "Đang gỡ…" : "Gỡ liên kết"}
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
          <DialogTitle className={DIALOG_TITLE}>Đặt mật khẩu</DialogTitle>
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

function RemovePasswordDialog({ onClose, onDone }: DialogProps) {
  const action = usePrivateAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const submit = async (googleIdToken: string, nonce: string) => {
    await action.execute(
      () => loginMethodsService.removePassword({ currentPassword, googleIdToken, nonce }),
      () => onDone(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Gỡ mật khẩu?</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Sau khi gỡ, bạn chỉ đăng nhập bằng Google. Cần mật khẩu hiện tại và đăng nhập lại Google
            để xác nhận.
          </DialogDescription>
        </DialogHeader>
        <PasswordField
          id="remove-password-current"
          label="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu hiện tại"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          disabled={action.pending}
        />
        <ErrorLine message={action.error} />
        <GoogleSignInButton
          disabled={action.pending || currentPassword.length === 0}
          onCredential={submit}
        />
        <DialogFooter>
          <CancelButton onClick={onClose} disabled={action.pending} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
