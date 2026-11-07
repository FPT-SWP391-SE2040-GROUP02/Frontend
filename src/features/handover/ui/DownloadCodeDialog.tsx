import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";

interface DownloadCodeDialogProps {
  grantId: string;
  /** Gọi khi người nhận nhập đủ 6 số và bấm Tải; trang cha tải tệp kèm mã. */
  onSubmit: (code: string) => void;
  onClose: () => void;
}

/**
 * Hộp nhập mã tải: Admin bật "mã tải" thì mỗi lần tải phải có mã 6 số gửi qua email, dùng một lần, hạn 10 phút.
 * Gửi mã là một thao tác riêng để người nhận chủ động xin, không tự gửi mỗi lần mở hộp.
 */
export function DownloadCodeDialog({ grantId, onSubmit, onClose }: DownloadCodeDialogProps) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const request = usePrivateAction();
  const valid = /^\d{6}$/.test(code);
  return (
    <Dialog open onOpenChange={(open) => !open && !request.pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nhập mã tải</DialogTitle>
          <DialogDescription>
            Để bảo vệ tài sản, mỗi lần tải cần một mã 6 số gửi qua email của bạn. Mã dùng một lần và
            hết hạn sau 10 phút.
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={request.pending}
          onClick={() =>
            void request.execute(
              () => handoverService.requestDownloadCode(grantId),
              () => setSent(true),
            )
          }
        >
          {request.pending ? "Đang gửi…" : sent ? "Gửi lại mã" : "Gửi mã qua email"}
        </button>
        {sent && (
          <p role="status" className="text-sm text-heritage-muted">
            Đã gửi mã. Kiểm tra hộp thư của bạn.
          </p>
        )}
        {request.error && (
          <p role="alert" className="text-sm text-destructive">
            {request.error}
          </p>
        )}
        <label className="block text-sm font-medium">
          Mã 6 số
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="mt-1 min-h-11 w-full rounded-lg border border-heritage-border bg-white px-3 tracking-widest"
          />
        </label>
        <DialogFooter>
          <button type="button" className={buttonStyles.outline} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={buttonStyles.gold}
            disabled={!valid}
            onClick={() => onSubmit(code)}
          >
            Tải
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
