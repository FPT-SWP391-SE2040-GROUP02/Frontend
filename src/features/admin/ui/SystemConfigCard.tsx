import { buttonStyles, Chip, formatDateTime, InfoRow, Panel } from "@/shared/ui/heritageKit";
import {
  SLOT_LABELS,
  SOURCE_LABELS,
  SYSTEM_CONFIG_SERVICES,
  statusChip,
} from "../model/systemConfig.content";
import type {
  ConfigSlotName,
  SystemConfigEntry,
  SystemConfigSlot,
} from "../model/systemConfig.schema";

interface SystemConfigCardProps {
  service: SystemConfigEntry;
  onEdit: (slot: ConfigSlotName) => void;
  onReset: (slot: ConfigSlotName) => void;
}

/** Khóa chỉ hiện dạng che: 4 ký tự cuối khi Backend cho phép, không thì chỉ báo đã có hay chưa. */
function secretText(secret: SystemConfigSlot["secrets"][number] | undefined): string {
  if (!secret?.hasValue) return "Chưa có khóa";
  if (secret.last4) return `•••• ${secret.last4}`;
  return "Đã có khóa";
}

function lastCallText(status: SystemConfigEntry["status"]): string {
  if (!status.lastAt) return "Chưa có lần gọi nào kể từ lúc máy chủ khởi động.";
  if (status.lastOutcome === "FAILED") {
    return `Lần gọi gần nhất: ${formatDateTime(status.lastAt)}, lỗi ${status.lastErrorCode ?? "không rõ"}.`;
  }
  return `Lần gọi gần nhất: ${formatDateTime(status.lastAt)}, thành công.`;
}

/** Thẻ một dịch vụ ngoài: nhãn trạng thái, giá trị đang dùng của từng ô (khóa luôn che) và các nút sửa. */
export function SystemConfigCard({ service, onEdit, onReset }: SystemConfigCardProps) {
  const content = SYSTEM_CONFIG_SERVICES[service.serviceKey];
  const chip = statusChip(service);
  const headingId = `system-config-${service.serviceKey}`;
  return (
    <Panel
      title={content.title}
      labelledBy={headingId}
      action={<Chip tone={chip.tone}>{chip.text}</Chip>}
    >
      <p className="text-sm text-heritage-muted">{content.description}</p>
      <div className="mt-4 space-y-6">
        {service.slots.map((slot) => {
          const primary = slot.slot === "PRIMARY";
          return (
            <section key={slot.slot} aria-label={SLOT_LABELS[slot.slot]} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-semibold text-heritage-primary">
                  {SLOT_LABELS[slot.slot]}
                </h3>
                {!primary && (
                  <Chip tone={slot.enabled ? "success" : "neutral"}>
                    {slot.enabled ? "Đang bật" : "Đang tắt"}
                  </Chip>
                )}
              </div>
              <dl>
                {content.fields.map((field) => (
                  <InfoRow key={field.name} label={field.label}>
                    {field.kind === "secret"
                      ? secretText(slot.secrets.find((item) => item.name === field.name))
                      : (slot.settings[field.name] ?? "")}
                  </InfoRow>
                ))}
                <InfoRow label="Nguồn">{SOURCE_LABELS[slot.source]}</InfoRow>
                {slot.updatedAt && (
                  <InfoRow label="Sửa lần cuối">
                    {formatDateTime(slot.updatedAt)}
                    {slot.updatedBy ? `, ${slot.updatedBy}` : ""}
                  </InfoRow>
                )}
              </dl>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={primary ? buttonStyles.gold : buttonStyles.outline}
                  onClick={() => onEdit(slot.slot)}
                >
                  {primary ? "Sửa cấu hình chính" : "Sửa dịch vụ dự phòng"}
                </button>
                {slot.source === "DATABASE" && (
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    onClick={() => onReset(slot.slot)}
                  >
                    {primary ? "Khôi phục mặc định" : "Xóa dịch vụ dự phòng"}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-heritage-muted">{lastCallText(service.status)}</p>
    </Panel>
  );
}
