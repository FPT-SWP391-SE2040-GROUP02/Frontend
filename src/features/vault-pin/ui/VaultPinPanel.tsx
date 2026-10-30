import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Chip, Notice, Panel, buttonStyles } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { vaultPinKeys, useVaultPinStatus } from "../model/useVaultPin";
import type { VaultPinStatus } from "../model/vaultPin.schema";
import { ChangePinForm, ForgotPinForm, SetPinForm } from "./PinForms";

type Mode = "idle" | "set" | "change" | "forgot";

const NOTICES: Record<Exclude<Mode, "idle">, string> = {
  set: "Đã đặt mã PIN cho kho. Bạn sẽ nhận email thông báo.",
  change: "Đã đổi mã PIN. Bạn sẽ nhận email thông báo.",
  forgot: "Đã đặt lại mã PIN. Bạn sẽ nhận email thông báo.",
};

/**
 * Quản lý mã PIN của kho trong Cài đặt tài khoản: đặt lần đầu, đổi khi còn nhớ PIN cũ, đặt lại khi quên
 * (nhập mật khẩu tài khoản, có hiệu lực ngay). Chỉ cập nhật trạng thái sau khi Backend xác nhận.
 */
export function VaultPinPanel({ vaultId }: { vaultId: string }) {
  const queryClient = useQueryClient();
  const status = useVaultPinStatus(vaultId);
  const [mode, setMode] = useState<Mode>("idle");
  const [notice, setNotice] = useState("");

  const finished = (done: Exclude<Mode, "idle">, next: VaultPinStatus) => {
    queryClient.setQueryData(vaultPinKeys.status(vaultId), next);
    setMode("idle");
    setNotice(NOTICES[done]);
  };
  const open = (next: Mode) => {
    setNotice("");
    setMode(next);
  };

  let body;
  if (status.isPending) {
    body = <p className="text-sm text-heritage-muted">Đang tải trạng thái mã PIN…</p>;
  } else if (status.isError) {
    body = (
      <Notice
        tone="danger"
        role="alert"
        title="Không tải được trạng thái mã PIN"
        action={
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => void status.refetch()}
          >
            Thử lại
          </button>
        }
      />
    );
  } else {
    const data = status.data;
    const locked = data.lockedUntil !== null;
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Chip tone={data.isSet ? "success" : "warning"}>
            {data.isSet ? "Đã đặt" : "Chưa đặt"}
          </Chip>
          {locked && <Chip tone="danger">Đang khóa đến {formatDateTime(data.lockedUntil)}</Chip>}
          {data.isSet && !locked && data.attemptsRemaining !== null && (
            <span className="text-xs text-heritage-muted">
              Còn {data.attemptsRemaining} lần nhập sai trước khi bị khóa tạm.
            </span>
          )}
        </div>
        {!data.isSet && data.isRequired && (
          <Notice tone="warning" role="status" title="Kho đã có tài sản nhưng chưa có mã PIN">
            Hãy đặt mã PIN để tiếp tục thêm tài sản và bảo vệ các thao tác nhạy cảm.
          </Notice>
        )}
        {notice && (
          <Notice tone="success" role="status">
            {notice}
          </Notice>
        )}
        {mode === "idle" && (
          <div className="flex flex-wrap gap-3">
            {!data.isSet && (
              <button type="button" className={buttonStyles.dark} onClick={() => open("set")}>
                Đặt mã PIN
              </button>
            )}
            {data.isSet && (
              <>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  onClick={() => open("change")}
                >
                  Đổi mã PIN
                </button>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  onClick={() => open("forgot")}
                >
                  Quên mã PIN
                </button>
              </>
            )}
          </div>
        )}
        {mode === "set" && (
          <SetPinForm
            vaultId={vaultId}
            onDone={(_pin, next) => finished("set", next)}
            onCancel={() => setMode("idle")}
          />
        )}
        {mode === "change" && (
          <ChangePinForm
            vaultId={vaultId}
            onDone={(next) => finished("change", next)}
            onCancel={() => setMode("idle")}
          />
        )}
        {mode === "forgot" && (
          <>
            <p className="text-sm text-heritage-muted">
              Nhập mật khẩu tài khoản để đặt mã PIN mới. Mã PIN mới có hiệu lực ngay.
            </p>
            <ForgotPinForm
              vaultId={vaultId}
              onDone={(_pin, next) => finished("forgot", next)}
              onCancel={() => setMode("idle")}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <Panel title="Mã PIN của kho" labelledBy="vault-pin-heading">
      <p className="mb-4 text-sm text-heritage-muted">
        Mã PIN gồm 6 chữ số, được hỏi trước khi tải nội dung tài sản, xóa tài sản, đổi người nhận,
        đổi Người thực hiện hoặc xóa gói. PIN chỉ có bạn biết, người khác dùng tài khoản của bạn
        cũng không làm được các việc này.
      </p>
      {body}
    </Panel>
  );
}
