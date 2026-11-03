import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui/skeleton";
import { Notice } from "@/shared/ui/heritageKit";
import { systemConfigService } from "../api/systemConfigService";
import {
  SLOT_LABELS,
  SYSTEM_CONFIG_NOTICE,
  SYSTEM_CONFIG_RESET_DONE,
  SYSTEM_CONFIG_SERVICES,
} from "../model/systemConfig.content";
import type { ConfigSlotName } from "../model/systemConfig.schema";
import { systemConfigKeys, useSystemConfig } from "../model/useSystemConfig";
import { AdminActionDialog } from "./AdminActionDialog";
import { AdminErrorMessage } from "./AdminStateMessage";
import { SystemConfigCard } from "./SystemConfigCard";
import { SystemConfigDialog } from "./SystemConfigDialog";

type PendingDialog =
  | { kind: "edit"; serviceKey: string; slot: ConfigSlotName }
  | { kind: "reset"; serviceKey: string; slot: ConfigSlotName }
  | null;

/**
 * Cấu hình dịch vụ ngoài (model, khóa, dịch vụ dự phòng) để Admin sửa ngay khi một dịch vụ gặp sự cố mà không phải
 * sửa code hay deploy lại. Dữ liệu chỉ từ API thật; khóa API không bao giờ được hiện lại.
 */
export function AdminSystemConfig() {
  const query = useSystemConfig();
  const client = useQueryClient();
  const [dialog, setDialog] = useState<PendingDialog>(null);
  const [done, setDone] = useState("");

  const services = (query.data?.services ?? []).filter((service) =>
    Object.hasOwn(SYSTEM_CONFIG_SERVICES, service.serviceKey),
  );
  const target = dialog
    ? services.find((service) => service.serviceKey === dialog.serviceKey)
    : undefined;

  return (
    <div className="mt-6 space-y-6">
      <Notice tone="warning">{SYSTEM_CONFIG_NOTICE}</Notice>
      {done && (
        <Notice tone="success" role="status">
          {done}
        </Notice>
      )}
      {query.isPending && <Skeleton className="h-64 rounded-2xl" />}
      {query.isError && (
        <AdminErrorMessage
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}
      {query.isSuccess && services.length === 0 && (
        <p className="text-sm text-heritage-muted">Chưa có dịch vụ nào để cấu hình.</p>
      )}
      {services.map((service) => (
        <SystemConfigCard
          key={service.serviceKey}
          service={service}
          onEdit={(slot) => {
            setDone("");
            setDialog({ kind: "edit", serviceKey: service.serviceKey, slot });
          }}
          onReset={(slot) => {
            setDone("");
            setDialog({ kind: "reset", serviceKey: service.serviceKey, slot });
          }}
        />
      ))}

      {dialog?.kind === "edit" && target && (
        <SystemConfigDialog
          service={target}
          slot={dialog.slot}
          onClose={() => setDialog(null)}
          onSaved={setDone}
        />
      )}
      {dialog?.kind === "reset" && target && (
        <AdminActionDialog
          title={
            dialog.slot === "PRIMARY" ? "Khôi phục cấu hình mặc định?" : "Xóa dịch vụ dự phòng?"
          }
          description={
            dialog.slot === "PRIMARY"
              ? `Cấu hình đã lưu của ${SYSTEM_CONFIG_SERVICES[target.serviceKey].title} sẽ bị xóa và hệ thống dùng lại cấu hình mặc định của máy chủ.`
              : `Cấu hình dự phòng đã lưu của ${SYSTEM_CONFIG_SERVICES[target.serviceKey].title} sẽ bị xóa. Khi cấu hình chính gặp sự cố, hệ thống sẽ không còn chuyển sang dịch vụ khác.`
          }
          submitLabel={dialog.slot === "PRIMARY" ? "Khôi phục mặc định" : "Xóa dịch vụ dự phòng"}
          fields={[{ name: "reason", label: "Lý do", kind: "textarea", maxLength: 500 }]}
          defaultValues={{ reason: "" }}
          submit={(values) =>
            systemConfigService.reset(dialog.serviceKey, dialog.slot, { reason: values.reason })
          }
          onClose={() => setDialog(null)}
          onDone={() => {
            void client.invalidateQueries({ queryKey: systemConfigKeys.all });
            setDone(
              dialog.slot === "PRIMARY"
                ? SYSTEM_CONFIG_RESET_DONE
                : `Đã xóa cấu hình ${SLOT_LABELS[dialog.slot].toLowerCase()}.`,
            );
          }}
        />
      )}
    </div>
  );
}
