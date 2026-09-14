import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X, ShieldAlert, KeyRound, AlertTriangle } from "lucide-react";
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui";
import { 
  notaryApproveSchema, 
  notaryRejectSchema, 
  type NotaryApproveFormValues, 
  type NotaryRejectFormValues,
  NOTARY_REJECTION_REASONS,
  REJECTION_REASON_LABELS
} from "../model/notary.schema";
import type { AuditCriteriaChecklist } from "../model/notary.types";
import { useApproveClaim, useRejectClaim } from "../model/useNotaryClaims";

/**
 * @file NotaryReviewModals.tsx
 * @description Các hộp thoại Phê duyệt (Ký số giải phóng Mảnh khóa 2) và Từ chối (Lý do >= 20 ký tự) cho Công chứng viên.
 * Áp dụng React Hook Form + Zod Schema (Form State chuẩn mực, không dùng useState cho các ô input).
 */

// ==============================================================================
// 1. MODAL PHÊ DUYỆT HỒ SƠ & GIẢI PHÓNG MẢNH KHÓA SHAMIR 2
// ==============================================================================

export interface NotaryApproveModalProps {
  isOpen: boolean;
  claimId: string;
  checkCriteria: AuditCriteriaChecklist;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotaryApproveModal: React.FC<NotaryApproveModalProps> = ({
  isOpen,
  claimId,
  checkCriteria,
  onClose,
  onSuccess,
}) => {
  const { mutate: approveMutation, isPending } = useApproveClaim();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotaryApproveFormValues>({
    resolver: zodResolver(notaryApproveSchema),
    defaultValues: {
      claimId,
      notaryPinCode: "",
      checkCriteria,
      notaryNotes: "",
    },
  });

  const onSubmit = (values: NotaryApproveFormValues) => {
    approveMutation(
      {
        claimId,
        notaryPinCode: values.notaryPinCode,
        checkCriteria,
        notaryNotes: values.notaryNotes,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#FAF9F5] border-[#DCD9D0] rounded-[24px] p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="w-12 h-12 rounded-[16px] bg-[#E5EDE8] flex items-center justify-center text-[#059669] mx-auto mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-bold text-center text-[#0B291E]">
            Ký Số Phê Duyệt & Giải Phóng Mảnh Khóa 2
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-[#66786E]">
            Thao tác này sẽ giải phóng Mảnh khóa Verifier (Shamir Share 2). Người thụ hưởng sẽ đủ điều kiện kết hợp với Mảnh khóa System để mở khóa di sản.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Cảnh báo tính pháp lý */}
          <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
            <p className="text-[11px] leading-relaxed">
              Bạn cam đoan đã kiểm tra kỹ lưỡng 4 tiêu chí kiểm toán và hoàn toàn chịu trách nhiệm pháp lý với chữ ký số công chứng viên này.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#14241C]">
              Mã PIN Chữ Ký Số Công Chứng (6 Chữ Số) <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              maxLength={6}
              placeholder="VD: 123456"
              {...register("notaryPinCode")}
              className="text-center tracking-widest font-mono text-base font-bold bg-white"
            />
            {errors.notaryPinCode && (
              <p className="text-[11px] text-red-600">{errors.notaryPinCode.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#14241C]">Ghi Chú Phê Duyệt (Tùy chọn)</label>
            <textarea
              {...register("notaryNotes")}
              rows={2}
              placeholder="Ghi chú thêm về căn cứ đối soát..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD9D0] text-xs focus:ring-2 focus:ring-[#B88E4C] focus:outline-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[16px] text-xs font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-5"
            >
              {isPending ? "Đang Giải Phóng Khóa..." : "Xác Nhận & Giải Phóng Khóa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ==============================================================================
// 2. MODAL TỪ CHỐI HỒ SƠ & YÊU CẦU BỔ SUNG (LÝ DO >= 20 KÝ TỰ)
// ==============================================================================

export interface NotaryRejectModalProps {
  isOpen: boolean;
  claimId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotaryRejectModal: React.FC<NotaryRejectModalProps> = ({
  isOpen,
  claimId,
  onClose,
  onSuccess,
}) => {
  const { mutate: rejectMutation, isPending } = useRejectClaim();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<NotaryRejectFormValues>({
    resolver: zodResolver(notaryRejectSchema),
    defaultValues: {
      claimId,
      rejectionReasonCode: NOTARY_REJECTION_REASONS.UNCLEAR_DOCUMENT,
      notaryNotes: "",
    },
  });

  const notesValue = watch("notaryNotes") || "";

  const onSubmit = (values: NotaryRejectFormValues) => {
    rejectMutation(
      {
        claimId,
        rejectionReasonCode: values.rejectionReasonCode,
        notaryNotes: values.notaryNotes,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#FAF9F5] border-[#DCD9D0] rounded-[24px] p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="w-12 h-12 rounded-[16px] bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-bold text-center text-red-800">
            Từ Chối Hồ Sơ Yêu Cầu Mở Thừa Kế
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-[#66786E]">
            Hồ sơ sẽ chuyển sang trạng thái "Yêu cầu bổ sung". Thông báo kèm nội dung giải trình sẽ được phát đến Người thi hành.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Chọn lý do từ chối chuẩn mực */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#14241C]">
              Lý Do Từ Chối Chuẩn <span className="text-red-500">*</span>
            </label>
            <select
              {...register("rejectionReasonCode")}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD9D0] text-xs font-medium focus:ring-2 focus:ring-[#B88E4C] focus:outline-none"
            >
              {Object.entries(REJECTION_REASON_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label.length > 60 ? `${label.substring(0, 60)}...` : label}
                </option>
              ))}
            </select>
          </div>

          {/* Ô nhập giải trình tối thiểu 20 ký tự */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#14241C]">
              <span>Hướng Dẫn Sửa Đổi / Bổ Sung <span className="text-red-500">*</span></span>
              <span className={`text-[10px] font-mono ${notesValue.length < 20 ? "text-amber-600" : "text-[#059669]"}`}>
                {notesValue.length}/20 ký tự tối thiểu
              </span>
            </div>
            <textarea
              {...register("notaryNotes")}
              rows={4}
              placeholder="Nêu rõ lý do từ chối và hướng dẫn Người thi hành cách bổ sung giấy tờ hợp lệ (Tối thiểu 20 ký tự)..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD9D0] text-xs focus:ring-2 focus:ring-[#B88E4C] focus:outline-none"
            />
            {errors.notaryNotes && (
              <p className="text-[11px] text-red-600 font-semibold">{errors.notaryNotes.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[16px] text-xs font-bold"
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={isPending || notesValue.length < 20}
              className="rounded-[16px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 disabled:opacity-50"
            >
              {isPending ? "Đang Xử Lý..." : "Xác Nhận Từ Chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
