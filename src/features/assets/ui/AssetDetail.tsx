import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, formatDate, formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { backendAssetService } from "../api/backendAssetService";
import type { BackendAsset } from "../model/backendAsset.schema";
import { useAssetDownload } from "../model/useAssetDownload";
import { DeleteDialog, VersionDialog } from "./AssetDialogs";

const editSchema = z.object({
  name: z.string().regex(/\S/, "Nhập tên mục.").max(200, "Tên tối đa 200 ký tự."),
  description: z.string().max(1000, "Ghi chú tối đa 1000 ký tự."),
});

const kindLabels = { FILE: "Tệp", TEXT: "Văn bản" } as const;

/** Đổi tên và ghi chú; chỉ gửi trường đã đổi cùng etag hiện tại (xung đột thì báo tải lại). */
function EditForm({
  vaultId,
  asset,
  onSaved,
}: {
  vaultId: string;
  asset: BackendAsset;
  onSaved: () => void;
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
    if (!nameChanged && !descriptionChanged) return;
    void action.execute(
      () =>
        backendAssetService.update(vaultId, asset.id, {
          etag: asset.etag,
          ...(nameChanged ? { name: values.name } : {}),
          ...(descriptionChanged ? { description: values.description } : {}),
        }),
      onSaved,
    );
  });
  return (
    <form id="asset-edit-form" noValidate onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">
        Tên mục
        <Input
          {...register("name")}
          maxLength={200}
          aria-invalid={Boolean(errors.name)}
          disabled={action.pending}
          className="mt-2 h-12 rounded-xl bg-white px-4 text-sm font-normal"
        />
        {errors.name && (
          <span role="alert" className="text-xs text-destructive">
            {errors.name.message}
          </span>
        )}
      </label>
      <label className="block text-sm font-medium">
        Ghi chú cho người nhận
        <Textarea
          {...register("description")}
          maxLength={1000}
          aria-invalid={Boolean(errors.description)}
          disabled={action.pending}
          className="mt-2 min-h-24 rounded-xl bg-white px-4 text-sm font-normal"
        />
        {errors.description && (
          <span role="alert" className="text-xs text-destructive">
            {errors.description.message}
          </span>
        )}
      </label>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && !action.error && (
        <p role="status" className="text-sm text-[#1F7A55]">
          Đã lưu thay đổi.
        </p>
      )}
    </form>
  );
}

/**
 * Chi tiết một mục (thiết kế "Kho — Mục chi tiết"): thông tin và sửa tên/ghi chú, danh sách phiên bản với
 * nút tải từng phiên bản, thêm phiên bản mới và xóa mục. Backend chỉ trả số phiên bản và thông tin của phiên
 * bản hiện tại, nên ngày và dung lượng chỉ hiện cho bản hiện tại.
 */
export function AssetDetail({
  vaultId,
  asset,
  onDeleted,
}: {
  vaultId: string;
  asset: BackendAsset;
  onDeleted: () => void;
}) {
  const [dialog, setDialog] = useState<"version" | "delete" | null>(null);
  const client = useQueryClient();
  const download = useAssetDownload(vaultId, asset);
  const latest = asset.currentVersion.versionNumber;
  const versions = Array.from({ length: latest }, (_, index) => latest - index);
  /** Đọc lại danh sách, chi tiết và dung lượng kho sau khi có thay đổi được Backend xác nhận. */
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
    // Khóa của feature vault-management; không import chéo feature nên dùng tiền tố khóa.
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel title="Thông tin">
        <dl className="mb-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-heritage-muted">Loại</dt>
            <dd className="mt-1 font-semibold">{kindLabels[asset.kind]}</dd>
          </div>
          <div>
            <dt className="text-xs text-heritage-muted">Cập nhật</dt>
            <dd className="mt-1 font-semibold">{formatDate(asset.updatedAt ?? asset.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-heritage-muted">Dung lượng</dt>
            <dd className="mt-1 font-semibold">
              {formatStorageSize(asset.currentVersion.sizeBytes)}
            </dd>
          </div>
        </dl>
        <EditForm key={asset.etag} vaultId={vaultId} asset={asset} onSaved={refresh} />
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" form="asset-edit-form" className={buttonStyles.gold}>
            Lưu thay đổi
          </button>
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => setDialog("version")}
          >
            Thêm phiên bản mới
          </button>
          <button type="button" className={buttonStyles.danger} onClick={() => setDialog("delete")}>
            Xóa mục
          </button>
        </div>
      </Panel>
      <Panel title="Phiên bản">
        <ul className="divide-y divide-heritage-border">
          {versions.map((number) => {
            const current = number === latest;
            return (
              <li
                key={number}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
              >
                <div>
                  <p className="font-semibold">
                    Phiên bản {number}
                    {current ? " (hiện tại)" : ""}
                  </p>
                  {current && (
                    <p className="text-sm text-heritage-muted">
                      {formatDateTime(asset.currentVersion.createdAt)} ·{" "}
                      {formatStorageSize(asset.currentVersion.sizeBytes)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Tải xuống phiên bản ${number}`}
                  className={buttonStyles.outline}
                  disabled={download.pending}
                  onClick={() => download.download(number)}
                >
                  Tải xuống
                </button>
              </li>
            );
          })}
        </ul>
        {download.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {download.error}
          </p>
        )}
        <p className="mt-4 flex items-start gap-2 border-t border-heritage-border pt-4 text-xs text-heritage-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Mỗi lần thêm phiên bản, bản cũ vẫn được giữ. Người nhận chỉ thấy bản mới nhất khi bàn
          giao.
        </p>
      </Panel>
      {dialog === "version" && (
        <VersionDialog
          key={asset.etag}
          vaultId={vaultId}
          asset={asset}
          onClose={() => setDialog(null)}
          onDone={refresh}
        />
      )}
      {dialog === "delete" && (
        <DeleteDialog
          vaultId={vaultId}
          asset={asset}
          onClose={() => setDialog(null)}
          onDone={() => {
            refresh();
            onDeleted();
          }}
        />
      )}
    </div>
  );
}
