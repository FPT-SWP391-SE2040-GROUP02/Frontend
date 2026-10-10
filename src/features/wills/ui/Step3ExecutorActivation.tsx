import React from "react";
import { Button, Input, Card, CustomCheckbox } from "@/shared/ui";
import { UserCheck, ShieldCheck, AlertCircle, CheckCircle2, Zap } from "lucide-react";

/**
 * @file Step3ExecutorActivation.tsx
 * @description Bước 3 của Thiết Lập Kế Hoạch Di Sản (SRS 3.11.0 - Luồng 1B - SETUP-01):
 * 1. Chỉ định Người thi hành chính (Executor) và Người thi hành dự phòng.
 * 2. Đối soát điều kiện kích hoạt di sản (SETUP-01: Gói XS/XS Max, Executor, chỉ định hợp lệ).
 * 3. Xác nhận chính sách kho đồng sở hữu và kích hoạt kế hoạch.
 */

export interface ExecutorInfo {
  name: string;
  email: string;
  phone: string;
  backupName?: string;
  backupEmail?: string;
}

interface Step3ExecutorActivationProps {
  executor: ExecutorInfo;
  onUpdateExecutor: (field: keyof ExecutorInfo, value: string) => void;
  policyConfirmed: boolean;
  onPolicyConfirmChange: (confirmed: boolean) => void;
  planName?: string;
  validAssetsCount: number;
  validBundlesCount: number;
  isPending?: boolean;
  onActivate: () => void;
  errorMessage?: string | null;
}

export const Step3ExecutorActivation: React.FC<Step3ExecutorActivationProps> = ({
  executor,
  onUpdateExecutor,
  policyConfirmed,
  onPolicyConfirmChange,
  planName = "Legacy XS Max (Còn 365 ngày)",
  validAssetsCount,
  validBundlesCount,
  isPending = false,
  onActivate,
  errorMessage,
}) => {
  const isFormValid =
    executor.name.trim().length >= 2 &&
    executor.email.trim().length >= 5 &&
    validAssetsCount > 0 &&
    validBundlesCount > 0 &&
    policyConfirmed;

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Giải thích */}
      <div>
        <h2 className="text-xl font-bold text-[#14241C]">
          Bước 3: Chỉ Định Người Thực Thi & Kích Hoạt Kế Hoạch
        </h2>
        <p className="text-xs text-[#66786E] mt-1 leading-relaxed">
          Chỉ định Người thực thi (Executor) chịu trách nhiệm nộp giấy chứng tử và bắt đầu bàn giao. Kiểm tra điều kiện kích hoạt di sản theo chuẩn SRS 3.11.0 (SETUP-01).
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#DC2626] font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PHẦN 1: THÔNG TIN NGƯỜI THI HÀNH (EXECUTOR) */}
      <Card className="p-5 bg-[#FAF9F5] border-[#DCD9D0] rounded-[20px] space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#B88E4C]" />
          <h3 className="text-sm font-bold text-[#14241C]">
            1. Người Thực Thi Chính (Primary Executor) *
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-[#66786E] uppercase block mb-1">
              Họ và tên Người Thực Thi *
            </label>
            <Input
              value={executor.name}
              onChange={(e) => onUpdateExecutor("name", e.target.value)}
              placeholder="VD: Trần Đình Trọng"
              className="h-10 text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#66786E] uppercase block mb-1">
              Email Thông Báo Pháp Lý *
            </label>
            <Input
              type="email"
              value={executor.email}
              onChange={(e) => onUpdateExecutor("email", e.target.value)}
              placeholder="VD: trong.tran@lawfirm.vn"
              className="h-10 text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#66786E] uppercase block mb-1">
              Số Điện Thoại Xác Minh
            </label>
            <Input
              value={executor.phone}
              onChange={(e) => onUpdateExecutor("phone", e.target.value)}
              placeholder="VD: 0912345678"
              className="h-10 text-xs bg-white"
            />
          </div>
        </div>

        {/* Người thi hành dự phòng */}
        <div className="pt-3 border-t border-[#E8E5DD] space-y-3">
          <label className="text-xs font-bold text-[#66786E] uppercase block">
            Người Thực Thi Dự Phòng (Tùy chọn - Tự động thay thế nếu người chính mất tư cách)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              value={executor.backupName || ""}
              onChange={(e) => onUpdateExecutor("backupName", e.target.value)}
              placeholder="Họ tên người dự phòng (VD: Lê Thị Mai)"
              className="h-9 text-xs bg-white"
            />
            <Input
              type="email"
              value={executor.backupEmail || ""}
              onChange={(e) => onUpdateExecutor("backupEmail", e.target.value)}
              placeholder="Email người dự phòng"
              className="h-9 text-xs bg-white"
            />
          </div>
        </div>
      </Card>

      {/* PHẦN 2: BẢNG KIỂM TRA ĐIỀU KIỆN KÍCH HOẠT (SETUP-01) */}
      <Card className="p-5 bg-white border-[#DCD9D0] rounded-[20px] space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#059669]" />
          <h3 className="text-sm font-bold text-[#14241C]">
            2. Điều Kiện Kích Hoạt Kế Hoạch Di Sản (SETUP-01)
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF9F5] border border-[#E8E5DD]">
            <span className="text-[#14241C]">Gói dịch vụ Owner trả phí còn hạn:</span>
            <span className="font-bold text-[#059669] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {planName}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF9F5] border border-[#E8E5DD]">
            <span className="text-[#14241C]">Số lượng tài sản đã chỉ định hợp lệ:</span>
            <span className={`font-bold flex items-center gap-1 ${validAssetsCount > 0 ? "text-[#059669]" : "text-red-500"}`}>
              {validAssetsCount > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {validAssetsCount} tài sản
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF9F5] border border-[#E8E5DD]">
            <span className="text-[#14241C]">Kho bàn giao tự gom đã tạo (manifest):</span>
            <span className={`font-bold flex items-center gap-1 ${validBundlesCount > 0 ? "text-[#059669]" : "text-red-500"}`}>
              {validBundlesCount > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {validBundlesCount} kho bàn giao
            </span>
          </div>
        </div>
      </Card>

      {/* PHẦN 3: XÁC NHẬN CHÍNH SÁCH BÀN GIAO */}
      <Card className="p-4 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] space-y-2">
        <CustomCheckbox
          id="policy-confirm"
          checked={policyConfirmed}
          onChange={(e) => onPolicyConfirmChange(e.target.checked)}
          label={
            <span className="font-bold text-[#0B291E] text-xs">
              Tôi xác nhận chính sách bàn giao: Kho một người được chọn chuyển 1:1 trước khi bắt đầu; Kho đồng sở hữu bắt buộc 100% đồng thuận; Bàn giao chỉ mở sau khi Verifier duyệt giấy chứng tử (SRS 3.11.0).
            </span>
          }
        />
      </Card>

      {/* NÚT KÍCH HOẠT */}
      <div className="pt-2">
        <Button
          type="button"
          disabled={!isFormValid || isPending}
          onClick={onActivate}
          className="w-full min-h-[50px] rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-[#B88E4C]" />
          <span>{isPending ? "Đang Niêm Phong & Kích Hoạt..." : "Xác Nhận & Kích Hoạt Kế Hoạch Di Sản"}</span>
        </Button>
      </div>
    </div>
  );
};
