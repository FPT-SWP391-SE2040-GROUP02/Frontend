import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scale, AlertTriangle, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Card,
} from "@/shared/ui";
import {
  refuseInheritanceSchema,
  type RefuseInheritanceFormValues,
} from "../model/handover.schema";
import { useRefuseInheritance } from "../model/useHandover";

/**
 * @file RefuseInheritanceModal.tsx
 * @description Hộp thoại Người thụ hưởng từ chối nhận quyền thừa kế theo Điều 620 Bộ luật Dân sự 2015.
 * Khi từ chối thành công, hệ thống tự động kích hoạt Tầng phân bổ dự phòng (Fallback Tier 2).
 */

export interface RefuseInheritanceModalProps {
  isOpen: boolean;
  claimId: string;
  vaultTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RefuseInheritanceModal: React.FC<RefuseInheritanceModalProps> = ({
  isOpen,
  claimId,
  vaultTitle,
  onClose,
  onSuccess,
}) => {
  const refuseMutation = useRefuseInheritance();

  // Form State quản lý bởi React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RefuseInheritanceFormValues>({
    resolver: zodResolver(refuseInheritanceSchema),
    defaultValues: {
      claimId,
      reason: "",
      confirmLegalWaiver: undefined,
      notarizedDocScanUrl: "",
    },
  });

  const onSubmit = (values: RefuseInheritanceFormValues) => {
    // Gửi đơn từ chối nhận di sản lên máy chủ
    refuseMutation.mutate(
      {
        claimId: values.claimId,
        reason: values.reason,
        confirmLegalWaiver: values.confirmLegalWaiver,
        notarizedDocScanUrl: values.notarizedDocScanUrl,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-[#FAF9F5] border border-[#E8DCC6] rounded-[28px] shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-[#FEF2F2] to-[#FAF9F5] border-b border-[#FCA5A5]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#0B291E]">
                  Từ Chối Nhận Di Sản (Điều 620 BLDS)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#66786E]">
                  Kho di sản: <span className="font-bold text-[#0B291E]">{vaultTitle}</span>
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng hộp thoại"
              className="p-1.5 rounded-full hover:bg-black/5 text-[#66786E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <input type="hidden" {...register("claimId")} value={claimId} />

          {/* Cảnh báo hậu quả pháp lý */}
          <Card className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-red-800 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Lưu Ý Pháp Lý Quan Trọng</span>
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              Theo quy định tại Điều 620 Bộ luật Dân sự 2015, việc từ chối nhận di sản phải được thể hiện bằng văn bản rõ ràng trước thời điểm phân chia di sản. Sau khi từ chối, toàn bộ quyền thừa kế của bạn sẽ được chuyển giao cho Người thụ hưởng dự phòng kế tiếp.
            </p>
          </Card>

          {/* Lý do từ chối */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B291E] block">
              Lý do từ chối nhận di sản <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("reason")}
              rows={4}
              placeholder="Vui lòng nêu rõ lý do bạn từ chối nhận quyền thừa kế đối với di sản này (tối thiểu 30 ký tự)..."
              className={`w-full p-3 text-xs rounded-2xl border bg-white text-[#14241C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B291E] transition-all resize-none ${
                errors.reason ? "border-red-400 focus:ring-red-400" : "border-[#DCD9D0]"
              }`}
            />
            {errors.reason && (
              <p className="text-[11px] text-red-600 font-bold">{errors.reason.message}</p>
            )}
          </div>

          {/* Link văn bản công chứng từ chối nếu có */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B291E] block">
              Đường dẫn văn bản công chứng từ chối thừa kế (Tùy chọn)
            </label>
            <input
              type="url"
              {...register("notarizedDocScanUrl")}
              placeholder="https://storage.legacyvault.vn/waivers/tu_choi_thua_ke.pdf"
              className={`w-full p-2.5 text-xs rounded-xl border bg-white text-[#14241C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B291E] transition-all ${
                errors.notarizedDocScanUrl ? "border-red-400" : "border-[#DCD9D0]"
              }`}
            />
            {errors.notarizedDocScanUrl && (
              <p className="text-[11px] text-red-600 font-bold">{errors.notarizedDocScanUrl.message}</p>
            )}
          </div>

          {/* Checkbox cam kết pháp lý */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#DCD9D0] cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("confirmLegalWaiver")}
                className="w-4 h-4 rounded mt-0.5 accent-[#0B291E]"
              />
              <span className="text-[11px] text-[#0B291E] leading-relaxed">
                Tôi xác nhận hoàn toàn tự nguyện từ chối nhận di sản thừa kế, không bị ép buộc, và đồng ý để hệ thống kích hoạt cơ chế bàn giao cho Người thụ hưởng dự phòng theo Điều 620 BLDS.
              </span>
            </label>
            {errors.confirmLegalWaiver && (
              <p className="text-[11px] text-red-600 font-bold mt-1.5">{errors.confirmLegalWaiver.message}</p>
            )}
          </div>

          {refuseMutation.error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{refuseMutation.error.message}</span>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-[#E8DCC6]/60 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={refuseMutation.isPending}
              className="rounded-[18px] text-xs font-bold border-[#DCD9D0] text-[#14241C]"
            >
              Hủy Bỏ
            </Button>

            <Button
              type="submit"
              disabled={refuseMutation.isPending}
              className="rounded-[18px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Scale className="w-4 h-4" />
              <span>{refuseMutation.isPending ? "Đang Xử Lý..." : "Xác Nhận Từ Chối Thừa Kế"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
