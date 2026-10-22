import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { KeyRound, Lock } from "lucide-react";
import { setCredentials } from "@/entities/user/model/authSlice";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { loginMethodsService } from "../api/loginMethodsService";
import { sessionAuthService } from "../api/authService";
import { loginMethodKeys, useLoginMethods } from "../model/useLoginMethods";
import { newPasswordFieldsSchema, type LoginMethod } from "../model/loginMethods.schema";
import { GoogleSignInButton } from "./GoogleSignInButton";

type DialogKind = "link-google" | "unlink-google" | "set-password" | "remove-password";

const formatDate = (value: string | null) => (value ? formatDateTime(value) : "Chưa có");

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

  return (
    <section
      aria-labelledby="login-methods-title"
      className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-6"
    >
      <div>
        <h2 id="login-methods-title" className="text-lg font-semibold">
          Phương thức đăng nhập
        </h2>
        <p className="mt-1 text-sm text-heritage-muted">
          Luôn phải còn ít nhất một phương thức. Thay đổi cần xác thực lại.
        </p>
      </div>
      <ul className="space-y-3">
        <MethodRow
          icon={<Lock className="size-5" aria-hidden="true" />}
          title="Mật khẩu"
          method={password}
          emptyText="Chưa đặt mật khẩu"
          actions={
            password ? (
              <Button
                type="button"
                variant="outline"
                disabled={!password.canRemove || !google}
                onClick={() => setDialog("remove-password")}
              >
                Gỡ mật khẩu
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setDialog("set-password")}>
                Đặt mật khẩu
              </Button>
            )
          }
        />
        <MethodRow
          icon={<KeyRound className="size-5" aria-hidden="true" />}
          title="Google"
          method={google}
          emptyText="Chưa liên kết"
          actions={
            google ? (
              <Button
                type="button"
                variant="outline"
                disabled={!google.canRemove}
                onClick={() => setDialog("unlink-google")}
              >
                Gỡ liên kết Google
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setDialog("link-google")}>
                Liên kết Google
              </Button>
            )
          }
        />
      </ul>
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

function MethodRow({
  icon,
  title,
  method,
  emptyText,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  method: LoginMethod | undefined;
  emptyText: string;
  actions: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-heritage-border p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-heritage-gold">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {method ? (
            <p className="break-words text-xs text-heritage-muted">
              {method.email ? `${method.email} · ` : ""}Thêm lúc {formatDate(method.linkedAt)}
              {method.lastUsedAt ? ` · Dùng gần nhất ${formatDate(method.lastUsedAt)}` : ""}
            </p>
          ) : (
            <p className="text-xs text-heritage-muted">{emptyText}</p>
          )}
          {method && !method.canRemove && (
            <p className="text-xs text-heritage-muted">Phương thức cuối cùng, chưa gỡ được.</p>
          )}
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

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <label className="block text-sm" htmlFor={id}>
      {label}
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        maxLength={128}
        disabled={disabled}
        className="mt-1"
      />
    </label>
  );
}

function ErrorLine({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

function LinkGoogleDialog({ onClose, onDone }: DialogProps) {
  const action = usePrivateAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const submit = async (idToken: string, nonce: string) => {
    await action.execute(
      () => loginMethodsService.linkGoogle({ idToken, nonce, currentPassword }),
      () => onDone(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liên kết Google</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu hiện tại, rồi chọn tài khoản Google muốn liên kết.
          </DialogDescription>
        </DialogHeader>
        <PasswordField
          id="link-google-password"
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          disabled={action.pending}
        />
        <GoogleSignInButton
          disabled={action.pending || currentPassword.length === 0}
          onCredential={submit}
        />
        {currentPassword.length === 0 && (
          <p className="text-xs text-heritage-muted">Nhập mật khẩu để bật nút Google.</p>
        )}
        <ErrorLine message={action.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
            Hủy
          </Button>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gỡ liên kết Google</DialogTitle>
          <DialogDescription>
            Sau khi gỡ, bạn chỉ đăng nhập bằng email và mật khẩu. Nhập mật khẩu hiện tại để xác
            nhận.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <PasswordField
            id="unlink-google-password"
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            disabled={action.pending}
          />
          <ErrorLine message={action.error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={action.pending || !currentPassword}>
              {action.pending ? "Đang gỡ…" : "Gỡ liên kết"}
            </Button>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt mật khẩu</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu mới, rồi đăng nhập lại Google để xác nhận đúng tài khoản đã liên kết.
          </DialogDescription>
        </DialogHeader>
        <PasswordField
          id="set-password-new"
          label="Mật khẩu mới (8–128 ký tự)"
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
          label="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            setTouched(true);
          }}
          autoComplete="new-password"
          disabled={action.pending}
        />
        <ErrorLine message={problem} />
        <GoogleSignInButton disabled={action.pending || !fields.success} onCredential={submit} />
        <ErrorLine message={action.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
            Hủy
          </Button>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gỡ mật khẩu</DialogTitle>
          <DialogDescription>
            Sau khi gỡ, bạn chỉ đăng nhập bằng Google. Cần mật khẩu hiện tại và đăng nhập lại Google
            để xác nhận.
          </DialogDescription>
        </DialogHeader>
        <PasswordField
          id="remove-password-current"
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          disabled={action.pending}
        />
        <GoogleSignInButton
          disabled={action.pending || currentPassword.length === 0}
          onCredential={submit}
        />
        <ErrorLine message={action.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
            Hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
