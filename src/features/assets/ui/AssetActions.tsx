import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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

type DialogKind = "download" | "edit" | "version" | "delete";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/** Tên tệp tải về an toàn, không chứa ký tự đường dẫn hoặc điều khiển. */
const safeFileName = (value: string) => value.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120);

const editSchema = z.object({
  name: z.string().regex(/\S/, "Nhập tên tài sản.").max(200, "Tên tối đa 200 ký tự."),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự."),
});

/**
 * Thao tác của Owner trên một tài sản: tải, đổi tên/mô tả, thay nội dung (phiên bản mới) và xóa.
 * Không optimistic: danh sách chỉ đổi sau khi BE xác nhận rồi được đọc lại. Nội dung chỉ nằm trong
 * form/blob tạm, không vào cache hay log.
 */
export function AssetActions({ vaultId, asset }: { vaultId: string; asset: BackendAsset }) {
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const client = useQueryClient();
  const close = () => setDialog(null);
  /** Đọc lại danh sách và dung lượng kho (phiên bản mới/xóa đổi mức đã dùng). */
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
    // Khóa của feature vault-management; không import chéo feature nên dùng tiền tố khóa.
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  };
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`Thao tác với ${asset.name}`}>
      <Button type="button" variant="outline" onClick={() => setDialog("download")}>
        <Download className="size-4" aria-hidden="true" />
        Tải xuống
      </Button>
      <Button type="button" variant="outline" onClick={() => setDialog("edit")}>
        <Pencil className="size-4" aria-hidden="true" />
        Sửa
      </Button>
      <Button type="button" variant="outline" onClick={() => setDialog("version")}>
        <FilePlus2 className="size-4" aria-hidden="true" />
        Thay nội dung
      </Button>
      <Button type="button" variant="outline" onClick={() => setDialog("delete")}>
        <Trash2 className="size-4" aria-hidden="true" />
        Xóa
      </Button>
      {dialog === "download" && <DownloadDialog vaultId={vaultId} asset={asset} onClose={close} />}
      {dialog === "edit" && (
        <EditDialog
          key={asset.etag}
          vaultId={vaultId}
          asset={asset}
          onClose={close}
          onDone={refresh}
        />
      )}
      {dialog === "version" && (
        <VersionDialog
          key={asset.etag}
          vaultId={vaultId}
          asset={asset}
          onClose={close}
          onDone={refresh}
        />
      )}
      {dialog === "delete" && (
        <DeleteDialog vaultId={vaultId} asset={asset} onClose={close} onDone={refresh} />
      )}
    </div>
  );
}

function DownloadDialog({
  vaultId,
  asset,
  onClose,
}: {
  vaultId: string;
  asset: BackendAsset;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const latest = asset.currentVersion.versionNumber;
  const [version, setVersion] = useState(latest);
  const versions = Array.from({ length: latest }, (_, index) => latest - index);
  const fileName =
    asset.kind === "TEXT" ? `${asset.name}.txt` : (asset.currentVersion.fileName ?? asset.name);
  const download = () =>
    void action.execute(
      () => backendAssetService.download(vaultId, asset.id, version),
      (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = safeFileName(fileName);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        onClose();
      },
    );
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tải xuống “{asset.name}”</DialogTitle>
          <DialogDescription>
            Hệ thống giải mã và kiểm tra toàn vẹn nội dung trước khi gửi tệp.
          </DialogDescription>
        </DialogHeader>
        {latest > 1 && (
          <label className="block text-sm">
            Phiên bản
            <select
              value={version}
              onChange={(event) => setVersion(Number(event.target.value))}
              disabled={action.pending}
              className="mt-1 block min-h-11 w-full rounded-lg border border-heritage-border bg-white px-3"
            >
              {versions.map((item) => (
                <option key={item} value={item}>
                  {item === latest ? `Phiên bản ${item} (hiện tại)` : `Phiên bản ${item}`}
                </option>
              ))}
            </select>
          </label>
        )}
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
            Đóng
          </Button>
          <Button type="button" onClick={download} disabled={action.pending}>
            {action.pending ? "Đang chuẩn bị…" : "Tải xuống"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: asset.name, description: asset.description ?? "" },
  });
  const submit = handleSubmit((values) => {
    const nameChanged = values.name !== asset.name;
    const descriptionChanged = values.description !== (asset.description ?? "");
    if (!nameChanged && !descriptionChanged) {
      onClose();
      return;
    }
    void action.execute(
      () =>
        backendAssetService.update(vaultId, asset.id, {
          etag: asset.etag,
          ...(nameChanged ? { name: values.name } : {}),
          ...(descriptionChanged ? { description: values.description } : {}),
        }),
      () => {
        onDone();
        onClose();
      },
    );
  });
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thông tin tài sản</DialogTitle>
          <DialogDescription>
            Đổi tên hoặc mô tả không tạo phiên bản nội dung mới.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-3">
          <label className="block text-sm">
            Tên tài sản
            <Input
              {...register("name")}
              maxLength={200}
              aria-invalid={Boolean(errors.name)}
              disabled={action.pending}
              className="mt-1"
            />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </label>
          <label className="block text-sm">
            Mô tả
            <Textarea
              {...register("description")}
              maxLength={1000}
              aria-invalid={Boolean(errors.description)}
              disabled={action.pending}
              className="mt-1 min-h-24"
            />
            {errors.description && (
              <span className="text-xs text-destructive">{errors.description.message}</span>
            )}
          </label>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={action.pending}>
              {action.pending ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VersionDialog({
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
  const [problem, setProblem] = useState("");
  const isText = asset.kind === "TEXT";
  const submit = (event: React.FormEvent) => {
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
      return setProblem("Chọn tệp không rỗng, tối đa 500 MiB.");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay nội dung “{asset.name}”</DialogTitle>
          <DialogDescription>
            Tạo phiên bản {asset.currentVersion.versionNumber + 1}. Các phiên bản cũ vẫn được giữ và
            vẫn tính vào dung lượng kho.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-3">
          {isText ? (
            <label className="block text-sm">
              Nội dung mới
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={100000}
                disabled={action.pending}
                autoComplete="off"
                className="mt-1 min-h-32"
              />
            </label>
          ) : (
            <label className="block text-sm">
              Tệp mới
              <Input
                ref={fileInput}
                type="file"
                disabled={action.pending}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-1"
              />
            </label>
          )}
          {problem && (
            <p role="alert" className="text-xs text-destructive">
              {problem}
            </p>
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
            <Button type="submit" disabled={action.pending}>
              {action.pending ? "Đang mã hóa và lưu…" : "Lưu phiên bản mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
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
  const remove = () =>
    void action.execute(
      () => backendAssetService.remove(vaultId, asset.id),
      () => {
        onDone();
        onClose();
      },
    );
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa “{asset.name}”?</DialogTitle>
          <DialogDescription>
            Mọi phiên bản và nội dung đã mã hóa sẽ bị xóa vĩnh viễn, không khôi phục được. Tài sản
            đang nằm trong gói hoặc đã ghim vào lượt bàn giao thì không xóa được.
          </DialogDescription>
        </DialogHeader>
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
            Giữ lại
          </Button>
          <Button type="button" onClick={remove} disabled={action.pending}>
            {action.pending ? "Đang xóa…" : "Xóa vĩnh viễn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
