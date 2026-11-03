import { APP_MESSAGES } from "@/shared/constants";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
} from "@/shared/ui";
import { History, Globe, Mail, Send, Smartphone, CheckCircle, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { usePingHistory } from "../model/useDms";

/**
 * @file DmsPingHistoryModal.tsx
 * @description Modal hiển thị nhật ký các lần gửi nhịp xung sinh tồn (Proof-of-Life Audit Trail).
 */

interface DmsPingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmsPingHistoryModal: React.FC<DmsPingHistoryModalProps> = ({ isOpen, onClose }) => {
  const { data: history, isLoading, isError, refetch } = usePingHistory(isOpen);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "WEB":
        return <Globe className="w-4 h-4 text-heritage-primary" />;
      case "EMAIL_LINK":
        return <Mail className="w-4 h-4 text-heritage-gold" />;
      case "TELEGRAM":
        return <Send className="w-4 h-4 text-[#0088cc]" />;
      case "MOBILE_APP":
        return <Smartphone className="w-4 h-4 text-heritage-success" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "WEB":
        return "Web Browser (Nút I'm Alive)";
      case "EMAIL_LINK":
        return "Link Xác Nhận Qua Email";
      case "TELEGRAM":
        return "Telegram Bot One-Click";
      case "MOBILE_APP":
        return "Ứng Dụng Di Động";
      default:
        return source;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-heritage-surface border border-heritage-border rounded-[24px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-heritage-neutral-bg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-heritage-sidebar flex items-center justify-center text-heritage-gold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-heritage-text">
                Nhật Ký Nhịp Sinh Tồn (Audit Trail)
              </DialogTitle>
              <DialogDescription className="text-xs text-heritage-muted">
                Lịch sử minh bạch các lần xác nhận sự hiện diện của chủ tài khoản
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {isError ? (
            <div role="alert">
              <p>{APP_MESSAGES.ERROR.LOAD_FAILED}</p>
              <Button onClick={() => void refetch()}>{APP_MESSAGES.UI.RETRY}</Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-heritage-canvas rounded-[14px] animate-pulse" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-10 bg-heritage-canvas/50 rounded-[16px]">
              <ShieldCheck className="w-10 h-10 text-heritage-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs text-heritage-muted">Chưa có lịch sử xác nhận nhịp sinh tồn</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-heritage-border rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-heritage-canvas border border-heritage-border flex items-center justify-center shrink-0 mt-0.5">
                      {getSourceIcon(item.source)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-heritage-text">
                          {getSourceLabel(item.source)}
                        </span>
                        <Badge className="bg-heritage-primary-light text-heritage-primary border border-[#A2C4AF] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-2.5 h-2.5 text-heritage-success" />
                          Thành công
                        </Badge>
                      </div>
                      <div className="text-[11px] text-heritage-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Thời gian: {formatDateTime(item.pingedAt)}</span>
                        {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-heritage-gold bg-heritage-gold-light border border-heritage-gold-border px-2.5 py-1 rounded-[8px] self-start sm:self-center">
                    ECDSA-OK
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-heritage-neutral-bg flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-[16px] border-heritage-border text-heritage-text hover:bg-heritage-canvas text-xs font-semibold px-6"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
