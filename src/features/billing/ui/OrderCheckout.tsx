import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonVariants, Button } from "@/shared/ui/button";
import { StatusBanner } from "@/shared/ui/status-banner";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { billingService } from "../api/billingService";
import type { PaymentOrder } from "../model/billing.types";
import { referenceMoney } from "../model/servicePlanPreview";
import { billingKeys, useOrder } from "../model/useBilling";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Giây còn lại tới hạn đơn, tính theo giờ máy chủ để không lệch theo đồng hồ máy khách. */
function useSecondsLeft(order: PaymentOrder, onZero: () => void): number {
  const [offset] = useState(() => Date.parse(order.serverTime) - Date.now());
  const expiresAt = Date.parse(order.expiresAt);
  const [left, setLeft] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - (Date.now() + offset)) / 1000)),
  );
  const fired = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((expiresAt - (Date.now() + offset)) / 1000));
      setLeft(next);
      if (next === 0 && !fired.current) {
        fired.current = true;
        onZero();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, offset, onZero]);
  return left;
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function CopyField({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard: người dùng vẫn chép tay được từ ô hiển thị.
      setCopied(false);
    }
  }
  let valueStyle = "font-mono text-sm";
  if (strong) {
    valueStyle = "font-mono text-lg font-semibold text-heritage-primary";
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-heritage-canvas px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-heritage-muted">{label}</p>
        <p className={`break-all ${valueStyle}`}>{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Chép ${label}`}
        onClick={() => void copy()}
      >
        {copied && <Check className="size-4" aria-hidden="true" />}
        {!copied && <Copy className="size-4" aria-hidden="true" />}
        {copied && "Đã chép"}
        {!copied && "Chép"}
      </Button>
    </div>
  );
}

/** Đơn đang chờ: mã QR, thông tin chuyển khoản, đếm ngược theo giờ máy chủ, hủy đơn và thanh toán thử (dev). */
function PendingOrder({ order }: { order: PaymentOrder }) {
  const client = useQueryClient();
  const cancel = usePrivateAction();
  const devPay = usePrivateAction();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [devPayOff, setDevPayOff] = useState(false);
  const left = useSecondsLeft(order, () => {
    // Hết giờ: hỏi lại máy chủ, đơn quá hạn được đánh dấu EXPIRED ngay trong lần đọc.
    void client.invalidateQueries({ queryKey: billingKeys.order(order.id) });
  });

  function publish(result: PaymentOrder): void {
    client.setQueryData(billingKeys.order(result.id), result);
    void client.invalidateQueries({ queryKey: billingKeys.currentOrder() });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  }

  let intro =
    "Quét mã QR bằng ứng dụng ngân hàng, hoặc chuyển khoản đúng số tiền và nội dung bên dưới.";
  if (left === 0) {
    intro = "Đã hết thời gian chờ. Đang kiểm tra lại với máy chủ…";
  }
  let timerStyle = "text-heritage-primary";
  if (left <= 60) {
    timerStyle = "text-red-700";
  }

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Mã QR thanh toán" className={`${CARD} space-y-4 text-center`}>
          {order.qrImageUrl && (
            <img
              src={order.qrImageUrl}
              alt="Mã QR chuyển khoản"
              className="mx-auto aspect-square w-full max-w-[260px] rounded-xl border border-heritage-border bg-white p-2"
            />
          )}
          <p className="text-sm text-heritage-muted">Còn lại để thanh toán</p>
          <p
            className={`text-4xl font-semibold tabular-nums ${timerStyle}`}
            role="timer"
            aria-label="Thời gian còn lại"
          >
            {formatCountdown(left)}
          </p>
        </section>
        <section aria-label="Thông tin chuyển khoản" className={`${CARD} space-y-4`}>
          <div>
            <h2 className="text-xl font-medium text-heritage-primary">Thông tin chuyển khoản</h2>
            <p className="mt-1 text-sm text-heritage-muted">{intro}</p>
          </div>
          <div className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-[#7A5B24]">
            <p className="text-xs">Số tiền cần chuyển</p>
            <p className="text-3xl font-semibold">{referenceMoney.format(order.totalAmount)}</p>
          </div>
          <CopyField label="Nội dung chuyển khoản" value={order.transferContent} strong />
          <CopyField label="Số tài khoản" value={order.bank.accountNumber} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-heritage-canvas px-4 py-3">
              <p className="text-xs text-heritage-muted">Ngân hàng</p>
              <p className="text-sm font-medium">{order.bank.bankCode}</p>
            </div>
            <div className="rounded-xl bg-heritage-canvas px-4 py-3">
              <p className="text-xs text-heritage-muted">Chủ tài khoản</p>
              <p className="text-sm font-medium">{order.bank.accountName}</p>
            </div>
          </div>
          <p className="text-xs text-heritage-muted">
            Nội dung chuyển khoản phải đúng mã trên để hệ thống tự nhận tiền. {order.notice}
          </p>
        </section>
      </div>
      {cancel.error && (
        <StatusBanner tone="error">
          <p>{cancel.error}</p>
        </StatusBanner>
      )}
      {devPay.error && (
        <StatusBanner tone="error">
          <p>{devPay.error}</p>
          {devPayOff && (
            <p>Máy chủ chưa bật thanh toán thử (cấu hình Billing:DevPaymentEnabled).</p>
          )}
        </StatusBanner>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {import.meta.env.DEV && (
          <Button
            type="button"
            size="lg"
            className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
            disabled={devPay.pending || cancel.pending}
            onClick={() =>
              void devPay.execute(
                () =>
                  billingService.devPay(order.id).catch((failure: unknown) => {
                    if (isAxiosError(failure) && failure.response?.status === 404) {
                      setDevPayOff(true);
                    }
                    throw failure;
                  }),
                publish,
              )
            }
          >
            Thanh toán thử (môi trường dev)
          </Button>
        )}
        {!confirmingCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-red-300 text-red-700 hover:bg-red-50"
            disabled={devPay.pending || cancel.pending}
            onClick={() => setConfirmingCancel(true)}
          >
            Hủy đơn
          </Button>
        )}
        {confirmingCancel && (
          <>
            <span className="text-sm">Hủy đơn này?</span>
            <Button
              type="button"
              size="lg"
              className="bg-red-700 text-white hover:bg-red-800"
              disabled={cancel.pending}
              onClick={() =>
                void cancel.execute(() => billingService.cancelOrder(order.id), publish)
              }
            >
              Đồng ý hủy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={cancel.pending}
              onClick={() => setConfirmingCancel(false)}
            >
              Giữ đơn
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Kết quả cuối của đơn: đã trả, hết hạn hoặc đã hủy. */
function FinishedOrder({ order }: { order: PaymentOrder }) {
  const client = useQueryClient();
  const paid = order.status === "PAID";
  useEffect(() => {
    // Quyền dịch vụ của kho vừa đổi: tải lại thông tin kho và đơn đang chờ.
    if (!paid) return;
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: billingKeys.currentOrder() });
  }, [paid, client]);

  let kindLabel = "Mua thêm suất người nhận";
  if (order.kind === "RENEWAL") {
    let renewTierName = "XS Max";
    if (order.tier === "XS") {
      renewTierName = "XS";
    }
    kindLabel = `Gia hạn gói ${renewTierName} · ${order.years} năm`;
  }
  if (order.kind === "UPGRADE") {
    kindLabel = "Nâng hạng lên XS Max (giữ nguyên hạn dịch vụ)";
  }
  if (order.kind === "PURCHASE") {
    let tierName = "XS Max";
    if (order.tier === "XS") {
      tierName = "XS";
    }
    kindLabel = `Mua gói ${tierName} · ${order.years} năm`;
  }
  const rows = [
    { label: "Nội dung", value: kindLabel },
    { label: "Số tiền", value: referenceMoney.format(order.totalAmount) },
    { label: "Dung lượng", value: formatStorageMegabytes(order.storageQuotaBytes) },
    { label: "Mã thanh toán", value: order.paymentCode },
  ];
  if (order.paidAt) {
    rows.push({ label: "Thanh toán lúc", value: dateTimeFormatter.format(new Date(order.paidAt)) });
  }
  return (
    <div className="space-y-6">
      {order.status === "PAID" && (
        <StatusBanner tone="success">
          <p>Đã thanh toán. Quyền dịch vụ của kho đã được cập nhật.</p>
          <p className="font-normal">{order.notice}</p>
        </StatusBanner>
      )}
      {order.status === "EXPIRED" && (
        <StatusBanner tone="error">
          <p>Đơn đã hết hạn nên không thanh toán được. Hãy tạo đơn mới.</p>
        </StatusBanner>
      )}
      {order.status === "CANCELLED" && (
        <StatusBanner tone="error">
          <p>Đơn đã bị hủy. Hãy tạo đơn mới nếu bạn vẫn muốn mua.</p>
        </StatusBanner>
      )}
      <section aria-label="Chi tiết đơn" className={CARD}>
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-heritage-canvas px-4 py-3">
              <dt className="text-xs text-heritage-muted">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link
          to={ROUTES.BILLING.PLANS}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Về gói dịch vụ
        </Link>
        <Link
          to={ROUTES.BILLING.HISTORY}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Lịch sử thanh toán
        </Link>
        {paid && (
          <Link
            to={ROUTES.DASHBOARD.ASSETS}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Về Kho của tôi
          </Link>
        )}
      </div>
    </div>
  );
}

/** Theo dõi một đơn theo id và hiện đúng trạng thái; hỏi lại máy chủ định kỳ khi đơn còn PENDING. */
export function OrderCheckout({ orderId }: { orderId: string }) {
  const order = useOrder(orderId, true);
  if (order.isPending) return <p role="status">Đang tải đơn thanh toán…</p>;
  if (order.isError || !order.data) {
    return (
      <StatusBanner tone="error">
        <p>Không tải được đơn thanh toán. Kiểm tra kết nối rồi thử lại.</p>
        <Button variant="outline" onClick={() => void order.refetch()}>
          Thử lại
        </Button>
      </StatusBanner>
    );
  }
  if (order.data.status === "PENDING") {
    return <PendingOrder key={order.data.id} order={order.data} />;
  }
  return <FinishedOrder order={order.data} />;
}
