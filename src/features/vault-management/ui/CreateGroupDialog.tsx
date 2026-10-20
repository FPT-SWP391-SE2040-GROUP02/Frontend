import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  createPackageSchema,
  type CreatePackageFormInput,
} from "@/entities/package/model/package.schema";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
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
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";

/** Tạo Nhóm (container) rỗng trong kho của Chủ kho; không tự kích hoạt kế hoạch. */
export function CreateGroupDialog({ vaultId, onClose }: { vaultId: string; onClose: () => void }) {
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
    defaultValues: { name: "", description: "" },
  });
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo nhóm</DialogTitle>
          <DialogDescription>
            Nhóm gom các mục có cùng người nhận. Tạo nhóm trước, rồi thêm mục và gán người nhận.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit(async (request) => {
            const saved = await action.execute(
              () => ownerVaultService.createPackage(vaultId, request),
              () => {
                void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
                void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
              },
            );
            if (saved) {
              onClose();
            }
          })}
        >
          <fieldset disabled={action.pending} className="space-y-4">
            <label className="block space-y-2 text-sm">
              Tên nhóm
              <Input
                placeholder="Ví dụ: Giấy tờ gia đình"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
            </label>
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
            <label className="block space-y-2 text-sm">
              Mô tả (không bắt buộc)
              <Textarea {...register("description")} aria-invalid={Boolean(errors.description)} />
            </label>
            {errors.description && (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </fieldset>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={action.pending}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
              disabled={action.pending}
            >
              Tạo nhóm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
