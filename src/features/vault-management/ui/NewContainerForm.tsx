import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  createPackageSchema,
  type CreatePackageFormInput,
} from "@/entities/package/model/package.schema";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";
/** Tạo container rỗng đúng scope kho, không tự kích hoạt kế hoạch. */
export function NewContainerForm({ vaultId }: { vaultId: string }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePackageFormInput>({
    resolver: zodResolver(createPackageSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: "", description: "" },
  });
  return (
    <details className="rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <summary className="min-h-11 cursor-pointer font-semibold">Tạo gói bàn giao</summary>
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(async (request) => {
          const saved = await action.execute(
            () => ownerVaultService.createPackage(vaultId, request),
            () => {
              void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
            },
          );
          if (saved) reset();
        })}
      >
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="block space-y-2 text-sm">
            Tên gói
            <Input {...register("name")} aria-invalid={Boolean(errors.name)} />
          </label>
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
          <label className="block space-y-2 text-sm">
            Mô tả
            <Textarea {...register("description")} aria-invalid={Boolean(errors.description)} />
          </label>
          {errors.description && (
            <p role="alert" className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
          <Button type="submit" className="min-h-11">
            {action.pending ? "Đang tạo…" : "Tạo gói"}
          </Button>
        </fieldset>
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        {action.succeeded && (
          <p role="status" className="text-sm text-heritage-primary">
            Đã tạo gói bàn giao.
          </p>
        )}
      </form>
    </details>
  );
}
