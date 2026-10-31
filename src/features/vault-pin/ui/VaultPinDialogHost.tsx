import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  registerVaultPinHandler,
  type VaultPinHandler,
  type VaultPinPromptRequest,
} from "@/shared/api/vaultPin";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { vaultPinService } from "../api/vaultPinService";
import { vaultPinKeys } from "../model/useVaultPin";
import { PIN_MAX_ATTEMPTS } from "../model/pinRules";
import { EnterPinForm, ForgotPinForm, SetPinForm } from "./PinForms";

type Prompt =
  | {
      id: number;
      kind: "enter";
      request: VaultPinPromptRequest;
      resolve: (pin: string | null) => void;
    }
  | { id: number; kind: "set"; vaultId: string; resolve: (pin: string | null) => void }
  | { id: number; kind: "locked"; lockedUntil?: string };

function enterMessage(request: VaultPinPromptRequest): string {
  if (request.reason === "invalid") {
    const left = request.attemptsRemaining;
    return left === undefined
      ? "Mã PIN chưa đúng. Vui lòng nhập lại."
      : `Mã PIN chưa đúng. Còn ${left} trên ${PIN_MAX_ATTEMPTS} lần thử trước khi bị khóa tạm.`;
  }
  return "Thao tác này cần mã PIN của kho. Nhập mã PIN để tiếp tục.";
}

function EnterPinPrompt({
  prompt,
  onSubmit,
  onCancel,
  onForgotDone,
}: {
  prompt: Extract<Prompt, { kind: "enter" }>;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  onForgotDone: (pin: string) => void;
}) {
  const [forgot, setForgot] = useState(false);
  if (forgot) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Quên mã PIN</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu tài khoản và đặt mã PIN mới. Mã PIN mới có hiệu lực ngay và bạn sẽ nhận
            email thông báo.
          </DialogDescription>
        </DialogHeader>
        <ForgotPinForm
          vaultId={prompt.request.vaultId}
          onDone={(pin) => onForgotDone(pin)}
          onCancel={() => setForgot(false)}
        />
      </>
    );
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nhập mã PIN của kho</DialogTitle>
        <DialogDescription>{enterMessage(prompt.request)}</DialogDescription>
      </DialogHeader>
      <EnterPinForm onSubmit={onSubmit} onCancel={onCancel} onForgot={() => setForgot(true)} />
    </>
  );
}

/**
 * Hộp thoại mã PIN kho dùng chung cho cả ứng dụng. Đăng ký với shared/api/vaultPin: khi Backend đòi PIN cho một
 * thao tác (thiếu, sai, chưa đặt) thì hiện hộp thoại tương ứng, rồi request gốc được gửi lại kèm PIN. Hủy hộp thoại
 * thì thao tác giữ nguyên lỗi của Backend. Nhiều yêu cầu cùng lúc xếp hàng, hiện lần lượt.
 */
export function VaultPinDialogHost() {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState<Prompt | null>(null);
  const currentRef = useRef<Prompt | null>(null);
  const queue = useRef<Prompt[]>([]);
  const nextId = useRef(0);

  const show = useCallback((prompt: Prompt | null) => {
    currentRef.current = prompt;
    setCurrent(prompt);
  }, []);

  const enqueue = useCallback(
    (prompt: Prompt) => {
      if (currentRef.current) queue.current.push(prompt);
      else show(prompt);
    },
    [show],
  );

  const advance = useCallback(() => show(queue.current.shift() ?? null), [show]);

  const handler = useMemo<VaultPinHandler>(
    () => ({
      requestPin: (request) =>
        new Promise((resolve) =>
          enqueue({ id: (nextId.current += 1), kind: "enter", request, resolve }),
        ),
      requestNewPin: (vaultId) =>
        new Promise((resolve) =>
          enqueue({ id: (nextId.current += 1), kind: "set", vaultId, resolve }),
        ),
      notifyLocked: (lockedUntil) =>
        enqueue({ id: (nextId.current += 1), kind: "locked", lockedUntil }),
      afterAssetCreated: (vaultId) => {
        void vaultPinService
          .getStatus(vaultId)
          .then((status) => {
            queryClient.setQueryData(vaultPinKeys.status(vaultId), status);
            if (!status.isRequired || status.isSet) return;
            const waiting = [currentRef.current, ...queue.current].some(
              (prompt) => prompt?.kind === "set" && prompt.vaultId === vaultId,
            );
            if (waiting) return;
            enqueue({
              id: (nextId.current += 1),
              kind: "set",
              vaultId,
              resolve: () => undefined,
            });
          })
          .catch(() => undefined);
      },
    }),
    [enqueue, queryClient],
  );

  useEffect(() => registerVaultPinHandler(handler), [handler]);

  // Unmount: không để request nào treo mãi chờ một hộp thoại không còn.
  useEffect(
    () => () => {
      for (const prompt of [currentRef.current, ...queue.current]) {
        if (prompt && prompt.kind !== "locked") prompt.resolve(null);
      }
      queue.current = [];
      currentRef.current = null;
    },
    [],
  );

  const cancel = () => {
    const prompt = currentRef.current;
    if (prompt && prompt.kind !== "locked") prompt.resolve(null);
    advance();
  };

  const finish = (pin: string) => {
    const prompt = currentRef.current;
    if (prompt && prompt.kind !== "locked") prompt.resolve(pin);
    advance();
  };

  const lockedMessage = (prompt: Extract<Prompt, { kind: "locked" }>) =>
    prompt.lockedUntil
      ? `Bạn đã nhập sai mã PIN quá nhiều lần. Mã PIN được mở khóa lúc ${formatDateTime(prompt.lockedUntil)}. Nếu quên mã PIN, bạn có thể đặt lại bằng mật khẩu tài khoản trong Cài đặt tài khoản.`
      : "Bạn đã nhập sai mã PIN quá nhiều lần nên mã PIN đang bị khóa tạm. Vui lòng thử lại sau.";

  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
    >
      {current && (
        <DialogContent key={current.id} className="max-w-md">
          {current.kind === "enter" && (
            <EnterPinPrompt
              prompt={current}
              onSubmit={finish}
              onCancel={cancel}
              onForgotDone={finish}
            />
          )}
          {current.kind === "set" && (
            <>
              <DialogHeader>
                <DialogTitle>Đặt mã PIN cho kho</DialogTitle>
                <DialogDescription>
                  Kho đã có tài sản nên cần mã PIN 6 chữ số. Mã PIN được hỏi trước khi tải nội dung
                  tài sản, sửa hoặc xóa tài sản, đổi người nhận hoặc Người thực hiện.
                </DialogDescription>
              </DialogHeader>
              <SetPinForm
                vaultId={current.vaultId}
                onDone={(pin, status) => {
                  queryClient.setQueryData(vaultPinKeys.status(current.vaultId), status);
                  finish(pin);
                }}
                onCancel={cancel}
                cancelLabel="Để sau"
              />
            </>
          )}
          {current.kind === "locked" && (
            <>
              <DialogHeader>
                <DialogTitle>Mã PIN đang bị khóa tạm</DialogTitle>
                <DialogDescription>{lockedMessage(current)}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <button type="button" className={buttonStyles.dark} onClick={cancel}>
                  Đã hiểu
                </button>
              </div>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
