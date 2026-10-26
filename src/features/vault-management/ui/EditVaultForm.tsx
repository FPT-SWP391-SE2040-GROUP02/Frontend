import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";

const schema = z.object({
  name: z.string().regex(/\S/, "Tên kho không được để trống.").max(200),
  description: z.string().max(1000),
});

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

  return (
    <form
      noValidate
      className={`space-y-4 ${className}`.trim()}
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
      <fieldset disabled={action.pending || vault.status === "CLOSED"} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          Tên kho
          <Input {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Mô tả kho
          <Textarea
            {...form.register("description")}
            aria-invalid={Boolean(form.formState.errors.description)}
          />
        </label>
        {Object.entries(form.formState.errors).map(([key, error]) => (
          <p key={key} role="alert" className="text-sm text-destructive">
            {error?.message}
          </p>
        ))}
        <Button type="submit" className="min-h-11">
          {action.pending ? "Đang lưu…" : "Lưu thông tin kho"}
        </Button>
      </fieldset>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && (
        <p role="status" className="text-sm font-medium text-heritage-primary">
          Đã lưu thông tin kho.
        </p>
      )}
    </form>
  );
}
