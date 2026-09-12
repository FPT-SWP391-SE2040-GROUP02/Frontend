import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  Badge,
  Button 
} from "@/shared/ui";
import { History, Globe, Mail, Send, Smartphone, CheckCircle, ShieldCheck } from "lucide-react";
import { usePingHistory } from "../model/useDms";

/**
 * @file DmsPingHistoryModal.tsx
 * @description Modal hiển thị nhật ký các lần gửi nhịp xung sinh tồn (Proof-of-Life Audit Trail).
 */

interface DmsPingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmsPingHistoryModal: React.FC<DmsPingHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: history, isLoading } = usePingHistory();

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "WEB":
        return <Globe className="w-4 h-4 text-[#0B291E]" />;
      case "EMAIL_LINK":
        return <Mail className="w-4 h-4 text-[#B88E4C]" />;
      case "TELEGRAM":
        return <Send className="w-4 h-4 text-[#0088cc]" />;
      case "MOBILE_APP":
        return <Smartphone className="w-4 h-4 text-[#059669]" />;
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
      <DialogContent className="max-w-2xl bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-[#E8E5DD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#14241C]">
                Nhật Ký Nhịp Sinh Tồn (Audit Trail)
              </DialogTitle>
              <DialogDescription className="text-xs text-[#66786E]">
                Lịch sử minh bạch các lần xác nhận sự hiện diện của chủ tài khoản
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#EFECE6] rounded-[14px] animate-pulse" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-10 bg-[#EFECE6]/50 rounded-[16px]">
              <ShieldCheck className="w-10 h-10 text-[#66786E] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#66786E]">Chưa có lịch sử xác nhận nhịp sinh tồn</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-[#DCD9D0] rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-[#EFECE6] border border-[#DCD9D0] flex items-center justify-center shrink-0 mt-0.5">
                      {getSourceIcon(item.source)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14241C]">
                          {getSourceLabel(item.source)}
                        </span>
                        <Badge className="bg-[#E5EDE8] text-[#0B291E] border border-[#A2C4AF] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-2.5 h-2.5 text-[#059669]" />
                          Thành công
                        </Badge>
                      </div>
                      <div className="text-[11px] text-[#66786E] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Thời gian: {new Date(item.pingedAt).toLocaleString("vi-VN")}</span>
                        {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#B88E4C] bg-[#FBF7EE] border border-[#E8DCC6] px-2.5 py-1 rounded-[8px] self-start sm:self-center">
                    ECDSA-OK
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#E8E5DD] flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-[16px] border-[#DCD9D0] text-[#14241C] hover:bg-[#EFECE6] text-xs font-semibold px-6"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
