import { useState } from "react";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";
import { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";
import { handoverService } from "@/features/handover/api/handoverService";
import { ekycService } from "@/features/ekyc/api/ekycService";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import type { AuthState } from "@/entities/user/model/authSlice";

/** Đọc turnId từ query string; nếu thiếu/không hợp lệ thì không gửi ảnh. */
function parseTurnId(value: string | null): string | null {
  if (!value) return null;
  return z.string().uuid().safeParse(value).success ? value : null;
}

/** Trạng thái xác minh thật, không dựng camera/kết quả thành công mẫu. */
export function CameraCheckPage() {
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  const [params] = useSearchParams();
  const turnId = parseTurnId(params.get("turnId"));
  return (
    <RecipientLayout active="verify">
      <BeneficiaryEkycScreen key={`${userId}:${turnId ?? "no-turn"}`} turnId={turnId} />
    </RecipientLayout>
  );
}

/**
 * Compose eKYC + hoàn tất danh tính; page-level được phép import cả hai feature.
 * Bắt buộc ghi nhận verificationId từ document response của lượt hiện tại,
 * không dùng status global (có thể là của lượt cũ) để bật hoàn tất.
 */
function BeneficiaryEkycScreen({ turnId }: { turnId: string | null }) {
  const client = useQueryClient();
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const status = useQuery({
    queryKey: ["ekyc", "me"],
    queryFn: ({ signal }) => ekycService.getStatus(signal),
    enabled: authenticated,
    retry: false,
  });
  const action = usePrivateAction();
  const [startedTurnId, setStartedTurnId] = useState<string | null>(null);
  const [boundVerificationId, setBoundVerificationId] = useState<string | null>(null);

  // Remounting resets the binding; global status cannot establish the turn.
  const live = status.data;
  const statusMatchesTurn =
    live != null &&
    live.verificationId != null &&
    live.purpose === "BENEFICIARY_CLAIM" &&
    boundVerificationId != null &&
    live.verificationId === boundVerificationId;

  const canComplete =
    Boolean(turnId) &&
    Boolean(live) &&
    live!.verificationId != null &&
    live!.status === "PASSED" &&
    live!.identityMatch === "MATCHED" &&
    live!.purpose === "BENEFICIARY_CLAIM" &&
    statusMatchesTurn &&
    !action.pending;

  // Reset kết quả complete khi đổi turnId; giữ state theo turnId.
  const resultForTurn =
    startedTurnId === turnId ? { error: action.error, succeeded: action.succeeded } : null;

  async function handleComplete() {
    if (!turnId || !canComplete) return;
    setStartedTurnId(turnId);
    await action.execute(
      () => handoverService.completeIdentity(turnId),
      (turn) => {
        client.setQueryData(["handover", "turn", turn.id], turn);
        void client.invalidateQueries({ queryKey: ["handover"] });
        void client.invalidateQueries({ queryKey: ["ekyc"] });
      },
    );
  }

  function handleVerificationBound(verificationId: string | null) {
    setBoundVerificationId(verificationId);
  }

  return (
    <EkycStatusPanel
      purpose="BENEFICIARY_CLAIM"
      turnId={turnId}
      canComplete={canComplete}
      onComplete={() => void handleComplete()}
      completeResult={resultForTurn}
      onVerificationBound={handleVerificationBound}
    />
  );
}
