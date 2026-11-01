import { useEffect, useState, type ReactNode } from "react";
import { CircleCheck, Mail, Smartphone, Watch } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { StatusBanner } from "@/shared/ui/status-banner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { checkInService } from "../api/checkInService";

interface PairingCode {
  code: string;
  /** Mốc hết hạn theo đồng hồ máy người dùng, tính từ expiresInSeconds BE trả về. */
  expiresAt: number;
}

interface PairedDevice {
  deviceName: string;
  pairedAt?: string;
}

function MethodRow({
  icon,
  title,
  description,
  aside,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  aside: ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-heritage-border py-4 last:border-b-0">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E3EFE8] text-[#1F7A55]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-heritage-muted">{description}</p>
      </div>
      {aside}
    </li>
  );
}

const IN_USE_CHIP = (
  <span className="shrink-0 rounded-full bg-[#E3EFE8] px-3 py-1 text-xs font-semibold text-[#1F7A55]">
    Đang dùng
  </span>
);

const CONNECTED_CHIP = (
  <span className="shrink-0 rounded-full bg-[#E3EFE8] px-3 py-1 text-xs font-semibold text-[#1F7A55]">
    Đã kết nối
  </span>
);

/** Đếm ngược "mm:ss" tới khi mã hết hạn, cập nhật mỗi giây. */
function useSecondsLeft(expiresAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt === null) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  if (expiresAt === null) return 0;
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

function formatMinutes(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Thẻ "Cách điểm danh" (thiết kế 189) và hộp thoại ghép đồng hồ bằng mã 6 số (thiết kế 190).
 * Tự động nhận diện khi đồng hồ hoàn tất ghép nối và hiển thị thông báo thành công.
 */
export function SmartwatchCheckInButton(_props: {
  vaultId?: string;
  status?: unknown;
  className?: string;
}) {
  const action = usePrivateAction();
  const [pairing, setPairing] = useState<PairingCode | null>(null);
  const [pairedDevice, setPairedDevice] = useState<PairedDevice | null>(null);
  const [open, setOpen] = useState(false);
  const secondsLeft = useSecondsLeft(pairing?.expiresAt ?? null);
  const expired = pairing !== null && secondsLeft === 0;

  // Polling trạng thái ghép nối trong lúc mở hộp thoại
  useEffect(() => {
    if (!open || pairing === null || expired || pairedDevice !== null) return;
    const controller = new AbortController();
    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const result = await checkInService.getSmartwatchPairingStatus(
            pairing.code,
            controller.signal,
          );
          if (result.paired) {
            setPairedDevice({
              deviceName: result.deviceName || "Đồng hồ thông minh",
              pairedAt: result.pairedAt,
            });
          }
        } catch {
          // Lỗi mạng polling thì thử lại ở nhịp kế
        }
      })();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [open, pairing, expired, pairedDevice]);

  function requestCode(): void {
    void action.execute(
      () => checkInService.getSmartwatchPairingCode(),
      (result) => {
        setPairing({ code: result.code, expiresAt: Date.now() + result.expiresInSeconds * 1000 });
        setOpen(true);
      },
    );
  }

  function close(): void {
    setOpen(false);
    setPairing(null);
  }

  let codeStatus = "";
  if (pairing !== null) {
    codeStatus = expired
      ? "Mã đã hết hạn. Bấm “Tạo mã mới” để lấy mã khác."
      : `Mã hết hạn sau ${formatMinutes(secondsLeft)}.`;
  }

  return (
    <section
      aria-labelledby="check-in-methods-title"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h2 id="check-in-methods-title" className="text-xl font-medium text-heritage-primary">
        Cách điểm danh
      </h2>
      <ul className="mt-2">
        <MethodRow
          icon={<Smartphone className="size-5" aria-hidden="true" />}
          title="Điện thoại và máy tính"
          description="Bấm “Điểm danh” trên LegacyVault"
          aside={IN_USE_CHIP}
        />
        <MethodRow
          icon={<Mail className="size-5" aria-hidden="true" />}
          title="Nhắc qua email"
          description="Gửi trước hạn 7 ngày và 1 ngày"
          aside={IN_USE_CHIP}
        />
        <MethodRow
          icon={<Watch className="size-5" aria-hidden="true" />}
          title="Đồng hồ thông minh"
          description={
            pairedDevice !== null
              ? `Đã liên kết thiết bị (${pairedDevice.deviceName}). Điểm danh trực tiếp trên đồng hồ.`
              : "Ghép đồng hồ bằng mã 6 số. Bấm một nút trên đồng hồ, đồng hồ đo nhịp tim để xác nhận."
          }
          aside={
            pairedDevice !== null ? (
              <div className="flex items-center gap-2">
                {CONNECTED_CHIP}
                <button
                  type="button"
                  className="text-xs text-heritage-muted underline hover:text-heritage-primary"
                  onClick={requestCode}
                >
                  Đổi
                </button>
              </div>
            ) : (
              // Tạm khóa: tính năng ghép đồng hồ chưa mở. Bỏ khóa bằng cách trả lại onClick={requestCode}.
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-xl bg-[#E4E2DA] px-6 text-sm font-semibold text-[#8A8880]"
              >
                Coming soon
              </button>
            )
          }
        />
      </ul>
      {action.error && !open && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {action.error}
        </p>
      )}
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent className="max-w-lg bg-[#FBFAF5] p-7" showCloseButton={false}>
          {pairedDevice !== null ? (
            <div className="space-y-4 py-2 text-center">
              <div className="flex justify-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-[#E3EFE8] text-[#1F7A55]">
                  <CircleCheck className="size-10" aria-hidden="true" />
                </span>
              </div>
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-semibold text-heritage-primary">
                  Đã kết nối đồng hồ thành công!
                </DialogTitle>
                <DialogDescription className="text-center text-heritage-muted">
                  Thiết bị{" "}
                  <strong className="font-semibold text-heritage-primary">
                    {pairedDevice.deviceName}
                  </strong>{" "}
                  đã được liên kết thành công với tài khoản của bạn.
                </DialogDescription>
              </DialogHeader>
              <StatusBanner tone="success" className="text-left">
                <p>
                  Đã kết nối đồng hồ thành công! Giờ đây bạn có thể mở ứng dụng trên đồng hồ để đo
                  nhịp tim và điểm danh bất cứ lúc nào.
                </p>
              </StatusBanner>
              <DialogFooter className="mt-4 sm:justify-center">
                <button type="button" className={buttonStyles.gold} onClick={close}>
                  Hoàn tất
                </button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-heritage-primary">
                  Kết nối đồng hồ thông minh
                </DialogTitle>
                <DialogDescription className="text-heritage-muted">
                  Mỗi tài khoản kết nối một đồng hồ. Mã chỉ dùng một lần.
                </DialogDescription>
              </DialogHeader>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Mở ứng dụng LegacyVault trên đồng hồ.</li>
                <li>Chọn “Ghép với tài khoản”.</li>
                <li>Nhập mã 6 số dưới đây.</li>
              </ol>
              {pairing !== null && (
                <div
                  aria-label={`Mã ghép nối ${pairing.code.split("").join(" ")}`}
                  role="group"
                  className={`flex justify-center gap-2 ${expired ? "opacity-40" : ""}`}
                >
                  {pairing.code.split("").map((digit, index) => (
                    <span
                      key={index}
                      aria-hidden="true"
                      className="flex h-16 w-12 items-center justify-center rounded-xl border-2 border-[#0A281E] bg-white font-mono text-3xl font-semibold text-[#0A281E]"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              )}
              <p role="status" className="text-center text-sm text-heritage-muted">
                {codeStatus}
              </p>
              <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
                Chưa có ứng dụng trên đồng hồ? Cài LegacyVault từ cửa hàng ứng dụng của đồng hồ.
              </p>
              {action.error && (
                <p role="alert" className="text-sm text-destructive">
                  {action.error}
                </p>
              )}
              <DialogFooter className="gap-3 sm:justify-end">
                <button type="button" className={buttonStyles.outline} onClick={close}>
                  Hủy
                </button>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  disabled={action.pending}
                  onClick={requestCode}
                >
                  {action.pending ? "Đang tạo mã…" : "Tạo mã mới"}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
