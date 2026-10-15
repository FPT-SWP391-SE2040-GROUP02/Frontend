import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { PackageResponse } from "@/entities/package/model/package.types";
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

interface Option {
  id: string;
  label: string;
}
/** Chỉnh sửa một snapshot etag. Parent giữ form dirty khi server có phiên bản mới; 409 phải tải lại. */
export function ContainerEditor({
  container,
  assets,
  beneficiaries,
}: {
  container: PackageResponse;
  assets: Option[];
  beneficiaries: Option[];
}) {
  const [etag, setEtag] = useState(container.etag);
  const [confirm, setConfirm] = useState(false);
  const [archive, setArchive] = useState(false);
  const action = usePrivateAction();
  const client = useQueryClient();
  const publish = (result: PackageResponse) => {
    setEtag(result.etag);
    reset({ name: result.name, description: result.description ?? "" });
    setConfirm(false);
    setArchive(false);
    client.setQueryData(ownerVaultKeys.package(result.vaultId, result.id), result);
    void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", result.vaultId] });
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreatePackageFormInput>({
    resolver: zodResolver(createPackageSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: container.name, description: container.description ?? "" },
  });
  const archived = container.status === "ARCHIVED";
  return (
    <section className="space-y-6 rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <div>
        <h2 className="text-lg font-semibold">{container.name}</h2>
        <p className="mt-2 text-sm">
          Trạng thái: {container.status === "READY" ? "Sẵn sàng" : archived ? "Đã lưu trữ" : "Nháp"}
        </p>
        {container.missingRequirements.length > 0 && (
          <p className="mt-2 text-sm text-heritage-muted">
            Cần hoàn thiện:{" "}
            {container.missingRequirements
              .map(
                (item) =>
                  ({ NO_ASSET: "chưa có tài sản", NO_DESIGNATION: "chưa có người nhận" })[item] ??
                  item,
              )
              .join(", ")}
          </p>
        )}
      </div>
      <fieldset disabled={action.pending || archived} className="space-y-6">
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit((values) =>
            action.execute(
              () =>
                ownerVaultService.updatePackage(container.vaultId, container.id, {
                  ...values,
                  etag,
                }),
              publish,
            ),
          )}
        >
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
            Lưu thông tin gói
          </Button>
        </form>
        {isDirty && (
          <p className="text-sm text-heritage-muted">
            Lưu thông tin gói trước khi thay đổi nội dung, người nhận hoặc lưu trữ.
          </p>
        )}
        <fieldset disabled={isDirty} className="space-y-6">
          <label className="flex min-h-11 items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            Tôi đồng ý đưa kế hoạch về nháp nếu thao tác gỡ/lưu trữ làm mất gói sẵn sàng cuối cùng.
            Bỏ chọn nếu chưa đồng ý thay đổi này.
          </label>
          {(
            [
              ["assets", "Tài sản", assets, container.assetIds],
              ["beneficiaries", "Người nhận", beneficiaries, container.beneficiaryIds],
            ] as const
          ).map(([relation, title, options, assigned]) => {
            const assignedOptions = assigned.map(
              (id) =>
                options.find((item) => item.id === id) ?? {
                  id,
                  label: "Mục đã gắn (không nằm trong trang lựa chọn hiện tại)",
                },
            );
            return (
              <div key={relation} className="space-y-3 border-t border-heritage-border pt-4">
                <h3 className="font-semibold">{title}</h3>
                {assignedOptions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-heritage-border p-3"
                  >
                    <span className="text-sm">{item.label}</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        void action.execute(
                          () =>
                            ownerVaultService.changeMember(
                              container.vaultId,
                              container.id,
                              relation,
                              item.id,
                              false,
                              confirm,
                            ),
                          publish,
                        )
                      }
                    >
                      Gỡ
                    </Button>
                  </div>
                ))}
                <form
                  className="flex flex-wrap gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const id = new FormData(event.currentTarget).get("memberId");
                    if (typeof id === "string" && id)
                      void action.execute(
                        () =>
                          ownerVaultService.changeMember(
                            container.vaultId,
                            container.id,
                            relation,
                            id,
                            true,
                          ),
                        publish,
                      );
                  }}
                >
                  <select
                    name="memberId"
                    aria-label={`Chọn ${title.toLowerCase()}`}
                    required
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-heritage-border bg-heritage-surface px-3"
                  >
                    <option value="">Chọn {title.toLowerCase()}</option>
                    {options
                      .filter((item) => !assigned.includes(item.id))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                  </select>
                  <Button type="submit" variant="outline">
                    Thêm vào gói
                  </Button>
                </form>
              </div>
            );
          })}
          <div className="space-y-3 border-t border-heritage-border pt-4">
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5"
                checked={archive}
                onChange={(e) => setArchive(e.target.checked)}
              />
              Tôi xác nhận lưu trữ gói này.
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={!archive}
              onClick={() =>
                void action.execute(
                  () => ownerVaultService.archivePackage(container.vaultId, container.id, confirm),
                  publish,
                )
              }
            >
              Lưu trữ gói
            </Button>
          </div>
        </fieldset>
      </fieldset>
      {action.pending && <p role="status">Đang lưu thay đổi…</p>}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && <p role="status">Đã lưu thay đổi.</p>}
    </section>
  );
}
