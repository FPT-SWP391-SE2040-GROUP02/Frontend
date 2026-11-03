import React from "react";
import { Mail, MessageSquare, PhoneCall, Send } from "lucide-react";
import { Input } from "@/shared/ui";
import type { NotificationChannelConfig } from "../model/dms.types";

/**
 * @file DmsNotificationChannels.tsx
 * @description Danh sách các kênh nhận cảnh báo nhịp sinh tồn (Email, Telegram, SMS, Voice Call).
 */

interface DmsNotificationChannelsProps {
  channels: NotificationChannelConfig[];
  onChange: (channels: NotificationChannelConfig[]) => void;
  onBlur?: () => void;
}

export const DmsNotificationChannels: React.FC<DmsNotificationChannelsProps> = ({
  channels,
  onChange,
  onBlur,
}) => {
  const getChannelIcon = (type: string) => {
    switch (type) {
      case "EMAIL":
        return <Mail className="w-4 h-4 text-heritage-primary" />;
      case "TELEGRAM":
        return <Send className="w-4 h-4 text-[#0088cc]" />;
      case "SMS":
        return <MessageSquare className="w-4 h-4 text-heritage-success" />;
      case "VOICE_CALL":
        return <PhoneCall className="w-4 h-4 text-heritage-gold" />;
      default:
        return null;
    }
  };

  const getChannelTitle = (type: string) => {
    switch (type) {
      case "EMAIL":
        return "Email Trực Tiếp";
      case "TELEGRAM":
        return "Telegram Bot Cảnh Báo";
      case "SMS":
        return "Tin Nhắn SMS Khẩn Cấp";
      case "VOICE_CALL":
        return "Cuộc Gọi Tự Động (AI Voice)";
      default:
        return type;
    }
  };

  const handleToggle = (index: number) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onChange(updated);
  };

  const handleValueChange = (index: number, value: string) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], targetValue: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3" onBlur={onBlur}>
      {channels.map((channel, idx) => (
        <div
          key={channel.type}
          className={`p-4 rounded-[16px] border transition-all ${
            channel.enabled
              ? "bg-heritage-surface border-heritage-gold/40 shadow-[0_2px_8px_rgba(184,142,76,0.06)]"
              : "bg-heritage-canvas/40 border-heritage-border opacity-75"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-heritage-canvas border border-heritage-border flex items-center justify-center">
                {getChannelIcon(channel.type)}
              </div>
              <span className="text-sm font-semibold text-heritage-text">
                {getChannelTitle(channel.type)}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                aria-label={getChannelTitle(channel.type)}
                checked={channel.enabled}
                onChange={() => handleToggle(idx)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-heritage-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-heritage-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-heritage-sidebar"></div>
            </label>
          </div>

          {channel.enabled && (
            <div className="mt-3">
              <Input
                type="text"
                aria-label={getChannelTitle(channel.type) + " - địa chỉ nhận"}
                value={channel.targetValue}
                onChange={(e) => handleValueChange(idx, e.target.value)}
                placeholder={
                  channel.type === "EMAIL"
                    ? "name@example.com"
                    : channel.type === "TELEGRAM"
                      ? "@telegram_username hoặc chat_id"
                      : "+84 988 123 456"
                }
                className="h-10 text-xs bg-white border-heritage-border focus:border-heritage-gold rounded-[10px]"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
