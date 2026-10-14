import React, { useState } from "react";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui";
import { Calendar, ShieldAlert, Zap, AlertCircle } from "lucide-react";

/**
 * @file HandoverScheduleModal.tsx
 * @description Hộp thoại dành cho Người Thực Thi (Executor) để:
 * 1. Ghi nhận ngày bàn giao chung đã thống nhất giữa các bên (SRS 3.11.0 - Luồng 4A)
 * 2. Thực thi nút bấm "Bắt đầu bàn giao" vào hoặc sau ngày đã hẹn để chốt cứng lựa chọn chuyển (Luồng 4C)
 */

interface HandoverScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScheduledDate?: string;
  onSaveSchedule: (scheduledDate: string) => void;
  onStartHandover?: () => void;
  isPending?: boolean;
}

export const HandoverScheduleModal: React.FC<HandoverScheduleModalProps> = ({
  isOpen,
  onClose,
  currentScheduledDate = "",
  onSaveSchedule,
  onStartHandover,
  isPending = false,
}) => {
  const [scheduledDate, setScheduledDate] = useState<string>(
    currentScheduledDate || new Date().toISOString().split("T")[0],
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) {
      setError("Vui lòng chọn ngày bàn giao đã thống nhất");
      return;
    }

    onSaveSchedule(scheduledDate);
    onClose();
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const canStartHandover = !!currentScheduledDate && currentScheduledDate <= todayStr;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#FAF9F5] border-[#DCD9D0] rounded-[24px] p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="w-12 h-12 rounded-[16px] bg-[#E5EDE8] flex items-center justify-center text-[#059669] mx-auto mb-1 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-bold text-center text-[#0B291E]">
            Ghi Ngày Bàn Giao Đã Thống Nhất
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-[#66786E]">
            Quy trình SRS 3.11.0 (Luồng 4A): Người thực thi ghi ngày chung theo giờ
            Asia/Ho_Chi_Minh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="p-3.5 rounded-[14px] bg-[#FBF7EE] border border-[#E8DCC6] space-y-1 text-xs text-[#78350F]">
            <span className="font-bold text-[#0B291E] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#B88E4C]" />
              Quy định điều phối của Executor:
            </span>
            <p className="text-[11px] text-[#A07839] leading-relaxed">
              Hệ thống sẽ thông báo ngày này tới toàn bộ Người thụ hưởng. Vào hoặc sau ngày đã ghi,
              bạn mới có quyền bấm "Bắt đầu bàn giao" để chốt khóa chuyển 1:1 và mở cửa sổ nhận tài
              sản.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#14241C]">
              Ngày Bàn Giao Chung (Asia/Ho_Chi_Minh) *
            </label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => {
                setScheduledDate(e.target.value);
                setError(null);
              }}
              className="bg-white h-11 text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[16px] text-xs font-bold w-full sm:w-auto"
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-5 w-full sm:w-auto"
            >
              Lưu Ngày Đã Thống Nhất
            </Button>
          </DialogFooter>
        </form>

        {/* Nút Bắt đầu bàn giao (Luồng 4C) */}
        {onStartHandover && currentScheduledDate && (
          <div className="pt-4 border-t border-[#E8E5DD] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#66786E]">Trạng thái kích hoạt:</span>
              <span
                className={`font-bold ${canStartHandover ? "text-[#059669]" : "text-[#B45309]"}`}
              >
                {canStartHandover ? "Đã đến ngày bàn giao" : "Chưa đến ngày đã hẹn"}
              </span>
            </div>

            <Button
              type="button"
              disabled={!canStartHandover || isPending}
              onClick={() => {
                onStartHandover();
                onClose();
              }}
              className="w-full min-h-[46px] rounded-[16px] bg-[#B88E4C] hover:bg-[#A07839] text-[#0B291E] hover:text-white font-bold text-xs gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Bắt Đầu Bàn Giao (Khóa Chuyển Nguyên Tử)</span>
            </Button>
            <p className="text-[10px] text-[#66786E] text-center">
              (Thao tác này sẽ chốt cứng mọi lựa chọn chuyển 1:1 và bắt đầu cửa sổ 7 ngày phản hồi)
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
