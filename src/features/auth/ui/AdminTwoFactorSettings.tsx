import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CustomCheckbox } from "@/shared/ui/CustomCheckbox";
import { twoFactorService } from "../api/twoFactorService";
import { twoFactorKeys, useTwoFactorStatus } from "../model/useTwoFactorSettings";
import { recoveryCodeSchema, totpCodeSchema, type TwoFactorSetup } from "../model/twoFactor.schema";

type Step =
  | { kind: "idle" }
  | { kind: "setup"; setup: TwoFactorSetup }
  | { kind: "codes"; recoveryCodes: string[] }
  | { kind: "disable" };

/** Khóa Base32 chia nhóm 4 ký tự để nhập tay dễ hơn. */
const groupSecret = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

/**
 * Bật/tắt xác thực hai bước TOTP cho Admin (BE mục 6.2a). Bí mật và mã khôi phục chỉ nằm trong
 * state của component: không Web Storage, không log; mã khôi phục chỉ hiện một lần.
 */
export function AdminTwoFactorSettings() {
  const client = useQueryClient();
  const status = useTwoFactorStatus(true);
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const action = usePrivateAction();

  const refresh = () => void client.invalidateQueries({ queryKey: twoFactorKeys.status });
  const reset = () => {
    setStep({ kind: "idle" });
    setCode("");
    setSaved(false);
    setCopied(false);
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const startSetup = () =>
    void action.execute(
      () => twoFactorService.setup(),
      (setup) => {
        setCode("");
        setStep({ kind: "setup", setup });
        refresh();
      },
    );
  const confirmEnable = () => {
    if (!totpCodeSchema.safeParse(code.trim()).success) return;
    void action.execute(
      () => twoFactorService.enable(code),
      ({ recoveryCodes }) => {
        setCode("");
        setCopied(false);
        setSaved(false);
        setStep({ kind: "codes", recoveryCodes });
        refresh();
      },
    );
  };
  const confirmDisable = () => {
    const value = code.trim();
    if (!totpCodeSchema.safeParse(value).success && !recoveryCodeSchema.safeParse(value).success)
      return;
    void action.execute(
      () => twoFactorService.disable(code),
      () => {
        reset();
        refresh();
      },
    );
  };

  if (status.isPending) return <p role="status">Đang tải trạng thái xác thực hai bước…</p>;
  if (status.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Không đọc được trạng thái xác thực hai bước.</p>
        <Button variant="outline" onClick={() => void status.refetch()}>
          Thử lại
        </Button>
      </div>
    );

  const { enabled, recoveryCodesRemaining } = status.data;
  const error = action.error ? (
    <p role="alert" className="text-sm text-destructive">
      {action.error}
    </p>
  ) : null;

  return (
    <section
      aria-labelledby="two-factor-settings-title"
      className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-5"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-heritage-gold" aria-hidden="true" />
        <div>
          <h2 id="two-factor-settings-title" className="text-base font-semibold">
            Xác thực hai bước (TOTP)
          </h2>
          <p className="text-sm text-heritage-muted">
            {enabled
              ? `Đang bật. Còn ${recoveryCodesRemaining} mã khôi phục chưa dùng.`
              : "Chưa bật. Khi bật, mọi lần đăng nhập Admin cần thêm mã từ ứng dụng xác thực."}
          </p>
        </div>
      </div>

      {step.kind === "idle" && !enabled && (
        <div className="space-y-2">
          {status.data.setupPending && (
            <p role="status" className="text-sm text-heritage-muted">
              Bạn đã tạo khóa nhưng chưa xác nhận. Khóa chỉ hiện một lần nên cần tạo khóa mới.
            </p>
          )}
          {error}
          <Button type="button" onClick={startSetup} disabled={action.pending}>
            {action.pending ? "Đang tạo khóa…" : "Bật xác thực hai bước"}
          </Button>
        </div>
      )}

      {step.kind === "setup" && (
        <div className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Mở ứng dụng xác thực (Google Authenticator, Authy…) và thêm tài khoản thủ công.</li>
            <li>Nhập khóa bên dưới (loại: theo thời gian). Khóa chỉ hiện một lần.</li>
            <li>Nhập mã 6 số đang hiện trong ứng dụng để xác nhận.</li>
          </ol>
          <div className="space-y-1">
            <p className="text-xs text-heritage-muted">Khóa nhập thủ công</p>
            <p className="break-all rounded-lg bg-heritage-canvas p-3 font-mono text-sm tracking-wider">
              {groupSecret(step.setup.secret)}
            </p>
            <Button type="button" variant="outline" onClick={() => void copy(step.setup.secret)}>
              <KeyRound className="size-4" aria-hidden="true" />
              {copied ? "Đã sao chép khóa" : "Sao chép khóa"}
            </Button>
          </div>
          <label className="block text-sm" htmlFor="two-factor-enable-code">
            Mã 6 số
          </label>
          <Input
            id="two-factor-enable-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            disabled={action.pending}
          />
          {error}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={confirmEnable}
              disabled={action.pending || !totpCodeSchema.safeParse(code).success}
            >
              {action.pending ? "Đang xác nhận…" : "Xác nhận và bật"}
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={action.pending}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {step.kind === "codes" && (
        <div className="space-y-3">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Đã bật xác thực hai bước. Lưu 8 mã khôi phục này ở nơi an toàn: mỗi mã dùng được một
              lần và sẽ không hiện lại. Mất cả ứng dụng lẫn mã khôi phục thì cần Admin khác xử lý
              ngoài hệ thống.
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {step.recoveryCodes.map((item) => (
              <li
                key={item}
                className="rounded-lg bg-heritage-canvas p-2 text-center font-mono text-sm tracking-wider"
              >
                {item}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copy(step.recoveryCodes.join("\n"))}
          >
            {copied ? "Đã sao chép mã" : "Sao chép các mã"}
          </Button>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi đã lưu các mã khôi phục."
            checked={saved}
            onChange={(event) => setSaved(event.target.checked)}
          />
          <Button type="button" onClick={reset} disabled={!saved}>
            Xong
          </Button>
        </div>
      )}

      {step.kind === "idle" && enabled && (
        <div className="space-y-2">
          {error}
          <Button type="button" variant="outline" onClick={() => setStep({ kind: "disable" })}>
            Tắt xác thực hai bước
          </Button>
        </div>
      )}

      {step.kind === "disable" && (
        <div className="space-y-3">
          <p className="text-sm">
            Nhập mã 6 số từ ứng dụng hoặc một mã khôi phục để tắt. Sau khi tắt, đăng nhập Admin chỉ
            còn dùng mật khẩu hoặc Google.
          </p>
          <label className="block text-sm" htmlFor="two-factor-disable-code">
            Mã xác thực hoặc mã khôi phục
          </label>
          <Input
            id="two-factor-disable-code"
            autoComplete="one-time-code"
            maxLength={13}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={action.pending}
          />
          {error}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={confirmDisable}
              disabled={action.pending || !code.trim()}
            >
              {action.pending ? "Đang tắt…" : "Xác nhận tắt"}
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={action.pending}>
              Hủy
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
