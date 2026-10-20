import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui";
import { ekycService } from "../api/ekycService";
import { ekycPurposeSchema } from "../model/ekyc.schema";
import { EkycUploads } from "./EkycUploads";

type Purpose = z.infer<typeof ekycPurposeSchema>;

const labels = {
  NOT_STARTED: "Bạn chưa xác minh danh tính.",
  PENDING: "Đang chờ bước so khớp khuôn mặt.",
  PASSED: "Danh tính đã được xác minh.",
  FAILED: "Lần xác minh chưa đạt yêu cầu.",
} as const;

const matchLabels = {
  NOT_CHECKED: "Chưa đối chiếu thông tin người nhận.",
  MATCHED: "Thông tin giấy tờ khớp với người nhận được chỉ định.",
  NEEDS_REVIEW: "Cần kiểm tra thêm.",
  WRONG_PERSON: "Không khớp với người trên giấy tờ.",
} as const;

/** Màn thật lấy trạng thái từ server; URL ?turnId không tạo kết quả thành công. */
export function EkycStatusPanel({
  purpose,
  turnId,
  canComplete,
  onComplete,
  completeResult,
  onVerificationBound,
  onVerified,
}: {
  purpose: Purpose;
  turnId?: string | null;
  /** Page/widget chỉ định khi đủ điều kiện; tránh EkycStatusPanel phụ thuộc chéo feature. */
  canComplete?: boolean;
  /** Hoàn tất danh tính do page/widget xử lý (gọi handoverService). */
  onComplete?: () => void;
  /** Báo kết quả từ action ngoài (error/success). */
  completeResult?: { error?: string; succeeded?: boolean } | null;
  /** Báo verificationId mới từ document response; page dùng để so khớp với status khi bật complete. */
  onVerificationBound?: (verificationId: string | null) => void;
  onVerified?: () => void;
}) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  // Chỉ Owner xét theo mục đích riêng (xác minh một lần); người nhận vẫn xem lượt mới nhất và quét theo từng lượt.
  const statusPurpose = purpose === "OWNER_ENROLLMENT" ? purpose : undefined;
  const status = useQuery({
    queryKey: ["ekyc", "me", statusPurpose],
    queryFn: ({ signal }) => ekycService.getStatus(signal, statusPurpose),
    enabled: authenticated,
    retry: false,
  });
  const needsTurnId = purpose === "BENEFICIARY_CLAIM" && !turnId;
  const live = status.data;
  // Owner đã đạt từ trước (server PASSED) thì không bắt chụp lại khi quay về màn này. Chốt theo lần tải đầu:
  // đang làm dở trong phiên thì vẫn giữ EkycUploads để hiện bước "done" và gọi onVerified.
  const [alreadyPassedOnLoad, setAlreadyPassedOnLoad] = useState<boolean | null>(null);
  if (alreadyPassedOnLoad === null && live) {
    setAlreadyPassedOnLoad(
      purpose === "OWNER_ENROLLMENT" &&
        live.status === "PASSED" &&
        live.purpose === "OWNER_ENROLLMENT",
    );
  }
  const hideUploads = alreadyPassedOnLoad === true;
  return (
    <section
      aria-label="Trạng thái xác minh danh tính"
      className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h1 className="text-2xl font-semibold">Xác minh danh tính</h1>
      <p className="text-sm text-heritage-muted">Mục đích: {purpose}</p>
      {!authenticated ? (
        <p role="status">Vui lòng đăng nhập để xem trạng thái xác minh.</p>
      ) : status.isPending ? (
        <p role="status">Đang tải trạng thái xác minh…</p>
      ) : status.isError ? (
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
      ) : (
        <div className="space-y-2 text-sm">
          <p role="status">{labels[live!.status]}</p>
          <p className="text-heritage-muted">{matchLabels[live!.identityMatch]}</p>
          {live!.backSideChecked && <p className="text-heritage-muted">Đã đọc mặt sau giấy tờ.</p>}
        </div>
      )}
      {needsTurnId && (
        <p role="alert" className="text-sm text-destructive">
          Mở màn này từ một lượt bàn giao cụ thể để gửi ảnh xác minh.
        </p>
      )}
      {authenticated && status.isSuccess && !needsTurnId && !hideUploads && (
        <>
          <EkycUploads
            key={`${userId}:${purpose}:${turnId ?? ""}`}
            purpose={purpose}
            turnId={turnId ?? null}
            canComplete={Boolean(canComplete)}
            onComplete={() => onComplete?.()}
            onVerificationBound={(id) => onVerificationBound?.(id)}
            onVerified={onVerified}
          />
          {completeResult?.error && (
            <p role="alert" className="text-sm text-destructive">
              {completeResult.error}
            </p>
          )}
          {completeResult?.succeeded && (
            <p role="status" className="text-sm text-heritage-primary">
              Đã chốt danh tính. Lượt bàn giao sẽ được máy chủ cập nhật trạng thái.
            </p>
          )}
        </>
      )}
    </section>
  );
}
