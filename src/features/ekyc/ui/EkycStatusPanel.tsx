import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui";
import { ekycService } from "../api/ekycService";
import type { ekycStatusSchema } from "../model/ekyc.schema";
import { EkycUploads } from "./EkycUploads";
import { EkycVerifiedCard } from "./EkycVerifiedCard";

const labels = {
  NOT_STARTED: "Bạn chưa xác minh danh tính.",
  PENDING: "Đang chờ bước so khớp khuôn mặt.",
  PASSED: "Danh tính đã được xác minh.",
  FAILED: "Lần xác minh chưa đạt yêu cầu.",
} as const;

/** Màn eKYC của Chủ kho: trạng thái lấy từ server, không tạo kết quả thành công ở client. */
export function EkycStatusPanel({
  onVerified,
  ownerPlanPurchased,
}: {
  onVerified?: () => void;
  /** Chủ kho đã có gói trả phí: màn kết quả không nhắc mua gói nữa (page truyền vào để tránh phụ thuộc chéo feature). */
  ownerPlanPurchased?: boolean;
}) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  const status = useQuery({
    queryKey: ["ekyc", "me"],
    queryFn: ({ signal }) => ekycService.getStatus(signal),
    enabled: authenticated,
    retry: false,
  });
  const client = useQueryClient();
  const live = status.data;
  // Đã PASSED thì hiện thẳng màn "Danh tính đã được xác minh". Lượt vừa chốt mà CHƯA đạt thì giữ màn
  // kết quả so khớp (để biết lý do và làm lại) đến khi rời trang.
  const [finishedHere, setFinishedHere] = useState(false);
  function handleVerified(result: z.infer<typeof ekycStatusSchema>) {
    if (result.status === "PASSED") {
      // Dùng ngay kết quả máy chủ vừa trả để chuyển màn, không chờ lần tải lại trạng thái.
      client.setQueryData(["ekyc", "me"], result);
    } else {
      setFinishedHere(true);
    }
    onVerified?.();
  }
  const locked = live?.status === "PASSED" && !finishedHere;

  let banner: ReactNode = null;
  if (locked && live) {
    // Đã xác minh đạt: hiện màn kết quả đầy đủ thay cho dòng trạng thái.
    banner = <EkycVerifiedCard live={live} hidePurchaseStep={ownerPlanPurchased} />;
  } else if (!authenticated) {
    banner = <p role="status">Vui lòng đăng nhập để xem trạng thái xác minh.</p>;
  } else if (status.isPending) {
    banner = <p role="status">Đang tải trạng thái xác minh…</p>;
  } else if (status.isError) {
    banner = (
      <div role="alert">
        <p>Không tải được trạng thái xác minh.</p>
        <Button
          className="mt-3 min-h-11"
          disabled={status.isFetching}
          onClick={() => void status.refetch()}
        >
          Thử lại
        </Button>
      </div>
    );
  } else if (live) {
    banner = (
      <div className="space-y-1 text-sm">
        <p role="status" className="font-semibold">
          {labels[live.status]}
        </p>
        {live.backSideChecked && <p className="text-heritage-muted">Đã đọc mặt sau giấy tờ.</p>}
      </div>
    );
  }

  return (
    <section aria-label="Trạng thái xác minh danh tính" className="space-y-6">
      {banner && locked && banner}
      {banner && !locked && (
        <div className="rounded-2xl border border-heritage-border bg-heritage-surface px-6 py-4">
          {banner}
        </div>
      )}
      {authenticated && status.isSuccess && !locked && (
        <EkycUploads key={userId} onVerified={handleVerified} />
      )}
      <p className="max-w-prose text-sm leading-6 text-heritage-muted">
        Dịch vụ của chúng tôi chỉ hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc
        thủ tục thừa kế. Chưa xác thực giấy tờ thật/giả hoặc bảo đảm chống deepfake.
      </p>
    </section>
  );
}
