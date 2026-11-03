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
      <DialogContent className="max-w-md bg-heritage-surface border-heritage-border rounded-[24px] p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="w-12 h-12 rounded-[16px] bg-heritage-primary-light flex items-center justify-center text-heritage-success mx-auto mb-1 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-bold text-center text-heritage-primary">
            Ghi Ngày Bàn Giao Đã Thống Nhất
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-heritage-muted">
            Quy trình SRS 3.11.0 (Luồng 4A): Người thực thi ghi ngày chung theo giờ
            Asia/Ho_Chi_Minh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="p-3.5 rounded-[14px] bg-heritage-gold-light border border-heritage-gold-border space-y-1 text-xs text-[#78350F]">
            <span className="font-bold text-heritage-primary flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-heritage-gold" />
              Quy định điều phối của Executor:
            </span>
            <p className="text-[11px] text-heritage-gold-hover leading-relaxed">
              Hệ thống sẽ thông báo ngày này tới toàn bộ Người thụ hưởng. Vào hoặc sau ngày đã ghi,
              bạn mới có quyền bấm "Bắt đầu bàn giao" để chốt khóa chuyển 1:1 và mở cửa sổ nhận tài
              sản.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-[12px] bg-heritage-danger-bg border border-heritage-danger/30 text-xs text-heritage-danger font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-heritage-text">
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
              className="rounded-[16px] bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-white text-xs font-bold px-5 w-full sm:w-auto"
            >
              Lưu Ngày Đã Thống Nhất
            </Button>
          </DialogFooter>
        </form>

        {/* Nút Bắt đầu bàn giao (Luồng 4C) */}
        {onStartHandover && currentScheduledDate && (
          <div className="pt-4 border-t border-heritage-neutral-bg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-heritage-muted">Trạng thái kích hoạt:</span>
              <span
                className={`font-bold ${canStartHandover ? "text-heritage-success" : "text-heritage-warning"}`}
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
              className="w-full min-h-[46px] rounded-[16px] bg-heritage-gold hover:bg-heritage-gold-hover text-heritage-primary hover:text-white font-bold text-xs gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Bắt Đầu Bàn Giao (Khóa Chuyển Nguyên Tử)</span>
            </Button>
            <p className="text-[10px] text-heritage-muted text-center">
              (Thao tác này sẽ chốt cứng mọi lựa chọn chuyển 1:1 và bắt đầu cửa sổ 7 ngày phản hồi)
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
