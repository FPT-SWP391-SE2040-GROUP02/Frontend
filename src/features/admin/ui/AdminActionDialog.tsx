import { useId } from "react";
import { Controller, useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { ROLE_LABELS, reviewDateError } from "../model/admin.content";
import type { AdminUserRole } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";
import { useAdminUserOptions } from "../model/useAdmin";

export type AdminFieldSpec = { name: string; label: string; optional?: boolean; hint?: string } & (
  | { kind: "textarea"; maxLength: number }
  | { kind: "text"; maxLength?: number }
  | { kind: "datetime" }
  | { kind: "select"; options: { value: string; label: string }[] }
  | { kind: "user"; roles: AdminUserRole[] }
);

type AdminFormValues = Record<string, string | boolean>;

interface AdminActionDialogProps {
  title: string;
  description: string;
  submitLabel: string;
  fields: AdminFieldSpec[];
  defaultValues: Record<string, string>;
  /** Có nhãn thì bắt buộc tích xác nhận trước khi gửi (thao tác khó đảo ngược). */
  confirmLabel?: string;
  submit: (values: Record<string, string>) => Promise<unknown>;
  onClose: () => void;
  /** Gọi sau khi Backend xác nhận thành công, trước khi đóng hộp thoại; nhận kết quả của `submit`. */
  onDone: (result: unknown) => void;
}

const UUID = z.string().uuid("Chọn một giá trị hợp lệ.");

/** Dựng luật kiểm tra từ danh sách trường; Backend vẫn là nơi quyết định cuối cùng. */
function buildSchema(fields: AdminFieldSpec[], needsConfirm: boolean) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    if (field.kind === "textarea" || field.kind === "text") {
      const base = z.string().trim();
      const bounded = field.maxLength
        ? base.max(field.maxLength, `Tối đa ${field.maxLength} ký tự.`)
        : base;
      shape[field.name] = field.optional ? bounded : bounded.min(1, "Trường này là bắt buộc.");
    } else if (field.kind === "datetime") {
      shape[field.name] = z.string().superRefine((value, context) => {
        if (field.optional && !value) return;
        const message = reviewDateError(value);
        if (message) context.addIssue({ code: "custom", message });
      });
    } else if (field.kind === "user") {
      shape[field.name] = UUID;
    } else {
      const allowed = field.options.map((option) => option.value);
      shape[field.name] = z
        .string()
        .refine((value) => allowed.includes(value), "Chọn một giá trị hợp lệ.");
    }
  }
  if (needsConfirm) {
    shape.confirm = z.boolean().refine(Boolean, "Cần xác nhận trước khi tiếp tục.");
  }
  return z.object(shape);
}

interface UserSelectProps {
  roles: AdminUserRole[];
  id: string;
  invalid: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/** Chọn người đang hoạt động theo vai trò (người phụ trách sự cố, người xét duyệt). */
function UserSelect({ roles, id, invalid, value, onChange, onBlur }: UserSelectProps) {
  const verifiers = useAdminUserOptions("VERIFIER", roles.includes("VERIFIER"));
  const admins = useAdminUserOptions("ADMIN", roles.includes("ADMIN"));
  const queries = [
    ...(roles.includes("VERIFIER") ? [verifiers] : []),
    ...(roles.includes("ADMIN") ? [admins] : []),
  ];
  if (queries.some((query) => query.isPending))
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải danh sách người…
      </p>
    );
  const failed = queries.find((query) => query.isError);
  if (failed)
    return (
      <div role="alert" className="space-y-2 text-sm text-destructive">
        <p>Không tải được danh sách người. Thử lại trước khi tiếp tục.</p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => void failed.refetch()}
        >
          Tải lại danh sách
        </Button>
      </div>
    );
  const people = queries.flatMap((query) => query.data?.items ?? []);
  return (
    <select
      id={id}
      value={value}
      aria-invalid={invalid}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 min-h-11 w-full rounded-lg border border-heritage-border bg-white px-3 text-sm"
    >
      <option value="">— Chọn người —</option>
      {people.map((person) => (
        <option key={person.id} value={person.id}>
          {person.fullName || person.email} · {ROLE_LABELS[person.role]} · {person.email}
        </option>
      ))}
    </select>
  );
}

/**
 * Hộp thoại dùng chung cho thao tác ghi của Admin: lý do/ghi chú bắt buộc, kiểm tra khi rời ô,
 * khóa nút khi đang gửi, không optimistic. Lỗi hiện theo `code` và `reason` của Backend.
 */
export function AdminActionDialog({
  title,
  description,
  submitLabel,
  fields,
  defaultValues,
  confirmLabel,
  submit,
  onClose,
  onDone,
}: AdminActionDialogProps) {
  const action = useAdminAction();
  const idBase = useId();
  const schema = buildSchema(fields, Boolean(confirmLabel));
  const resolver: Resolver<AdminFormValues> = async (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values, errors: {} };
    const errors: FieldErrors<AdminFormValues> = {};
    for (const issue of result.error.issues) {
      const name = String(issue.path[0]);
      if (!(name in errors)) errors[name] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors };
  };
  const form = useForm<AdminFormValues>({
    resolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { ...defaultValues, ...(confirmLabel ? { confirm: false } : {}) },
  });
  const confirmed = useWatch({ control: form.control, name: "confirm" });
  const onSubmit = form.handleSubmit((values) => {
    const plain: Record<string, string> = {};
    for (const field of fields) {
      const raw = values[field.name];
      plain[field.name] = typeof raw === "string" ? raw.trim() : "";
    }
    void action.execute(
      () => submit(plain),
      (result) => {
        onDone(result);
        onClose();
      },
    );
  });
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          {fields.map((field) => {
            const fieldId = `${idBase}-${field.name}`;
            const error = form.formState.errors[field.name]?.message;
            return (
              <div key={field.name} className="text-sm">
                <label htmlFor={fieldId} className="block font-medium">
                  {field.label}
                  {field.optional ? " (không bắt buộc)" : ""}
                </label>
                {field.kind === "textarea" && (
                  <Textarea
                    id={fieldId}
                    {...form.register(field.name)}
                    maxLength={field.maxLength}
                    aria-invalid={Boolean(error)}
                    className="mt-1 min-h-24"
                  />
                )}
                {field.kind === "text" && (
                  <Input
                    id={fieldId}
                    autoComplete="off"
                    {...form.register(field.name)}
                    maxLength={field.maxLength}
                    aria-invalid={Boolean(error)}
                    className="mt-1"
                  />
                )}
                {field.kind === "datetime" && (
                  <Input
                    id={fieldId}
                    type="datetime-local"
                    {...form.register(field.name)}
                    aria-invalid={Boolean(error)}
                    className="mt-1"
                  />
                )}
                {field.kind === "select" && (
                  // Không dùng <select> native: popup của nó vẽ trống chữ khi nằm trong hộp thoại.
                  <Controller
                    control={form.control}
                    name={field.name}
                    render={({ field: control }) => (
                      <Select
                        items={field.options}
                        value={String(control.value ?? "")}
                        onValueChange={(value) => control.onChange(value ?? "")}
                      >
                        <SelectTrigger
                          id={fieldId}
                          aria-invalid={Boolean(error)}
                          onBlur={control.onBlur}
                          className="mt-1 min-h-11 w-full rounded-lg border-heritage-border bg-white px-3"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {field.kind === "user" && (
                  <Controller
                    control={form.control}
                    name={field.name}
                    render={({ field: control }) => (
                      <UserSelect
                        roles={field.roles}
                        id={fieldId}
                        invalid={Boolean(error)}
                        value={String(control.value ?? "")}
                        onChange={control.onChange}
                        onBlur={control.onBlur}
                      />
                    )}
                  />
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
          {confirmLabel && (
            <CustomCheckbox
              className="min-h-11 w-full items-center!"
              label={confirmLabel}
              {...form.register("confirm")}
            />
          )}
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={action.pending || (Boolean(confirmLabel) && !confirmed)}
            >
              {action.pending ? "Đang ghi…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
