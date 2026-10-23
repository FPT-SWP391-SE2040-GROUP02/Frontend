import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { Upload } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { Textarea } from "@/shared/ui/textarea";
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

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/** Thêm phiên bản mới: tệp cho tài sản FILE, văn bản cho tài sản TEXT. Phiên bản cũ vẫn được giữ. */
export function VersionDialog({
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState("");
  const isText = asset.kind === "TEXT";
  const pick = (picked: File | null | undefined) => {
    setFile(picked ?? null);
    setProblem("");
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!action.pending) pick(event.dataTransfer.files[0]);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isText) {
      if (!content.trim()) return setProblem("Nhập nội dung mới.");
      setProblem("");
      void action.execute(
        () =>
          backendAssetService.createTextVersion(vaultId, asset.id, { content, etag: asset.etag }),
        () => {
          setContent("");
          onDone();
          onClose();
        },
      );
      return;
    }
    if (!file || file.size === 0 || file.size > MAX_UPLOAD_BYTES)
      return setProblem(`Chọn tệp không rỗng, tối đa ${formatStorageSize(MAX_UPLOAD_BYTES)}.`);
    setProblem("");
    void action.execute(
      () => backendAssetService.createFileVersion(vaultId, asset.id, file, asset.etag),
      () => {
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
        onDone();
        onClose();
      },
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Thêm phiên bản mới</DialogTitle>
          <DialogDescription>
            Tạo phiên bản {asset.currentVersion.versionNumber + 1} cho “{asset.name}”. Phiên bản cũ
            vẫn được giữ và vẫn tính vào dung lượng kho.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          {isText ? (
            <label className="block text-sm font-medium">
              Nội dung mới
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={100000}
                disabled={action.pending}
                autoComplete="off"
                placeholder="Nội dung sẽ được mã hóa trên máy chủ"
                className="mt-2 min-h-32 font-normal"
              />
            </label>
          ) : (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center ${dragging ? "border-[#B68F4C] bg-[#F1E6CC]/40" : "border-[#9DB0A5]"}`}
            >
              <Upload className="mx-auto size-7 text-heritage-muted" aria-hidden="true" />
              <p className="mt-3 font-semibold">Chọn tệp để tải lên</p>
              <p className="mt-1 text-sm text-heritage-muted">Hoặc kéo thả vào đây</p>
              <input
                ref={fileInput}
                type="file"
                hidden
                aria-label="Tệp mới"
                disabled={action.pending}
                onChange={(event) => pick(event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={action.pending}
                className={`${buttonStyles.dark} mt-4`}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="size-4" aria-hidden="true" />
                Chọn tệp
              </button>
              <p className="mt-3 text-xs text-heritage-muted">
                {file
                  ? `${file.name} · ${formatStorageSize(file.size)}`
                  : `Tối đa ${formatStorageSize(MAX_UPLOAD_BYTES)} và không vượt dung lượng còn lại của gói`}
              </p>
            </div>
          )}
          <Notice tone="warning">
            Nếu dung lượng còn lại không đủ, bạn sẽ thấy báo “Kho không đủ dung lượng”.
          </Notice>
          {problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}
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
            <button type="submit" className={buttonStyles.gold} disabled={action.pending}>
              {action.pending ? "Đang mã hóa và lưu…" : "Tải lên"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
            Mục và mọi phiên bản sẽ bị xóa khỏi kho. Thao tác này không thể hoàn tác. Mục đang nằm
            trong gói hoặc đã ghim vào lượt bàn giao thì không xóa được.
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
