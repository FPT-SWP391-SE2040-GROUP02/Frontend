import { useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { backendAssetService } from "../api/backendAssetService";
import type { BackendAsset } from "../model/backendAsset.schema";

/** Backend từ chối xóa khi tài sản đang nằm trong gói hoặc đã ghim vào lượt bàn giao. */
const isAssetInUse = (error: unknown) =>
  isAxiosError<{ code?: string }>(error) && error.response?.data?.code === "ASSET_IN_USE";

/**
 * Xóa tài sản: cần tick xác nhận. Nếu Backend từ chối vì đang được dùng (trong gói hoặc đã ghim),
 * hộp thoại chuyển sang giải thích lý do thay vì báo lỗi chung.
 */
export function DeleteDialog({
  vaultId,
  asset,
  onClose,
  onDone,
}: {
  vaultId: string;
  asset: BackendAsset;
  onClose: () => void;
  onDone: () => void;
}) {
  const action = usePrivateAction();
  const [understood, setUnderstood] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const remove = () =>
    void action.execute(
      () =>
        backendAssetService.remove(vaultId, asset.id).catch((error: unknown) => {
          setBlocked(isAssetInUse(error));
          throw error;
        }),
      () => {
        onDone();
        onClose();
      },
    );
  if (blocked && action.error) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Chưa xóa được mục này</DialogTitle>
            <DialogDescription>Mục đang được dùng nên kho giữ lại.</DialogDescription>
          </DialogHeader>
          <Notice tone="danger" role="alert">
            {action.error}
          </Notice>
          <Notice tone="warning">
            Nếu mục đã được ghim vào một lượt bàn giao đang chạy, mục không thể xóa cho tới khi bàn
            giao kết thúc.
          </Notice>
          <DialogFooter>
            <button type="button" className={buttonStyles.outline} onClick={onClose}>
              Đóng
            </button>
            <Link to={`${ROUTES.DASHBOARD.ASSETS}?tab=groups`} className={buttonStyles.gold}>
              Mở gói bàn giao
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Xóa “{asset.name}”?</DialogTitle>
          <DialogDescription>
            Mục và nội dung sẽ bị xóa khỏi kho. Thao tác này không thể hoàn tác. Mục đang nằm trong
            gói hoặc đã ghim vào lượt bàn giao thì không xóa được.
          </DialogDescription>
        </DialogHeader>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5"
            checked={understood}
            disabled={action.pending}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
          Tôi hiểu nội dung sẽ bị xóa vĩnh viễn.
        </label>
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        <DialogFooter>
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={onClose}
            disabled={action.pending}
          >
            Hủy
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#A32119] px-6 text-sm font-semibold text-white hover:bg-[#8A1B14] disabled:pointer-events-none disabled:opacity-50"
            onClick={remove}
            disabled={action.pending || !understood}
          >
            {action.pending ? "Đang xóa…" : "Xóa mục"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
