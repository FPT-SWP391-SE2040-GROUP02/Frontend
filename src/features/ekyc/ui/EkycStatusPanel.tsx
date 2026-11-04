import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui";
import { ekycService } from "../api/ekycService";
import { ekycPurposeSchema, type ekycStatusSchema } from "../model/ekyc.schema";
import { EkycUploads } from "./EkycUploads";
import { EkycVerifiedCard } from "./EkycVerifiedCard";

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

const GOLD_ACTION =
  "min-h-11 items-center rounded-xl bg-[#E0C486] px-6 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] focus-visible:outline-2 focus-visible:outline-heritage-gold";

/**
 * Bước tiếp theo trên thẻ thành công của người nhận. Hoàn tất danh tính vẫn là thao tác riêng do máy chủ xác nhận
 * (không tự gọi), nên thẻ chỉ hiện nút khi page cho phép và đổi sang liên kết khi máy chủ đã chốt.
 */
function BeneficiaryNextStep({
  canComplete,
  onComplete,
  completeResult,
}: {
  canComplete?: boolean;
  onComplete?: () => void;
  completeResult?: { error?: string; succeeded?: boolean } | null;
}) {
  let content: ReactNode;
  if (completeResult?.succeeded) {
    content = (
      <>
        <p role="status" className="text-sm">
          Đã chốt danh tính. Lượt bàn giao sẽ được máy chủ cập nhật trạng thái.
        </p>
        <Link to={ROUTES.BENEFICIARY.CLAIM} className={`inline-flex ${GOLD_ACTION}`}>
          Tiếp tục nhận bàn giao
        </Link>
      </>
    );
  } else if (canComplete) {
    content = (
      <>
        <p className="text-sm">Đủ điều kiện hoàn tất danh tính cho lượt bàn giao.</p>
        <Button type="button" size="lg" className={GOLD_ACTION} onClick={() => onComplete?.()}>
          Hoàn tất danh tính lượt nhận
        </Button>
      </>
    );
  } else {
    content = <p className="text-sm">Đang chuẩn bị bước hoàn tất danh tính…</p>;
  }
  return (
    <div className="space-y-3 rounded-xl bg-[#F1E7D0] p-4 text-[#7A5B24]">
      <p className="text-sm font-semibold">Bước tiếp theo</p>
      {content}
    </div>
  );
}

/** Bước tiếp theo khi người nhận mở màn Xác minh không kèm lượt: việc chốt lượt phải làm từ cổng người nhận. */
function BeneficiaryPortalStep() {
  return (
    <div className="space-y-3 rounded-xl bg-[#F1E7D0] p-4 text-[#7A5B24]">
      <p className="text-sm font-semibold">Bước tiếp theo</p>
      <p className="text-sm">
        Mở lượt bàn giao của bạn ở cổng người nhận để hoàn tất bước danh tính.
      </p>
      <Link to={ROUTES.BENEFICIARY.CLAIM} className={`inline-flex ${GOLD_ACTION}`}>
        Về cổng người nhận
      </Link>
    </div>
  );
}

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
  const status = useQuery({
    queryKey: ["ekyc", "me"],
    queryFn: ({ signal }) => ekycService.getStatus(signal),
    enabled: authenticated,
    retry: false,
  });
  const needsTurnId = purpose === "BENEFICIARY_CLAIM" && !turnId;
  const client = useQueryClient();
  const live = status.data;
  // Owner đã PASSED thì hiện thẳng màn "Danh tính đã được xác minh". Lượt vừa chốt mà CHƯA đạt thì giữ màn
  // kết quả so khớp (để biết lý do và làm lại) đến khi rời trang.
  const [finishedHere, setFinishedHere] = useState(false);
  // Người nhận: kết quả máy chủ vừa trả khi lượt đạt VÀ khớp người được chỉ định; có thì hiện thẳng thẻ thành công.
  const [beneficiaryPassed, setBeneficiaryPassed] = useState<z.infer<
    typeof ekycStatusSchema
  > | null>(null);
  const handleVerified = (result: z.infer<typeof ekycStatusSchema>) => {
    const passed =
      result.status === "PASSED" &&
      result.identityMatch !== "WRONG_PERSON" &&
      result.identityMatch !== "NEEDS_REVIEW";
    if (purpose === "OWNER_ENROLLMENT" && passed) {
      // Dùng ngay kết quả máy chủ vừa trả để chuyển màn, không chờ lần tải lại trạng thái.
      client.setQueryData(["ekyc", "me"], result);
    } else if (
      purpose === "BENEFICIARY_CLAIM" &&
      result.status === "PASSED" &&
      result.identityMatch === "MATCHED"
    ) {
      setBeneficiaryPassed(result);
    } else {
      setFinishedHere(true);
    }
    onVerified?.();
  };
  const locked = purpose === "OWNER_ENROLLMENT" && live?.status === "PASSED" && !finishedHere;
  // Người nhận mở màn không kèm lượt mà tài khoản đã xác minh đạt và khớp: hiện thẻ thành công thay cho dòng trạng thái
  // và lời nhắc mở từ lượt bàn giao. Trạng thái máy chủ không cho biết lượt nào, nên thẻ chỉ nói "đã xác minh".
  const verifiedWithoutTurn =
    needsTurnId &&
    live?.purpose === "BENEFICIARY_CLAIM" &&
    live.status === "PASSED" &&
    live.identityMatch === "MATCHED";
  const showsCard = locked || verifiedWithoutTurn;

  let banner: ReactNode = null;
  if (locked && live) {
    // Đã xác minh đạt: hiện màn kết quả đầy đủ thay cho dòng trạng thái.
    banner = <EkycVerifiedCard live={live} />;
  } else if (verifiedWithoutTurn && live) {
    banner = (
      <EkycVerifiedCard
        live={live}
        subtitle="Thông tin giấy tờ khớp với người được chỉ định nhận."
        nextStep={<BeneficiaryPortalStep />}
      />
    );
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
        <p className="text-heritage-muted">{matchLabels[live.identityMatch]}</p>
        {live.backSideChecked && <p className="text-heritage-muted">Đã đọc mặt sau giấy tờ.</p>}
      </div>
    );
  }

  return (
    <section aria-label="Trạng thái xác minh danh tính" className="space-y-6">
      {banner && showsCard && banner}
      {banner && !showsCard && !beneficiaryPassed && (
        <div className="rounded-2xl border border-heritage-border bg-heritage-surface px-6 py-4">
          {banner}
        </div>
      )}
      {needsTurnId && !verifiedWithoutTurn && (
        <p role="alert" className="text-sm text-destructive">
          Mở màn này từ một lượt bàn giao cụ thể để gửi ảnh xác minh.
        </p>
      )}
      {authenticated && status.isSuccess && !needsTurnId && !locked && (
        <>
          {beneficiaryPassed && (
            <EkycVerifiedCard
              live={beneficiaryPassed}
              subtitle="Thông tin giấy tờ khớp với người được chỉ định nhận."
              nextStep={
                <BeneficiaryNextStep
                  canComplete={canComplete}
                  onComplete={onComplete}
                  completeResult={completeResult}
                />
              }
            />
          )}
          {!beneficiaryPassed && (
            <EkycUploads
              key={`${userId}:${purpose}:${turnId ?? ""}`}
              purpose={purpose}
              turnId={turnId ?? null}
              canComplete={Boolean(canComplete)}
              onComplete={() => onComplete?.()}
              onVerificationBound={(id) => onVerificationBound?.(id)}
              onVerified={handleVerified}
            />
          )}
          {completeResult?.error && (
            <p role="alert" className="text-sm text-destructive">
              {completeResult.error}
            </p>
          )}
          {completeResult?.succeeded && !beneficiaryPassed && (
            <p role="status" className="text-sm text-heritage-primary">
              Đã chốt danh tính. Lượt bàn giao sẽ được máy chủ cập nhật trạng thái.
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap justify-between gap-2 text-xs text-heritage-muted">
        <p>Xác minh cơ bản, không có giá trị pháp lý. LegacyVault không thay thế di chúc.</p>
        <p>Chưa xác thực giấy tờ thật/giả hoặc bảo đảm chống deepfake.</p>
      </div>
    </section>
  );
}
