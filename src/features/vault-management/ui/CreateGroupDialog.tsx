import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { PackageResponse } from "@/entities/package/model/package.types";
import {
  createPackageSchema,
  type CreatePackageFormInput,
} from "@/entities/package/model/package.schema";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { ownerVaultService } from "../api/ownerVaultService";
import {
  buildAssetPickerItems,
  buildBeneficiaryPickerItems,
  type GroupAssetOption,
  type GroupBeneficiaryOption,
} from "../model/groupMembers";
import { invalidateGroupQueries } from "../model/groupQueries";
import { MemberPicker } from "./MemberPicker";

export interface CreateGroupDialogProps {
  vaultId: string;
  onClose: () => void;
  /** Tài sản trong kho, kèm gói đang chứa (nếu có). */
  assets: GroupAssetOption[];
  beneficiaries: GroupBeneficiaryOption[];
  /** Tài sản người dùng đã chọn ở màn Tài sản; được tick sẵn nếu còn chọn được. */
  preselectedAssetIds?: string[];
}

/** Chỉ giữ những id còn chọn được (tài sản chưa thuộc gói nào). */
function usablePreselection(assets: GroupAssetOption[], ids: string[]): string[] {
  const usable: string[] = [];
  for (const asset of assets) {
    if (asset.containerId === null && ids.includes(asset.id)) {
      usable.push(asset.id);
    }
  }
  return usable;
}

/** Tạo gói bàn giao trong một form: chọn tài sản và người nhận ngay, xong là gói dùng được. */
export function CreateGroupDialog({
  vaultId,
  onClose,
  assets,
  beneficiaries,
  preselectedAssetIds = [],
}: CreateGroupDialogProps) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [initialSelection] = useState<string[]>(() =>
    usablePreselection(assets, preselectedAssetIds),
  );
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(initialSelection);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  // Gói đã tạo nhưng gắn thành viên lỗi giữa chừng: lần bấm sau chỉ gắn tiếp, không tạo thêm gói trùng.
  const [createdGroup, setCreatedGroup] = useState<PackageResponse | null>(null);

  const assetPicker = buildAssetPickerItems(assets, null);
  const beneficiaryItems = buildBeneficiaryPickerItems(beneficiaries, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePackageFormInput>({
    resolver: zodResolver(createPackageSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: "" },
  });

  async function createAndAttach(request: CreatePackageFormInput): Promise<PackageResponse> {
    let group = createdGroup;
    if (group === null) {
      group = await ownerVaultService.createPackage(vaultId, request);
      setCreatedGroup(group);
    }
    // Gắn lại thành viên đã có trong gói không gây lỗi nên thử lại sau lỗi giữa chừng vẫn an toàn.
    for (const assetId of selectedAssetIds) {
      group = await ownerVaultService.changeMember(vaultId, group.id, "assets", assetId, true);
    }
    for (const beneficiaryId of selectedBeneficiaryIds) {
      group = await ownerVaultService.changeMember(
        vaultId,
        group.id,
        "beneficiaries",
        beneficiaryId,
        true,
      );
    }
    return group;
  }

  function close(): void {
    if (createdGroup !== null) {
      // Gói đã được tạo dù gắn chưa xong: làm mới để danh sách hiện gói này.
      invalidateGroupQueries(client, vaultId);
    }
    onClose();
  }

  const willBeReady = selectedAssetIds.length > 0 && selectedBeneficiaryIds.length > 0;
  let missingText = "tài sản và người nhận";
  if (selectedAssetIds.length > 0) {
    missingText = "người nhận";
  } else if (selectedBeneficiaryIds.length > 0) {
    missingText = "tài sản";
  }

  let assetHint: string | undefined;
  if (assetPicker.freeCount > 0 && assetPicker.freeCount < assetPicker.items.length) {
    assetHint = `${assetPicker.freeCount} tài sản chưa thuộc gói nào — xếp lên đầu`;
  }

  let submitLabel = "Tạo gói";
  if (createdGroup !== null) {
    submitLabel = "Gắn tiếp vào gói";
  }
  if (action.pending) {
    submitLabel = "Đang xử lý…";
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && close()}>
      <DialogContent className="max-h-[92vh] gap-5 bg-[#FBFAF5] p-6 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#0A281E]">
            Tạo gói bàn giao
          </DialogTitle>
          <DialogDescription>
            Chọn tài sản và người nhận ngay tại đây. Xong form này là gói dùng được luôn, không phải
            mở lại để gán thêm.
          </DialogDescription>
        </DialogHeader>

        {initialSelection.length > 0 && (
          <p
            role="status"
            className="flex items-center gap-3 rounded-xl bg-[#DDEFE6] px-4 py-3 text-sm text-[#1F4D3A]"
          >
            <CircleCheck className="size-5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
            <span>
              Mở từ <strong>{initialSelection.length} tài sản</strong> bạn đang chọn ở màn Tài sản,
              nên chúng đã được tick sẵn bên dưới.
            </span>
          </p>
        )}

        <form
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(async (request) => {
            const saved = await action.execute(
              () => createAndAttach(request),
              () => invalidateGroupQueries(client, vaultId),
            );
            if (saved) {
              onClose();
            }
          })}
        >
          <fieldset disabled={action.pending} className="space-y-5">
            <label className="block space-y-2 text-sm font-semibold text-[#0A281E]">
              Tên gói bàn giao
              <Input
                placeholder="Ví dụ: Gói cho các con"
                readOnly={createdGroup !== null}
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
                className="h-11 bg-white font-normal"
              />
            </label>
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <MemberPicker
                title="Tài sản"
                items={assetPicker.items}
                selectedIds={selectedAssetIds}
                onChange={setSelectedAssetIds}
                searchPlaceholder="Tìm tài sản…"
                emptyText="Kho chưa có tài sản nào. Bạn có thể thêm tài sản tại mục Mục trong kho sau."
                allowSelectAll
                hint={assetHint}
                disabled={action.pending}
              />
              <MemberPicker
                title="Người nhận"
                items={beneficiaryItems}
                selectedIds={selectedBeneficiaryIds}
                onChange={setSelectedBeneficiaryIds}
                searchPlaceholder="Tìm người nhận…"
                emptyText="Kho chưa có người nhận nào."
                withInitial
                disabled={action.pending}
                footer={
                  <Link
                    to={ROUTES.DASHBOARD.BENEFICIARIES}
                    className="text-[#0A281E] hover:underline"
                  >
                    + Thêm người nhận mới
                  </Link>
                }
              />
            </div>
          </fieldset>

          {willBeReady && (
            <p
              role="status"
              className="flex items-center gap-3 rounded-xl bg-[#DDEFE6] px-4 py-3 text-sm text-[#1F4D3A]"
            >
              <CircleCheck className="size-5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
              <span>
                Có {selectedAssetIds.length} tài sản và {selectedBeneficiaryIds.length} người nhận,
                nên gói sẽ ở trạng thái <strong>Sẵn sàng</strong> ngay sau khi tạo.
              </span>
            </p>
          )}
          {!willBeReady && (
            <p
              role="status"
              className="flex items-center gap-3 rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B25]"
            >
              <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
              <span>
                Còn thiếu <strong>{missingText}</strong>, nên gói sẽ ở trạng thái Chưa sẵn sàng. Bạn
                có thể bổ sung sau ở thẻ gói.
              </span>
            </p>
          )}

          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          {createdGroup !== null && action.error && (
            <p className="text-sm text-heritage-muted">
              Gói “{createdGroup.name}” đã được tạo. Bấm “Gắn tiếp vào gói” để thử gắn lại, hoặc
              đóng và bổ sung sau ở thẻ gói.
            </p>
          )}

          <DialogFooter className="gap-2">
            <button
              type="button"
              className={`${buttonStyles.outline} rounded-full`}
              disabled={action.pending}
              onClick={close}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${buttonStyles.dark} rounded-full`}
              disabled={action.pending}
            >
              {submitLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
