import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  FileText, 
  Download, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Clock, 
  Scale, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { Button, Card, Badge } from "@/shared/ui";
import { shamirCombine, decryptHeritageAssetPayload, type DecryptedHeritageResult } from "@/shared/lib/crypto/shamir";
import { ComplianceCallout } from "@/shared/ui";
import type { BeneficiaryClaimDetailDto } from "../model/handover.types";
import { useConfirmHandover } from "../model/useHandover";

/**
 * @file DecryptionHandoverCard.tsx
 * @description Thẻ ghép khóa Shamir 2/3 tại RAM máy khách và giải mã dữ liệu di sản số (AES-256-GCM).
 * Dữ liệu giải mã chỉ tồn tại trong RAM máy khách, bộ đếm tự động dọn sạch sau 60 giây.
 */

export interface DecryptionHandoverCardProps {
  /** Chi tiết hồ sơ bàn giao của Người thụ hưởng */
  claim: BeneficiaryClaimDetailDto;
  /** Mở hộp thoại xác thực sinh trắc học eKYC */
  onOpenEkycModal: () => void;
  /** Mở hộp thoại từ chối nhận thừa kế theo Điều 620 BLDS */
  onOpenRefuseModal: () => void;
  /** Trạng thái đã vượt qua eKYC hay chưa */
  isEkycVerified: boolean;
}

export const DecryptionHandoverCard: React.FC<DecryptionHandoverCardProps> = ({
  claim,
  onOpenEkycModal,
  onOpenRefuseModal,
  isEkycVerified,
}) => {
  // Biến RAM cục bộ: Chỉ lưu trong bộ nhớ tạm thời, tự hủy sau 60s hoặc unmount
  const [decryptedResult, setDecryptedResult] = useState<DecryptedHeritageResult | null>(null);
  const [ramTimeLeft, setRamTimeLeft] = useState<number>(60); // 60s đếm ngược tự hủy RAM
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmHandoverMutation = useConfirmHandover();

  // Bộ đếm ngược 60 giây tự động hủy biến RAM bảo vệ an ninh di sản số
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (decryptedResult && ramTimeLeft > 0) {
      timer = setInterval(() => {
        setRamTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (ramTimeLeft === 0 && decryptedResult) {
      // Dọn sạch RAM ngay khi hết 60s
      setDecryptedResult(null);
      setRamTimeLeft(60);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [decryptedResult, ramTimeLeft]);

  const handleRecombineAndDecrypt = async () => {
    setErrorMessage(null);

    try {
      const masterKeyHex = shamirCombine([claim.vaultShare1, claim.notaryShare2]);
      const decryptedText = await decryptHeritageAssetPayload(
        claim.encryptedAssetPayload,
        masterKeyHex,
        claim.assetPayloadIv
      );

      setDecryptedResult({
        masterKeyHex,
        decryptedData: decryptedText,
        decryptedAt: new Date().toISOString(),
      });
      setRamTimeLeft(60);

      // Tính toán SHA-256 digest của nội dung giải mã bằng Web Crypto API (Zero Egress Master Key)
      const encoder = new TextEncoder();
      const digestBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        encoder.encode(decryptedText)
      );
      const digestHex = Array.from(new Uint8Array(digestBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Xác nhận với server đã bàn giao di sản (chỉ gửi mã băm digest, tuyệt đối không gửi Master Key)
      confirmHandoverMutation.mutate({
        claimId: claim.id,
        decryptedDigest: digestHex,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Giải mã di sản số thất bại."
      );
    }
  };

  const handleCopy = () => {
    if (decryptedResult) {
      navigator.clipboard.writeText(decryptedResult.decryptedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const seedWords = decryptedResult?.decryptedData.split(" ") ?? [];

  return (
    <div className="w-full space-y-6">
      {/* 1. Thẻ tổng quan hồ sơ thừa kế đã được phê duyệt */}
      <Card className="p-6 bg-[#FAF9F5] border border-[#E8DCC6] rounded-[24px] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DCC6]/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#0B291E]">{claim.vaultTitle}</h3>
              <Badge className="bg-[#E5EDE8] text-[#059669] border border-[#059669]/20 text-[10px] font-bold">
                Đã Duyệt Thừa Kế
              </Badge>
            </div>
            <p className="text-xs text-[#66786E] mt-0.5">
              Chủ di sản: <span className="font-bold text-[#0B291E]">{claim.deceasedFullName}</span> (Từ trần: {claim.deceasedDateOfDeath})
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold text-[#66786E] uppercase tracking-wider block">
              Tỷ lệ phân bổ thừa kế:
            </span>
            <span className="text-xl font-bold text-[#B88E4C]">{claim.allocatedPercentage}% Di Sản</span>
          </div>
        </div>

        {/* Ma trận 2 Mảnh khóa Shamir */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mảnh khóa 1 */}
          <div className="p-4 rounded-2xl bg-[#EFECE6]/50 border border-[#DCD9D0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B291E] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#B88E4C]" />
                Mảnh Khóa 1 (Két Di Sản Số)
              </span>
              <Badge variant="outline" className="text-[10px] bg-white border-[#DCD9D0]">
                Index: 1
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-[#66786E] bg-white/70 p-2 rounded-xl border border-[#DCD9D0] truncate select-all">
              {claim.vaultShare1}
            </p>
            <p className="text-[10px] text-[#66786E]">Được lưu trữ phân tán, giải phóng tự động khi kích hoạt thừa kế.</p>
          </div>

          {/* Mảnh khóa 2 */}
          <div className="p-4 rounded-2xl bg-[#EFECE6]/50 border border-[#DCD9D0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B291E] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                Mảnh Khóa 2 (Công Chứng Viên Ký Số)
              </span>
              <Badge variant="outline" className="text-[10px] bg-white border-[#DCD9D0]">
                Index: 2
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-[#66786E] bg-white/70 p-2 rounded-xl border border-[#DCD9D0] truncate select-all">
              {claim.notaryShare2}
            </p>
            <p className="text-[10px] text-[#66786E]">
              Phê duyệt bởi: {claim.notaryOfficerName} ({claim.notaryOfficeName})
            </p>
          </div>
        </div>

        {/* Nút bấm hành động trước khi giải mã */}
        {!decryptedResult && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={onOpenRefuseModal}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5"
            >
              <Scale className="w-4 h-4" />
              <span>Từ Chối Nhận Thừa Kế (Điều 620 BLDS)</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isEkycVerified ? (
                <Button
                  onClick={onOpenEkycModal}
                  className="w-full sm:w-auto min-h-[46px] rounded-[18px] bg-[#B88E4C] hover:bg-[#a37d3f] text-white text-xs font-bold px-6 flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bước 1: Quét Sinh Trắc Học eKYC</span>
                </Button>
              ) : (
                <Button
                  onClick={handleRecombineAndDecrypt}
                  className="w-full sm:w-auto min-h-[46px] rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-6 flex items-center justify-center gap-2 shadow-md"
                >
                  <Unlock className="w-4 h-4 text-[#B88E4C]" />
                  <span>Bước 2: Ghép Khóa Shamir & Giải Mã Tại RAM</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </Card>

      {/* 2. Khung Hiển Thị Di Sản Đã Giải Mã Tại RAM (Chỉ hiển thị sau khi ghép khóa thành công) */}
      {decryptedResult && (
        <Card className="p-6 bg-gradient-to-b from-[#FAF9F5] to-[#FBF7EE] border-2 border-[#B88E4C] rounded-[26px] shadow-lg space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B88E4C]/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#059669] text-white flex items-center justify-center shadow-sm">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B291E]">
                  Di Sản Số Đã Giải Mã Thành Công (Client RAM Only)
                </h4>
                <p className="text-xs text-[#66786E]">
                  Dữ liệu được lưu trong bộ nhớ tạm và sẽ tự động hủy sau 60 giây để chống rò rỉ
                </p>
              </div>
            </div>

            {/* Bộ đếm ngược 60s */}
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#B88E4C]">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span className="text-xs font-mono font-bold text-[#0B291E]">
                Tự hủy sau: <span className="text-red-600">{ramTimeLeft}s</span>
              </span>
            </div>
          </div>

          {/* Lưới 12 Từ Khóa Hạt Giống (Master Seed Words) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B291E] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B88E4C]" />
                12 Từ Khóa Hạt Giống Khôi Phục (Recovery Seed Phrase):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  aria-label={isMasked ? "Hiển thị khóa" : "Ẩn khóa"}
                  className="text-xs font-bold text-[#66786E] hover:text-[#0B291E] flex items-center gap-1.5 p-1"
                >
                  {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isMasked ? "Hiện Khóa" : "Che Khóa"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Sao chép khóa"
                  className="text-xs font-bold text-[#B88E4C] hover:underline flex items-center gap-1.5 p-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            {/* Lưới 3 cột */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {seedWords.map((word, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#DCD9D0] shadow-xs"
                >
                  <span className="text-[10px] font-mono font-bold text-[#66786E] w-4 text-right">
                    {index + 1}.
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0B291E]">
                    {isMasked ? "••••••" : word}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nút tải Biên Bản Bàn Giao PDF/A Chính Thức */}
          <div className="p-4 rounded-2xl bg-[#E5EDE8] border border-[#059669]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#059669]" />
              <div>
                <p className="text-xs font-bold text-[#0B291E]">Biên Bản Bàn Giao Di Sản Số (PDF/A)</p>
                <p className="text-[10px] text-[#66786E]">
                  Đã được ký số xác thực bởi Văn phòng Công chứng & Két di sản LegacyVault
                </p>
              </div>
            </div>

            <Button
              asChild
              className="w-full sm:w-auto rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2"
            >
              <a href={claim.pdfHandoverProtocolUrl || "#"} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 text-[#B88E4C]" />
                <span>Tải Biên Bản Ký Số</span>
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* 3. Hộp Cảnh Báo Tuân Thủ Pháp Luật (Điều 612 & Điều 644 BLDS) */}
      <ComplianceCallout
        title="Tuân Thủ Pháp Lý Thừa Kế (Điều 612 & Điều 644 Bộ luật Dân sự 2015)"
        description="Việc giải mã và tiếp quản di sản số chỉ hoàn tất khi Người thụ hưởng thực hiện đầy đủ nghĩa vụ đối với người thuộc diện hưởng di sản không phụ thuộc vào nội dung di chúc (cha mẹ, vợ/chồng, con chưa thành niên) theo đúng quy định của pháp luật Việt Nam."
      />
    </div>
  );
};
