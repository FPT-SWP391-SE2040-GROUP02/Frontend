import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { readSigningFailure, signingFailureText } from "@/shared/lib/signingFailure";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";
import type { ExecutorVault } from "../model/deathCase.schema";
import { executorVaultsKey } from "../model/useExecutorVaults";
import { ExecutorWillButton } from "./ExecutorWillButton";
import { ActionButton } from "@/shared/ui/ActionButton";
import { DeclineConfirmDialog } from "@/shared/ui/DeclineConfirmDialog";
import { SigningStep, SigningSteps, type SigningStepState } from "@/shared/ui/SigningSteps";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

/**
 * Chủ kho ký lại biên bản phân chia: Người thực thi phải mở xem rồi đồng ý (ký bằng mật khẩu) hoặc không đồng ý.
 * Đã không đồng ý thì chỉ nhắc lại, vẫn giữ vai theo bản đã ký trước. Không có gì để trả lời thì không hiện.
 */
export function ExecutorWillConsent({ vault }: { vault: ExecutorVault }) {
  const versionNo = vault.willVersionNo;
  if (versionNo && vault.declinedWillVersionNo === versionNo) {
    return (
      <Notice tone="warning" title={`Bạn không đồng ý biên bản phiên bản ${versionNo}`}>
        Chủ kho đã được báo. Bạn vẫn giữ vai theo bản đã ký trước cho tới khi có người thay hoặc Chủ
        kho ký bản khác.
      </Notice>
    );
  }
  if (!versionNo || !vault.willConsentRequired) return null;
  // key: có phiên bản mới hơn thì phải mở xem và nhập lại từ đầu.
  return <ConsentForm key={versionNo} vault={vault} versionNo={versionNo} />;
}

function ConsentForm({ vault, versionNo }: { vault: ExecutorVault; versionNo: number }) {
  const passwordId = useId();
  const errorId = useId();
  const client = useQueryClient();
  const action = usePrivateAction();
  const success = useSuccessHold();
  const [accepting, setAccepting] = useState(false);
  const [askingDecline, setAskingDecline] = useState(false);
  const [read, setRead] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function respond(accept: boolean): void {
    setPasswordError(null);
    setAccepting(accept);
    const send = () => deathCaseService.respondWill(vault.vaultId, accept, versionNo, password);
    let operation = send;
    if (accept) {
      operation = () => success.hold(send);
    }
    void action.execute(
      operation,
      () => {
        setPassword("");
        void client.invalidateQueries({ queryKey: executorVaultsKey });
      },
      (error, fieldErrors) => {
        const failure = readSigningFailure(error);
        if (failure !== null) {
          setPassword("");
          setPasswordError(signingFailureText(failure, "ký biên bản"));
          return;
        }
        if (fieldErrors.password && fieldErrors.password.length > 0) {
          setPasswordError("Vui lòng nhập mật khẩu tài khoản để ký.");
          return;
        }
        // Chủ kho vừa ký bản khác hoặc kế hoạch đổi trạng thái: tải lại tờ mới nhất.
        void client.invalidateQueries({ queryKey: executorVaultsKey });
      },
    );
  }

  // Đọc biên bản xong mới mở khóa bước nhập mật khẩu.
  let readState: SigningStepState = "current";
  let passwordState: SigningStepState = "locked";
  let lockedPlaceholder: string | undefined = "Mở biên bản trước";
  if (read) {
    readState = "done";
    passwordState = "current";
    lockedPlaceholder = undefined;
  }

  let describedBy: string | undefined;
  if (passwordError !== null) {
    describedBy = errorId;
  }
  return (
    <Panel title="Biên bản phân chia có phiên bản mới" labelledBy={`will-consent-${vault.vaultId}`}>
      <div className="space-y-4 text-sm leading-6">
        <p>
          {vault.ownerFullName} đã ký phiên bản {versionNo}. Đọc biên bản rồi chọn đồng ý hoặc
          không. Nếu không đồng ý, bạn vẫn giữ vai theo bản đã ký trước cho tới khi có người thay.
        </p>
        <SigningSteps>
          <SigningStep number={1} title="Đọc biên bản" state={readState}>
            <ExecutorWillButton vault={vault} primary={!read} onOpen={() => setRead(true)} />
          </SigningStep>
          <SigningStep number={2} title="Ký bằng mật khẩu" state={passwordState}>
            <div className="max-w-md space-y-1">
              <label htmlFor={passwordId} className="block font-semibold">
                Mật khẩu tài khoản
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                maxLength={128}
                className="min-h-11 w-full rounded-xl border border-heritage-border bg-white px-4 text-sm disabled:cursor-not-allowed disabled:bg-heritage-border/40 disabled:opacity-100 disabled:placeholder:text-heritage-muted"
                placeholder={lockedPlaceholder}
                value={password}
                disabled={action.pending || !read}
                aria-invalid={passwordError !== null}
                aria-describedby={describedBy}
                onChange={(event) => setPassword(event.target.value)}
              />
              {passwordError !== null && (
                <p id={errorId} role="alert" className="text-destructive">
                  {passwordError}
                </p>
              )}
            </div>
          </SigningStep>
        </SigningSteps>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            className={buttonStyles.dark}
            disabled={action.pending || !read || password.length === 0}
            onClick={() => respond(true)}
            pending={action.pending && accepting}
            done={success.done}
            pendingLabel="Đang ký…"
            doneLabel="Đã ký"
          >
            Đồng ý và ký
          </ActionButton>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending || !read}
            onClick={() => setAskingDecline(true)}
          >
            Không đồng ý
          </button>
        </div>
        {action.error && passwordError === null && (
          <p role="alert" className="text-destructive">
            {action.error}
          </p>
        )}
      </div>
      {askingDecline && (
        <DeclineConfirmDialog
          title={`Không đồng ý biên bản phiên bản ${versionNo}?`}
          description={`${vault.ownerFullName} sẽ được báo. Bạn vẫn giữ vai theo bản đã ký trước, và màn hình không còn nút đồng ý cho phiên bản này.`}
          confirmLabel="Xác nhận không đồng ý"
          onClose={() => setAskingDecline(false)}
          onConfirm={() => {
            setAskingDecline(false);
            respond(false);
          }}
        />
      )}
    </Panel>
  );
}
