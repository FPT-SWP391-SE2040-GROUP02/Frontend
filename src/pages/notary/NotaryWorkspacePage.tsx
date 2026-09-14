import React from "react";
import { useSearchParams } from "react-router-dom";
import { Scale, Clock, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/widgets";
import { Card, Skeleton, Button } from "@/shared/ui";
import {
  usePendingClaims,
  SplitScreenViewer,
  NotaryApproveModal,
  NotaryRejectModal,
  type AuditCriteriaChecklist,
  type NotaryClaimItemDto,
} from "@/features/notary";

/**
 * @file NotaryWorkspacePage.tsx
 * @description Bàn làm việc Thẩm Định Pháp Lý của Công chứng viên (Notary Split-Screen Workspace).
 * Áp dụng URL State qua useSearchParams thay thế hoàn toàn useState cho việc chọn hồ sơ và mở modal.
 */
export const NotaryWorkspacePage: React.FC = () => {
  // Quản lý hồ sơ được chọn và modal qua URL State (không dùng useState)
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClaimId = searchParams.get("claimId");
  const activeModal = searchParams.get("modal"); // "approve" | "reject" | null

  // Server State qua TanStack Query
  const { data: claimsData, isLoading, isError, refetch } = usePendingClaims();

  const pendingClaims = claimsData?.items || [];
  const currentClaim = 
    pendingClaims.find((c) => c.id === selectedClaimId) || pendingClaims[0] || null;

  const handleSelectClaim = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("claimId", id);
      return next;
    });
  };

  const handleOpenApproveModal = (criteria: AuditCriteriaChecklist) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("modal", "approve");
      return next;
    });
  };

  const handleOpenRejectModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("modal", "reject");
      return next;
    });
  };

  const handleCloseModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("modal");
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner tiêu đề workspace */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD9D0] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5 text-[#0B291E]" />
              <span>Cổng Thẩm Định Công Chứng Viên (Điều 611 BLDS 2015 & Luật Công chứng)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B291E] tracking-tight">
              Bàn Làm Việc Thẩm Định Di Sản (Notary Workspace)
            </h1>
            <p className="text-xs sm:text-sm text-[#66786E] mt-1 max-w-3xl leading-relaxed">
              Đối soát giấy chứng tử hoặc bản án Tòa án với dữ liệu di chúc số trên màn hình chia đôi (Split-Screen) và giải phóng Mảnh khóa Verifier để người thừa kế tiếp nhận tài sản.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#66786E]">Hồ sơ chờ thụ lý:</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
              {pendingClaims.length} hồ sơ
            </span>
          </div>
        </div>

        {/* Thanh chọn hồ sơ dạng tabs */}
        {pendingClaims.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {pendingClaims.map((claim) => {
              const isSelected = currentClaim?.id === claim.id;
              return (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => handleSelectClaim(claim.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-[16px] text-xs font-bold border transition-all flex items-center gap-2.5 shrink-0 ${
                    isSelected
                      ? "bg-[#0B291E] text-white border-[#0B291E] shadow-sm"
                      : "bg-[#FAF9F5] text-[#14241C] border-[#DCD9D0] hover:border-[#B88E4C]"
                  }`}
                >
                  <FileText className={`w-4 h-4 ${isSelected ? "text-[#B88E4C]" : "text-[#66786E]"}`} />
                  <span>{claim.vaultTitle}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-[#133E2F] text-[#B88E4C]" : "bg-[#EFECE6] text-[#66786E]"
                  }`}>
                    {claim.deathCertificateNumber}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Khu vực thẩm định chính */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-7 h-[650px] rounded-[24px]" />
            <Skeleton className="lg:col-span-5 h-[650px] rounded-[24px]" />
          </div>
        ) : isError ? (
          <Card className="p-8 text-center bg-[#FAF9F5] border-red-200 text-xs text-red-700 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-600" />
            <p>Không thể tải danh sách hồ sơ công chứng đang chờ duyệt.</p>
            <Button onClick={() => refetch()} className="mx-auto rounded-[16px]">
              Thử lại
            </Button>
          </Card>
        ) : currentClaim ? (
          <SplitScreenViewer
            claim={currentClaim}
            onOpenApproveModal={handleOpenApproveModal}
            onOpenRejectModal={handleOpenRejectModal}
          />
        ) : (
          <Card className="p-12 text-center bg-[#FAF9F5] border-[#DCD9D0] rounded-[24px] space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#E5EDE8] text-[#059669] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#0B291E]">Không Có Hồ Sơ Nào Chờ Thẩm Định</h3>
            <p className="text-xs text-[#66786E] max-w-md mx-auto leading-relaxed">
              Hiện tại toàn bộ hồ sơ yêu cầu mở thừa kế đã được xử lý hoàn tất. Các hồ sơ mới do Người thi hành nộp sẽ tự động hiển thị tại đây.
            </p>
          </Card>
        )}
      </main>

      {/* Modals được kích hoạt bằng URL State */}
      {currentClaim && (
        <>
          <NotaryApproveModal
            isOpen={activeModal === "approve"}
            claimId={currentClaim.id}
            checkCriteria={{
              isDocumentValid: true,
              isIdentityMatched: true,
              isManifestIntegrityVerified: true,
              isExecutorAuthorized: true,
            }}
            onClose={handleCloseModal}
            onSuccess={handleCloseModal}
          />

          <NotaryRejectModal
            isOpen={activeModal === "reject"}
            claimId={currentClaim.id}
            onClose={handleCloseModal}
            onSuccess={handleCloseModal}
          />
        </>
      )}
    </div>
  );
};
