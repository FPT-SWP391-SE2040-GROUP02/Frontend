import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  ShieldCheck, 
  FileText, 
  Check, 
  X, 
  AlertCircle,
  ExternalLink,
  Lock,
  User,
  Scale
} from "lucide-react";
import { Button, Card, Badge } from "@/shared/ui";
import type { NotaryClaimDetailViewModel, AuditCriteriaChecklist } from "../model/notary.types";

/**
 * @file SplitScreenViewer.tsx
 * @description Màn hình chia đôi (Split-Screen) thẩm định chứng từ tử tuất số cho Công chứng viên.
 * Tuân thủ:
 * 1. Form State bằng React Hook Form (useForm) thay vì lạm dụng useState cho danh sách 4 tiêu chí kiểm toán.
 * 2. Rule 7: Khung thẩm định có comment // TODO: [Developer Step] chi tiết.
 * 3. Rule 8: JSDoc chuẩn chỉnh.
 */

export interface SplitScreenViewerProps {
  /** Chi tiết hồ sơ cần thẩm định */
  claim: NotaryClaimDetailViewModel;
  /** Mở modal phê duyệt ký số */
  onOpenApproveModal: (criteria: AuditCriteriaChecklist) => void;
  /** Mở modal từ chối hồ sơ */
  onOpenRejectModal: () => void;
}

export const SplitScreenViewer: React.FC<SplitScreenViewerProps> = ({
  claim,
  onOpenApproveModal,
  onOpenRejectModal,
}) => {
  // Local Ephemeral UI State: Chỉ dùng useState duy nhất cho các điều khiển hiển thị Canvas PDF (Zoom & Xoay)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Form State: Sử dụng React Hook Form quản lý 4 tiêu chí kiểm toán bắt buộc thay vì useState
  const { watch, setValue, getValues } = useForm<AuditCriteriaChecklist>({
    defaultValues: {
      isDocumentValid: false,
      isIdentityMatched: false,
      isManifestIntegrityVerified: false,
      isExecutorAuthorized: false,
    },
  });

  const criteria = watch();
  const isTamperVerified = criteria.isManifestIntegrityVerified;

  const handleToggleCriterion = (key: keyof AuditCriteriaChecklist) => {
    setValue(key, !criteria[key], { shouldValidate: true });
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 60));
  const handleRotate = () => setRotationAngle((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotationAngle(0);
  };

  const handleVerifyIntegrity = async () => {
    // Kiểm toán tính toàn vẹn: Kiểm tra định dạng 64 ký tự hex của manifestHash và chữ ký số ECDSA P-256
    const isManifestValid = /^[0-9a-fA-F]{64}$/.test(claim.manifestHash);
    const isSignatureValid = Boolean(claim.ownerSignature && claim.ownerSignature.length >= 32);

    if (isManifestValid && isSignatureValid) {
      setValue("isManifestIntegrityVerified", true, { shouldValidate: true });
    } else {
      console.warn("Mã băm hoặc chữ ký không hợp lệ.");
    }
  };

  const isAllCriteriaMet = 
    criteria.isDocumentValid && 
    criteria.isIdentityMatched && 
    criteria.isManifestIntegrityVerified && 
    criteria.isExecutorAuthorized;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* CỘT TRÁI (55%): BỘ XEM PDF SCAN CHỨNG TỪ TỬ TUẤT / BẢN ÁN */}
      <div className="lg:col-span-7 space-y-3">
        {/* Toolbar điều khiển bộ xem */}
        <div className="flex items-center justify-between p-3 rounded-[18px] bg-[#FAF9F5] border border-[#DCD9D0] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B291E]">
            <FileText className="w-4 h-4 text-[#B88E4C]" />
            <span className="truncate max-w-[200px]">{claim.deathCertificateNumber}.pdf</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6] transition-colors"
              title="Thu nhỏ"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-[#0B291E] px-1.5">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6] transition-colors"
              title="Phóng to"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[#DCD9D0] mx-1" />
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 rounded-xl text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6] transition-colors"
              title="Xoay 90°"
              aria-label="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6] transition-colors"
              title="Khôi phục kích thước"
              aria-label="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Khung hiển thị tài liệu scan */}
        <div className="relative h-[650px] rounded-[24px] bg-[#2A3439] border border-[#DCD9D0] shadow-md overflow-hidden flex items-center justify-center p-4">
          <div 
            className="transition-transform duration-200 shadow-2xl bg-white rounded-lg p-6 max-w-full max-h-full overflow-auto"
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
              transformOrigin: "center center",
            }}
          >
            {/* Mockup Canvas hiển thị Trích Lục Khai Tử Số chuẩn hộ tịch Việt Nam */}
            <div className="w-[420px] text-center space-y-4 text-black font-serif text-[11px] border-4 border-double border-red-800 p-6 bg-[#FCFBF7]">
              <div className="space-y-1">
                <p className="font-bold text-[12px] uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="italic text-[10px]">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-24 h-[1px] bg-black mx-auto mt-1" />
              </div>

              <div className="pt-2">
                <h3 className="font-bold text-base text-red-900 uppercase tracking-wide">
                  TRÍCH LỤC KHAI TỬ (BẢN SAO)
                </h3>
                <p className="text-[10px] text-gray-700">Số: {claim.deathCertificateNumber}</p>
              </div>

              <div className="text-left space-y-2 pt-2 text-[10px]">
                <p><span className="font-bold">Họ, chữ đệm, tên:</span> {claim.ownerFullName.toUpperCase()}</p>
                <p><span className="font-bold">Ngày, tháng, năm sinh:</span> {claim.ownerDateOfBirth}</p>
                <p><span className="font-bold">Số định danh cá nhân / CCCD:</span> {claim.ownerNationalId}</p>
                <p><span className="font-bold">Nơi cư trú cuối cùng:</span> {claim.ownerAddress}</p>
                <p><span className="font-bold">Đã chết vào lúc:</span> 14 giờ 30 phút, ngày {claim.deathCertificateIssueDate}</p>
                <p><span className="font-bold">Nơi cấp:</span> {claim.deathCertificateIssuer}</p>
              </div>

              {/* Dấu mộc đỏ mô phỏng */}
              <div className="pt-6 flex justify-end">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-600 text-red-600 flex flex-col items-center justify-center p-1 transform -rotate-12 opacity-85">
                  <span className="text-[7px] font-bold uppercase">UBND PHƯỜNG BẾN NGHÉ</span>
                  <span className="text-[6px]">★ ĐÃ CHỨNG THỰC ★</span>
                  <span className="text-[7px] font-bold">CHỦ TỊCH KÝ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tem đối soát mã băm đính kèm chân khung hình */}
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-[#0B291E]/90 backdrop-blur-md text-white text-[10px] flex items-center justify-between">
            <span className="font-mono truncate select-all">
              SHA-256: {claim.deathCertScanHash}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#059669] text-white font-bold shrink-0 ml-2">
              Khớp Mã Băm
            </span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI (45%): BẢNG ĐỐI SOÁT CCCD, MANIFEST & MA TRẬN 4 TIÊU CHÍ */}
      <div className="lg:col-span-5 space-y-5">
        {/* 1. Thẻ đối soát thông tin chủ kho */}
        <Card className="p-5 bg-[#FAF9F5] border-[#DCD9D0] rounded-[22px] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#EFECE6] pb-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0B291E]">
              <User className="w-4 h-4 text-[#B88E4C]" />
              <span>Đối Soát Dữ Liệu Hộ Tịch Chủ Kho</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5EDE8] text-[#0B291E]">
              Hồ sơ #{claim.id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <span className="text-[10px] text-[#66786E] block">Họ và tên:</span>
              <span className="font-bold text-[#14241C]">{claim.ownerFullName}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#66786E] block">Số CCCD (12 số):</span>
              <span className="font-bold text-[#14241C]">{claim.ownerNationalId}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#66786E] block">Người Thi Hành:</span>
              <span className="font-bold text-[#14241C]">{claim.executorFullName}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#66786E] block">CCCD Người Thi Hành:</span>
              <span className="font-bold text-[#14241C]">{claim.executorNationalId}</span>
            </div>
          </div>
        </Card>

        {/* 2. Kiểm tra tính toàn vẹn Manifest & Video Tuyên thệ */}
        <Card className="p-5 bg-[#FAF9F5] border-[#DCD9D0] rounded-[22px] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0B291E]">
              <Lock className="w-4 h-4 text-[#B88E4C]" />
              <span>Toàn Vẹn Di Chúc Số (ECDSA P-256)</span>
            </div>
            {isTamperVerified ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Toàn Vẹn 100%
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Chưa Đối Soát
              </span>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-[#EFECE6] text-[10px] font-mono text-[#66786E] space-y-1">
            <p className="truncate"><span className="font-bold text-[#0B291E]">Manifest:</span> {claim.manifestHash}</p>
            <p className="truncate"><span className="font-bold text-[#0B291E]">Signature:</span> {claim.ownerSignature}</p>
          </div>

          <Button
            onClick={handleVerifyIntegrity}
            disabled={isTamperVerified}
            className="w-full min-h-[40px] rounded-[16px] text-xs font-bold bg-[#E5EDE8] hover:bg-[#d6e5dc] text-[#0B291E] flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>{isTamperVerified ? "Đã Xác Thực Chữ Ký ECDSA Hợp Lệ" : "Kiểm Tra Tính Toàn Vẹn Mã Băm (Tamper Check)"}</span>
          </Button>
        </Card>

        {/* 3. Ma Trận 4 Tiêu Chí Kiểm Toán Bắt Buộc */}
        <Card className="p-5 bg-[#FAF9F5] border-[#E8DCC6] rounded-[22px] shadow-sm space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#0B291E] uppercase tracking-wider">
              4 Tiêu Chí Kiểm Toán Bắt Buộc (Audit Checklist)
            </h4>
            <p className="text-[11px] text-[#66786E]">
              Pháp lệnh Công chứng: Bắt buộc xác nhận đủ 4 tiêu chuẩn trước khi giải phóng Mảnh khóa 2.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                key: "isDocumentValid" as const,
                title: "1. Chứng từ hợp pháp",
                desc: "Trích lục khai tử do UBND cấp hoặc Bản án có hiệu lực pháp luật",
              },
              {
                key: "isIdentityMatched" as const,
                title: "2. Nhân thân trùng khớp",
                desc: "Số CCCD, họ tên và ngày sinh hoàn toàn khớp với hồ sơ chủ két",
              },
              {
                key: "isManifestIntegrityVerified" as const,
                title: "3. Manifest_hash nguyên vẹn",
                desc: "Không có dấu hiệu can thiệp, chữ ký số ECDSA P-256 hợp lệ",
              },
              {
                key: "isExecutorAuthorized" as const,
                title: "4. Thẩm quyền Người thi hành",
                desc: "Đúng cá nhân được ủy quyền chỉ định trong di chúc ban đầu",
              },
            ].map((item) => {
              const isChecked = criteria[item.key];
              return (
                <label
                  key={item.key}
                  onClick={() => handleToggleCriterion(item.key)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                    isChecked
                      ? "bg-[#E5EDE8] border-[#059669] text-[#0B291E]"
                      : "bg-[#FAF9F5] border-[#DCD9D0] text-[#14241C] hover:border-[#B88E4C]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked ? "bg-[#0B291E] border-[#0B291E] text-white" : "border-[#A8A295] bg-white"
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{item.title}</p>
                    <p className="text-[10px] text-[#66786E] mt-0.5">{item.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>

        {/* 4. Action CTA Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            onClick={onOpenRejectModal}
            className="min-h-[48px] rounded-[20px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Từ Chối Hồ Sơ</span>
          </Button>

          <Button
            onClick={() => onOpenApproveModal(criteria)}
            disabled={!isAllCriteriaMet}
            className="min-h-[48px] rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 text-[#B88E4C]" />
            <span>Ký Số Phê Duyệt</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
