import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { KeyRound, ShieldAlert, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/widgets/Header";
import { Button, Card } from "@/shared/ui";
import {
  useBeneficiaryClaim,
  DecryptionHandoverCard,
  BiometricEkycModal,
  RefuseInheritanceModal,
  type EkycSessionResult,
} from "@/features/handover";

/**
 * @file BeneficiaryHandoverPage.tsx
 * @description Màn hình tiếp nhận và mở khóa di sản số dành cho Người Thụ Hưởng (Beneficiary).
 * Áp dụng:
 * 1. URL State qua useSearchParams cho modal eKYC và modal từ chối (Rule 12).
 * 2. 4 trạng thái giao diện chuẩn mực: isLoading, isError, isEmpty, isSuccess (Rule 5).
 * 3. Master AppHeader và Master UI Kit (Rule 10).
 */

export const BeneficiaryHandoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get("claimId") || "clm_01";
  const activeModal = searchParams.get("modal"); // 'ekyc' | 'refuse' | null

  // Local Ephemeral UI State: Ghi nhận kết quả eKYC trong phiên duyệt hiện tại
  const [isEkycVerified, setIsEkycVerified] = useState<boolean>(false);

  // Server State: Lấy thông tin hồ sơ thừa kế qua TanStack Query
  const { data: claim, isLoading, isError, error, refetch } = useBeneficiaryClaim(claimId);

  const handleOpenEkycModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("modal", "ekyc");
      return next;
    });
  };

  const handleOpenRefuseModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("modal", "refuse");
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

  const handleEkycSuccess = (result: EkycSessionResult) => {
    setIsEkycVerified(true);
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#14241C] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-xs font-bold text-[#66786E] hover:text-[#0B291E] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về Tổng quan</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#66786E]">Hồ sơ mã:</span>
            <span className="font-mono text-xs font-bold text-[#B88E4C] bg-[#FBF7EE] px-2.5 py-1 rounded-lg border border-[#E8DCC6]">
              {claimId}
            </span>
          </div>
        </div>

        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[24px] bg-gradient-to-r from-[#0B291E] to-[#133E2F] text-white shadow-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#B88E4C]/20 text-[#B88E4C]">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-[#B88E4C] uppercase tracking-wider">
                Cổng Tiếp Nhận Thừa Kế Số (Digital Estate Handover)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAF9F5]">
              Mở Khóa & Tiếp Quản Di Sản Số
            </h1>
            <p className="text-xs text-[#FAF9F5]/70 max-w-xl leading-relaxed">
              Quy trình bàn giao được bảo vệ bởi lược đồ mật mã Shamir 2/3 và xác thực sinh trắc học eKYC theo quy định của pháp luật.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
            <KeyRound className="w-4 h-4 text-[#B88E4C]" />
            <span className="text-xs font-bold">Bảo Mật Cấp Độ Quân Sự</span>
          </div>
        </div>

        {/* 4 Trạng Thái Giao Diện Chuẩn Mực (Rule 5) */}
        {isLoading ? (
          <Card className="p-12 text-center bg-white border-[#E8DCC6] rounded-[24px] space-y-3">
            <Loader2 className="w-8 h-8 text-[#B88E4C] animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#0B291E]">Đang tải chi tiết hồ sơ thừa kế...</p>
          </Card>
        ) : isError ? (
          <Card className="p-8 text-center bg-red-50 border-red-200 rounded-[24px] space-y-3">
            <ShieldAlert className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="text-sm font-bold text-red-800">Không Thể Tải Hồ Sơ Bàn Giao</h3>
            <p className="text-xs text-red-600">{error?.message || "Đã xảy ra sự cố khi kết nối máy chủ."}</p>
            <Button
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#0B291E] text-white text-xs font-bold px-4 py-2"
            >
              Thử Lại
            </Button>
          </Card>
        ) : !claim ? (
          <Card className="p-12 text-center bg-white border-[#E8DCC6] rounded-[24px] space-y-3">
            <p className="text-xs font-bold text-[#66786E]">Không tìm thấy hồ sơ thừa kế tương ứng.</p>
          </Card>
        ) : (
          <DecryptionHandoverCard
            claim={claim}
            onOpenEkycModal={handleOpenEkycModal}
            onOpenRefuseModal={handleOpenRefuseModal}
            isEkycVerified={isEkycVerified}
          />
        )}
      </main>

      {/* Modal Quét Sinh Trắc Học eKYC */}
      {claim && (
        <BiometricEkycModal
          isOpen={activeModal === "ekyc"}
          beneficiaryFullName={claim.beneficiaryFullName}
          beneficiaryNationalId={claim.beneficiaryNationalId}
          onClose={handleCloseModal}
          onSuccess={handleEkycSuccess}
        />
      )}

      {/* Modal Từ Chối Nhận Thừa Kế (Điều 620 BLDS) */}
      {claim && (
        <RefuseInheritanceModal
          isOpen={activeModal === "refuse"}
          claimId={claim.id}
          vaultTitle={claim.vaultTitle}
          onClose={handleCloseModal}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};
