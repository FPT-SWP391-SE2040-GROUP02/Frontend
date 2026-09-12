import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  Button 
} from "@/shared/ui";
import { Sliders, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { DmsNotificationChannels } from "./DmsNotificationChannels";
import { useDmsStatus, useUpdateDmsConfig } from "../model/useDms";
import type { DmsHeartbeatConfig } from "../model/dms.types";

/**
 * @file DmsConfigModal.tsx
 * @description Modal cài đặt chu kỳ nhịp sinh tồn (DMS Settings), thời gian ân hạn và kênh thông báo.
 */

interface DmsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmsConfigModal: React.FC<DmsConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: dmsState } = useDmsStatus();
  const { mutate: updateConfig, isPending } = useUpdateDmsConfig();

  const [config, setConfig] = useState<DmsHeartbeatConfig>(() => {
    return (
      dmsState?.config || {
        checkIntervalDays: 30,
        gracePeriodDays: 14,
        reminderFrequencyDays: 3,
        notifyExecutorOnGracePeriod: true,
        channels: [
          { type: "EMAIL", enabled: true, targetValue: "nguyenvana@gmail.com" },
          { type: "TELEGRAM", enabled: true, targetValue: "@vana_legacy" },
          { type: "SMS", enabled: false, targetValue: "" },
          { type: "VOICE_CALL", enabled: false, targetValue: "" },
        ],
      }
    );
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(config, {
      onSuccess: () => {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1200);
      },
    });
  };

  const intervalOptions = [
    { label: "30 Ngày (Khuyên dùng)", value: 30 },
    { label: "60 Ngày", value: 60 },
    { label: "90 Ngày (Hàng quý)", value: 90 },
    { label: "180 Ngày (Nửa năm)", value: 180 },
  ];

  const gracePeriodOptions = [
    { label: "7 Ngày (Nhanh)", value: 7 },
    { label: "14 Ngày (Khuyên dùng)", value: 14 },
    { label: "30 Ngày (Mở rộng)", value: 30 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-[#E8E5DD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#14241C]">
                Cấu Hình Nhịp Sinh Tồn (DMS Settings)
              </DialogTitle>
              <DialogDescription className="text-xs text-[#66786E]">
                Điều chỉnh chu kỳ định kỳ, thời gian ân hạn và các kênh liên lạc khẩn cấp
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-4">
          {/* Section 1: Check Interval */}
          <div>
            <label className="block text-sm font-bold text-[#14241C] mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#B88E4C]" />
              1. Chu Kỳ Kiểm Tra Sinh Tồn (Ping Interval)
            </label>
            <p className="text-xs text-[#66786E] mb-3">
              Khoảng thời gian tối đa hệ thống chờ bạn xác nhận trước khi phát tín hiệu cảnh báo.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {intervalOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, checkIntervalDays: opt.value }))
                  }
                  className={`p-3 rounded-[14px] text-xs font-semibold border transition-all text-center ${
                    config.checkIntervalDays === opt.value
                      ? "bg-[#0B291E] text-white border-[#0B291E] shadow-sm"
                      : "bg-[#EFECE6] text-[#14241C] border-[#DCD9D0] hover:bg-[#FAF9F5]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Grace Period */}
          <div>
            <label className="block text-sm font-bold text-[#14241C] mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
              2. Thời Gian Ân Hạn (Grace Period)
            </label>
            <p className="text-xs text-[#66786E] mb-3">
              Thời gian đệm sau khi quá hạn để gửi thông báo khẩn cấp trước khi chính thức kích hoạt bàn giao di sản.
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {gracePeriodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, gracePeriodDays: opt.value }))
                  }
                  className={`p-3 rounded-[14px] text-xs font-semibold border transition-all text-center ${
                    config.gracePeriodDays === opt.value
                      ? "bg-[#B88E4C] text-white border-[#B88E4C] shadow-sm"
                      : "bg-[#EFECE6] text-[#14241C] border-[#DCD9D0] hover:bg-[#FAF9F5]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Notification Channels */}
          <div>
            <label className="block text-sm font-bold text-[#14241C] mb-2">
              3. Kênh Nhận Thông Báo Cảnh Báo
            </label>
            <DmsNotificationChannels
              channels={config.channels}
              onChange={(channels) => setConfig((prev) => ({ ...prev, channels }))}
            />
          </div>

          {/* Section 4: Executor Emergency Alert */}
          <div className="p-4 rounded-[16px] bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#92400E]">
                  Cảnh Báo Khẩn Cấp Người Giám Hộ (Digital Executor)
                </span>
                <input
                  type="checkbox"
                  checked={config.notifyExecutorOnGracePeriod}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      notifyExecutorOnGracePeriod: e.target.checked,
                    }))
                  }
                  className="rounded border-[#B45309] text-[#0B291E] focus:ring-[#B88E4C]"
                />
              </div>
              <p className="text-[11px] text-[#B45309] mt-1 leading-relaxed">
                Khi bước vào Thời gian ân hạn (Grace Period), hệ thống sẽ gửi cảnh báo tới Người giám hộ hợp pháp để họ liên hệ xác minh tình trạng thực tế của bạn.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-[#E5EDE8] border border-[#A2C4AF] rounded-[12px] text-xs text-[#0B291E] font-medium text-center">
              ✓ Đã lưu cấu hình thành công!
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-[#E8E5DD] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[16px] border-[#DCD9D0] text-[#14241C] hover:bg-[#EFECE6] text-xs font-semibold px-5"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-6 shadow-sm"
            >
              {isPending ? "Đang lưu..." : "Lưu Cấu Hình"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
