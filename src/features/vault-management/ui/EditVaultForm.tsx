import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";

const NAME_MAX = 200;
const DESCRIPTION_MAX = 1000;

const schema = z.object({
  name: z.string().regex(/\S/, "Tên kho không được để trống.").max(NAME_MAX),
  description: z.string().max(DESCRIPTION_MAX),
});

/** Nhãn trường kèm dòng gợi ý và bộ đếm ký tự bên phải. */
function FieldHeader({
  htmlFor,
  label,
  hint,
  length,
  max,
}: {
  htmlFor: string;
  label: string;
  hint: string;
  length: number;
  max: number;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-semibold text-heritage-primary">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-heritage-muted">{hint}</p>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-heritage-muted" aria-hidden="true">
        {length}/{max}
      </span>
    </div>
  );
}

/** Chỉ sửa metadata. Etag luôn thuộc snapshot form, không lấy etag mới để ghi đè dữ liệu cũ. */
export function EditVaultForm({
  vault,
  className = "",
}: {
  vault: VaultResponse;
  className?: string;
}) {
  const [etag, setEtag] = useState(vault.etag);
  const client = useQueryClient();
  const action = usePrivateAction();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: vault.name, description: vault.description ?? "" },
  });
  const name = useWatch({ control: form.control, name: "name" });
  const description = useWatch({ control: form.control, name: "description" });
  const { errors, isDirty } = form.formState;
  const closed = vault.status === "CLOSED";

  return (
    <form
      noValidate
      className={`space-y-5 ${className}`.trim()}
      onSubmit={form.handleSubmit((values) =>
        action.execute(
          () => ownerVaultService.updateMine(vault.id, { ...values, etag }),
          (result) => {
            client.setQueryData(ownerVaultKeys.mine, result);
            void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
            setEtag(result.etag);
            form.reset({ name: result.name, description: result.description ?? "" });
          },
        ),
      )}
    >
      <fieldset disabled={action.pending || closed} className="space-y-5">
        <div className="space-y-2">
          <FieldHeader
            htmlFor="vault-name"
            label="Tên kho"
            hint="Tên giúp bạn nhận ra kho, chỉ bạn nhìn thấy."
            length={name.length}
            max={NAME_MAX}
          />
          <Input
            id="vault-name"
            maxLength={NAME_MAX}
            placeholder="Ví dụ: Kho của gia đình"
            className="h-11 rounded-xl border-[#BDB8A6] bg-white"
            {...form.register("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "vault-name-error" : undefined}
          />
          {errors.name && (
            <p id="vault-name-error" role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <FieldHeader
            htmlFor="vault-description"
            label="Mô tả kho"
            hint="Ghi chú ngắn về những gì kho lưu giữ (không bắt buộc)."
            length={description.length}
            max={DESCRIPTION_MAX}
          />
          <Textarea
            id="vault-description"
            rows={4}
            maxLength={DESCRIPTION_MAX}
            placeholder="Ví dụ: Giấy tờ nhà đất, tài khoản ngân hàng và lời nhắn cho các con."
            className="rounded-xl border-[#BDB8A6] bg-white"
            {...form.register("description")}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "vault-description-error" : undefined}
          />
          {errors.description && (
            <p id="vault-description-error" role="alert" className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-heritage-border pt-4">
          {action.succeeded && !isDirty && (
            <p
              role="status"
              className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#1F7A55]"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Đã lưu thông tin kho.
            </p>
          )}
          {closed && (
            <p className="mr-auto text-sm text-heritage-muted">Kho đã đóng, không sửa được.</p>
          )}
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={!isDirty}
            onClick={() => {
              action.reset();
              form.reset();
            }}
          >
            Hoàn tác
          </button>
          <button type="submit" className={buttonStyles.dark} disabled={!isDirty}>
            {action.pending ? "Đang lưu…" : "Lưu thông tin kho"}
          </button>
        </div>
      </fieldset>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </form>
  );
}
