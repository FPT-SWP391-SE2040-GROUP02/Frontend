import { useId, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { CustomCheckbox } from "@/shared/ui/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { systemConfigService } from "../api/systemConfigService";
import {
  SECRET_PLACEHOLDER,
  SLOT_LABELS,
  SYSTEM_CONFIG_SAVED,
  SYSTEM_CONFIG_SERVICES,
  buildConfigFormSchema,
  type ConfigFieldSpec,
} from "../model/systemConfig.content";
import type {
  ConfigSlotName,
  SystemConfigEntry,
  TestSystemConfigResponse,
} from "../model/systemConfig.schema";
import { useAdminAction } from "../model/useAdminAction";
import { systemConfigKeys } from "../model/useSystemConfig";

type ConfigFormValues = Record<string, string | boolean>;

interface SystemConfigDialogProps {
  service: SystemConfigEntry;
  slot: ConfigSlotName;
  onClose: () => void;
  /** Gọi sau khi Backend xác nhận đã lưu, trước khi đóng hộp thoại. */
  onSaved: (message: string) => void;
}

/** Giá trị trong form → body gửi đi: trường thường và trường khóa tách riêng, đã bỏ khoảng trắng hai đầu. */
function splitValues(fields: ConfigFieldSpec[], values: ConfigFormValues) {
  const settings: Record<string, string> = {};
  const secrets: Record<string, string> = {};
  for (const field of fields) {
    const raw = values[field.name];
    const text = typeof raw === "string" ? raw.trim() : "";
    if (field.kind === "secret") secrets[field.name] = text;
    else settings[field.name] = text;
  }
  return { settings, secrets };
}

function testResultText(result: TestSystemConfigResponse): string {
  if (result.ok) return `Kết nối được (${result.latencyMs} ms).`;
  return `Không kết nối được (mã lỗi ${result.errorCode ?? "không rõ"}).`;
}

/**
 * Hộp thoại sửa một ô cấu hình của dịch vụ ngoài. Ô khóa chỉ ghi: không bao giờ điền sẵn giá trị đã lưu, để trống
 * nghĩa là giữ khóa cũ. Có thể thử kết nối bằng giá trị đang nhập trước khi lưu. Lưu xong mới làm mới danh sách.
 */
export function SystemConfigDialog({ service, slot, onClose, onSaved }: SystemConfigDialogProps) {
  const content = SYSTEM_CONFIG_SERVICES[service.serviceKey];
  const slotData = service.slots.find((item) => item.slot === slot);
  const idBase = useId();
  const client = useQueryClient();
  const saver = useAdminAction();
  const tester = useAdminAction();
  const [testResult, setTestResult] = useState<TestSystemConfigResponse | null>(null);

  const schema = useMemo(() => buildConfigFormSchema(content.fields), [content]);
  const resolver: Resolver<ConfigFormValues> = async (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values, errors: {} };
    const errors: FieldErrors<ConfigFormValues> = {};
    for (const issue of result.error.issues) {
      const name = String(issue.path[0]);
      if (!(name in errors)) errors[name] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors };
  };

  const defaults: ConfigFormValues = {
    reason: "",
    enabled: slot === "PRIMARY" || slotData?.enabled === true,
  };
  for (const field of content.fields) {
    defaults[field.name] = field.kind === "secret" ? "" : (slotData?.settings[field.name] ?? "");
  }
  const form = useForm<ConfigFormValues>({
    resolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: defaults,
  });

  if (!slotData) return null;
  const busy = saver.pending || tester.pending;

  const onSubmit = form.handleSubmit((values) => {
    const { settings, secrets } = splitValues(content.fields, values);
    void saver.execute(
      () =>
        systemConfigService.update(service.serviceKey, slot, {
          settings,
          secrets,
          enabled: values.enabled === true,
          reason: typeof values.reason === "string" ? values.reason : "",
          version: slotData.version,
        }),
      () => {
        void client.invalidateQueries({ queryKey: systemConfigKeys.all });
        onSaved(SYSTEM_CONFIG_SAVED);
        onClose();
      },
    );
  });

  async function onTest() {
    setTestResult(null);
    const names = content.fields
      .filter((field) => field.kind !== "secret")
      .map((field) => field.name);
    const valid = await form.trigger(names);
    if (!valid) return;
    const { settings, secrets } = splitValues(content.fields, form.getValues());
    void tester.execute(
      () => systemConfigService.test(service.serviceKey, slot, { settings, secrets }),
      (result) => setTestResult(result),
    );
  }

  const showEnabled = slot === "FALLBACK";
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {SLOT_LABELS[slot]} · {content.title}
          </DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          {showEnabled && (
            <CustomCheckbox
              className="min-h-11 w-full items-center!"
              label="Bật dịch vụ dự phòng"
              {...form.register("enabled")}
            />
          )}
          {content.fields.map((field) => {
            const fieldId = `${idBase}-${field.name}`;
            const error = form.formState.errors[field.name]?.message;
            const secretStatus = slotData.secrets.find((item) => item.name === field.name);
            return (
              <div key={field.name} className="text-sm">
                <label htmlFor={fieldId} className="block font-medium">
                  {field.label}
                </label>
                <Input
                  id={fieldId}
                  autoComplete={field.kind === "secret" ? "new-password" : "off"}
                  type={field.kind === "secret" ? "password" : "text"}
                  inputMode={field.kind === "number" ? "numeric" : undefined}
                  placeholder={field.kind === "secret" ? SECRET_PLACEHOLDER : undefined}
                  aria-invalid={Boolean(error)}
                  className="mt-1"
                  {...form.register(field.name)}
                />
                {field.kind === "secret" && (
                  <p className="mt-1 text-xs text-heritage-muted">
                    {secretStatus?.hasValue
                      ? secretStatus.last4
                        ? `•••• ${secretStatus.last4}`
                        : "Đã có khóa (không hiện)."
                      : "Chưa có khóa."}
                  </p>
                )}
                {field.hint && <p className="mt-1 text-xs text-heritage-muted">{field.hint}</p>}
                {error && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {String(error)}
                  </p>
                )}
              </div>
            );
          })}
          <div className="text-sm">
            <label htmlFor={`${idBase}-reason`} className="block font-medium">
              Lý do thay đổi
            </label>
            <Textarea
              id={`${idBase}-reason`}
              maxLength={500}
              aria-invalid={Boolean(form.formState.errors.reason)}
              className="mt-1 min-h-20"
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {String(form.formState.errors.reason.message)}
              </p>
            )}
          </div>
          {testResult && (
            <p
              role="status"
              className={
                testResult.ok ? "text-sm text-heritage-primary" : "text-sm text-destructive"
              }
            >
              {testResultText(testResult)}
            </p>
          )}
          {tester.error && !tester.pending && (
            <p role="alert" className="text-sm text-destructive">
              {tester.error}
            </p>
          )}
          {saver.error && !saver.pending && (
            <p role="alert" className="text-sm text-destructive">
              {saver.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Hủy
            </Button>
            <Button type="button" variant="outline" onClick={() => void onTest()} disabled={busy}>
              Thử kết nối bằng giá trị đang nhập
            </Button>
            <Button type="submit" disabled={busy}>
              {saver.pending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
