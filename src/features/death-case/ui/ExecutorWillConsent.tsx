import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { readSigningFailure, signingFailureText } from "@/shared/lib/signingFailure";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";
import type { ExecutorVault } from "../model/deathCase.schema";
import { executorVaultsKey } from "../model/useExecutorVaults";
import { ExecutorWillButton } from "./ExecutorWillButton";

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
  const [read, setRead] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function respond(accept: boolean): void {
    setPasswordError(null);
    void action.execute(
      () => deathCaseService.respondWill(vault.vaultId, accept, versionNo, password),
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
        <ExecutorWillButton vault={vault} onOpen={() => setRead(true)} />
        {!read && <p className="text-heritage-muted">Mở biên bản và đọc trước khi trả lời.</p>}
        <div className="max-w-md space-y-1">
          <label htmlFor={passwordId} className="block font-semibold">
            Mật khẩu tài khoản
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            maxLength={128}
            className="min-h-11 w-full rounded-xl border border-heritage-border bg-white px-4 text-sm"
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
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonStyles.dark}
            disabled={action.pending || !read || password.length === 0}
            onClick={() => respond(true)}
          >
            Đồng ý và ký
          </button>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending || !read}
            onClick={() => respond(false)}
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
    </Panel>
  );
}
