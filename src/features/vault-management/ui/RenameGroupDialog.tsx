import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { PackageResponse } from "@/entities/package/model/package.types";
import {
  createPackageSchema,
  type CreatePackageFormInput,
} from "@/entities/package/model/package.schema";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { ownerVaultService } from "../api/ownerVaultService";
import { invalidateGroupQueries } from "../model/groupQueries";

/** Đổi tên gói theo etag lúc đọc; 409 EDIT_CONFLICT báo lỗi, không tự ghi đè. */
export function RenameGroupDialog({
  group,
  onClose,
}: {
  group: PackageResponse;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePackageFormInput>({
    resolver: zodResolver(createPackageSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: group.name },
  });

  let submitLabel = "Lưu tên";
  if (action.pending) {
    submitLabel = "Đang lưu…";
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="bg-[#FBFAF5] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0A281E]">Đổi tên gói</DialogTitle>
        </DialogHeader>
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            const saved = await action.execute(
              () =>
                ownerVaultService.updatePackage(group.vaultId, group.id, {
                  name: values.name,
                  etag: group.etag,
                }),
              () => invalidateGroupQueries(client, group.vaultId),
            );
            if (saved) {
              onClose();
            }
          })}
        >
          <label className="block space-y-2 text-sm font-semibold text-[#0A281E]">
            Tên gói bàn giao
            <Input
              disabled={action.pending}
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              className="font-normal"
            />
          </label>
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className={buttonStyles.dark} disabled={action.pending}>
              {submitLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
