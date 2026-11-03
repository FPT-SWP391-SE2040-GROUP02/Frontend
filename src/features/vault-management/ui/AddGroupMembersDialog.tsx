import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { PackageResponse } from "@/entities/package/model/package.types";
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
import { ownerVaultService } from "../api/ownerVaultService";
import {
  buildAssetPickerItems,
  buildBeneficiaryPickerItems,
  type GroupAssetOption,
  type GroupBeneficiaryOption,
  type MemberPickerItem,
} from "../model/groupMembers";
import { invalidateGroupQueries } from "../model/groupQueries";
import { MemberPicker } from "./MemberPicker";

export interface AddGroupMembersDialogProps {
  group: PackageResponse;
  relation: "assets" | "beneficiaries";
  assets: GroupAssetOption[];
  beneficiaries: GroupBeneficiaryOption[];
  onClose: () => void;
}

/** Bổ sung tài sản hoặc người nhận cho một gói ngay từ thẻ gói, không phải mở trang chi tiết. */
export function AddGroupMembersDialog({
  group,
  relation,
  assets,
  beneficiaries,
  onClose,
}: AddGroupMembersDialogProps) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  let title = "Chọn người nhận";
  let pickerTitle = "Người nhận";
  let searchPlaceholder = "Tìm người nhận…";
  let emptyText = "Kho chưa còn hồ sơ người nhận nào để gán.";
  let items: MemberPickerItem[];
  let hint: string | undefined;
  if (relation === "assets") {
    title = "Thêm tài sản vào gói";
    pickerTitle = "Tài sản";
    searchPlaceholder = "Tìm tài sản…";
    emptyText = "Kho chưa còn tài sản nào ngoài gói này.";
    const built = buildAssetPickerItems(assets, group.id);
    items = built.items;
    if (built.freeCount > 0) {
      hint = `${built.freeCount} tài sản chưa thuộc gói nào — xếp lên đầu`;
    }
  } else {
    items = buildBeneficiaryPickerItems(beneficiaries, group.beneficiaryIds);
  }

  async function attachAll(): Promise<PackageResponse> {
    let latest = group;
    for (const memberId of selectedIds) {
      // Gắn lại thành viên đã có trong gói không gây lỗi nên thử lại sau lỗi giữa chừng vẫn an toàn.
      latest = await ownerVaultService.changeMember(
        group.vaultId,
        group.id,
        relation,
        memberId,
        true,
      );
    }
    return latest;
  }

  async function submit(): Promise<void> {
    const saved = await action.execute(attachAll, () => {
      invalidateGroupQueries(client, group.vaultId);
    });
    if (saved) {
      onClose();
    }
  }

  let footer = null;
  if (relation === "beneficiaries") {
    footer = (
      <Link to={ROUTES.DASHBOARD.BENEFICIARIES} className="text-[#0A281E] hover:underline">
        + Thêm người nhận mới
      </Link>
    );
  }

  let submitLabel = "Lưu";
  if (action.pending) {
    submitLabel = "Đang lưu…";
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="bg-[#FBFAF5] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0A281E]">{title}</DialogTitle>
          <DialogDescription>Gói “{group.name}”.</DialogDescription>
        </DialogHeader>
        <MemberPicker
          title={pickerTitle}
          items={items}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          allowSelectAll={relation === "assets"}
          withInitial={relation === "beneficiaries"}
          hint={hint}
          footer={footer}
          disabled={action.pending}
        />
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
          <button
            type="button"
            className={buttonStyles.dark}
            disabled={action.pending || selectedIds.length === 0}
            onClick={() => void submit()}
          >
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
