import { useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Plus, TriangleAlert } from "lucide-react";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { createPackageSchema } from "@/entities/package/model/package.schema";
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
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { needsPlanConfirmation } from "@/features/vault-management/model/planConfirmation";
import { ownerVaultKeys, useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";

/** Số tài sản, người nhận và gói tối đa nạp vào hộp thoại một lần. */
const LIST_LIMIT = 100;
const KIND_LABELS = { FILE: "Tệp tải lên", TEXT: "Ghi chú bí mật" } as const;
const COLUMN_BOX = "rounded-2xl border border-heritage-border bg-heritage-canvas";
const SEARCH_FIELD =
  "w-full rounded-xl border border-heritage-border bg-heritage-surface px-3 py-2 text-sm";
const DANGER_BUTTON = "border-red-300 text-red-700 hover:bg-red-50";

function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }
  return [...ids, id];
}

interface PickRowProps {
  checked: boolean;
  disabled?: boolean;
  title: string;
  detail: string;
  initial?: string;
  onToggle: () => void;
}

/** Một dòng chọn: ô tích, tên và dòng phụ; người nhận có thêm chữ cái đầu trong vòng tròn. */
function PickRow({ checked, disabled = false, title, detail, initial, onToggle }: PickRowProps) {
  let rowStyle = "hover:bg-heritage-neutral-bg/60";
  if (checked) {
    rowStyle = "bg-green-100/80";
  }
  if (disabled) {
    rowStyle = "opacity-60";
  }
  return (
    <li>
      <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ${rowStyle}`}>
        <input
          type="checkbox"
          className="size-5 shrink-0 accent-heritage-sidebar"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
        />
        {initial && (
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft text-sm font-semibold text-heritage-on-gold"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
        <span className="min-w-0">
          <span className="block break-words text-sm font-semibold">{title}</span>
          <span className="block text-xs text-heritage-muted">{detail}</span>
        </span>
      </label>
    </li>
  );
}

function ColumnMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="px-4 py-6 text-sm text-heritage-muted">
      {children}
    </p>
  );
}

/** Bước đang chờ người dùng đồng ý trước khi gửi: xóa gói, hoặc chấp nhận đưa kế hoạch về Nháp. */
type Panel = null | "delete" | "plan";

/**
 * Tạo hoặc chỉnh sửa gói bàn giao trong cùng một hộp thoại: đặt tên, tick tài sản và người nhận rồi bấm một nút.
 * Không truyền `existing` là tạo gói; truyền gói hiện có là chỉnh sửa (đổi tên, mô tả, tick thêm hoặc bỏ tick, xóa gói).
 *
 * Gói được tạo rỗng rồi gắn từng tài sản/người nhận bằng API sẵn có. Lỗi giữa chừng thì giữ phần đã làm và lần bấm
 * sau chỉ làm tiếp phần còn thiếu (gắn lại cùng mục vẫn trả 200), không tạo gói trùng.
 * Tài sản đang ở gói khác bị khóa vì Backend chỉ cho một tài sản nằm trong một gói.
 */
export function PackageDialog({
  vaultId,
  existing,
  onClose,
}: {
  vaultId: string;
  existing?: PackageResponse;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const editing = existing !== undefined;
  const createdId = useRef<string | null>(null);
  /** Các bước đã xong ở lần bấm trước (đổi thông tin, gắn, gỡ) để lần bấm sau bỏ qua. */
  const done = useRef<string[]>([]);
  const [packageCreated, setPackageCreated] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [nameError, setNameError] = useState("");
  const [assetIds, setAssetIds] = useState<string[]>(existing?.assetIds ?? []);
  const [beneficiaryIds, setBeneficiaryIds] = useState<string[]>(existing?.beneficiaryIds ?? []);
  const [assetSearch, setAssetSearch] = useState("");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [addingBeneficiary, setAddingBeneficiary] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  /** Thao tác sẽ gửi lại kèm xác nhận khi Backend đòi đồng ý đưa kế hoạch về Nháp. */
  const [planOperation, setPlanOperation] = useState<"save" | "delete">("save");
  const assets = useVaultAssets(vaultId, { pageIndex: 1, pageSize: LIST_LIMIT });
  const beneficiaries = useBeneficiaries(vaultId, { pageIndex: 1, pageSize: LIST_LIMIT });
  const packages = useOwnerPackages(vaultId, true, { pageIndex: 1, pageSize: LIST_LIMIT });

  const originalAssetIds = existing?.assetIds ?? [];
  const originalBeneficiaryIds = existing?.beneficiaryIds ?? [];

  // Tài sản nào đang ở gói nào (bỏ gói đã xóa và chính gói đang sửa) để khóa và ghi rõ "Đang ở …".
  const packageOfAsset: Record<string, string> = {};
  if (packages.data) {
    for (const item of packages.data.items) {
      if (item.status === "REMOVED" || item.id === existing?.id) {
        continue;
      }
      for (const assetId of item.assetIds) {
        packageOfAsset[assetId] = item.name;
      }
    }
  }

  const assetNeedle = assetSearch.trim().toLowerCase();
  const ownAssets: Array<{ id: string; name: string; kind: "FILE" | "TEXT" }> = [];
  const freeAssets: Array<{ id: string; name: string; kind: "FILE" | "TEXT" }> = [];
  const takenAssets: Array<{ id: string; name: string; packageName: string }> = [];
  let freeTotal = 0;
  if (assets.data && packages.data) {
    for (const item of assets.data.items) {
      const inOtherPackage = Object.hasOwn(packageOfAsset, item.id);
      const inThisPackage = originalAssetIds.includes(item.id);
      if (!inOtherPackage && !inThisPackage) {
        freeTotal = freeTotal + 1;
      }
      if (assetNeedle !== "" && !item.name.toLowerCase().includes(assetNeedle)) {
        continue;
      }
      if (inOtherPackage) {
        takenAssets.push({ id: item.id, name: item.name, packageName: packageOfAsset[item.id] });
      } else if (inThisPackage) {
        ownAssets.push({ id: item.id, name: item.name, kind: item.kind });
      } else {
        freeAssets.push({ id: item.id, name: item.name, kind: item.kind });
      }
    }
  }
  // Đang sửa thì mục của chính gói này đứng đầu, rồi tới mục chưa thuộc gói nào.
  const selectableAssets = [...ownAssets, ...freeAssets];
  const selectableIds = selectableAssets.map((item) => item.id);
  let allSelected = selectableIds.length > 0;
  for (const id of selectableIds) {
    if (!assetIds.includes(id)) {
      allSelected = false;
    }
  }

  function toggleAllAssets(): void {
    if (allSelected) {
      setAssetIds(assetIds.filter((id) => !selectableIds.includes(id)));
      return;
    }
    const next = [...assetIds];
    for (const id of selectableIds) {
      if (!next.includes(id)) {
        next.push(id);
      }
    }
    setAssetIds(next);
  }

  const assetRows: ReactNode[] = [];
  for (const item of selectableAssets) {
    assetRows.push(
      <PickRow
        key={item.id}
        checked={assetIds.includes(item.id)}
        title={item.name}
        detail={KIND_LABELS[item.kind]}
        onToggle={() => setAssetIds(toggleId(assetIds, item.id))}
      />,
    );
  }
  for (const item of takenAssets) {
    assetRows.push(
      <PickRow
        key={item.id}
        checked={false}
        disabled
        title={item.name}
        detail={`Đang ở ${item.packageName}`}
        onToggle={() => undefined}
      />,
    );
  }

  const personNeedle = beneficiarySearch.trim().toLowerCase();
  const personRows: ReactNode[] = [];
  if (beneficiaries.data) {
    for (const person of beneficiaries.data.items) {
      const label = `${person.fullName} ${person.citizenIdLast4}`.toLowerCase();
      if (personNeedle !== "" && !label.includes(personNeedle)) {
        continue;
      }
      personRows.push(
        <PickRow
          key={person.id}
          checked={beneficiaryIds.includes(person.id)}
          title={person.fullName}
          detail={`CCCD ****${person.citizenIdLast4}`}
          initial={person.fullName.trim().charAt(0).toUpperCase()}
          onToggle={() => setBeneficiaryIds(toggleId(beneficiaryIds, person.id))}
        />,
      );
    }
  }

  let assetBody: ReactNode;
  if (assets.isPending || packages.isPending) {
    assetBody = <ColumnMessage>Đang tải tài sản…</ColumnMessage>;
  } else if (assets.isError || packages.isError) {
    assetBody = (
      <div role="alert" className="space-y-3 px-4 py-6">
        <p className="text-sm">Không tải được danh sách tài sản.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void assets.refetch();
            void packages.refetch();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  } else if (assetRows.length === 0) {
    assetBody = <ColumnMessage>Chưa có tài sản nào khớp.</ColumnMessage>;
  } else {
    assetBody = <ul className="max-h-64 overflow-y-auto p-2">{assetRows}</ul>;
  }

  let personBody: ReactNode;
  if (addingBeneficiary) {
    personBody = (
      <div className="max-h-80 overflow-y-auto p-3">
        <BeneficiaryForm
          vaultId={vaultId}
          onCancel={() => setAddingBeneficiary(false)}
          onCreated={(id) => {
            // Người vừa thêm được tick sẵn để khỏi phải tìm lại trong danh sách.
            setBeneficiaryIds((current) => {
              if (current.includes(id)) {
                return current;
              }
              return [...current, id];
            });
            setAddingBeneficiary(false);
          }}
        />
      </div>
    );
  } else if (beneficiaries.isPending) {
    personBody = <ColumnMessage>Đang tải người nhận…</ColumnMessage>;
  } else if (beneficiaries.isError) {
    personBody = (
      <div role="alert" className="space-y-3 px-4 py-6">
        <p className="text-sm">Không tải được danh sách người nhận.</p>
        <Button type="button" variant="outline" onClick={() => void beneficiaries.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else if (personRows.length === 0) {
    personBody = <ColumnMessage>Chưa có người nhận nào khớp.</ColumnMessage>;
  } else {
    personBody = <ul className="max-h-64 overflow-y-auto p-2">{personRows}</ul>;
  }

  const hasAssets = assetIds.length > 0;
  const hasPeople = beneficiaryIds.length > 0;
  let afterSave = "ngay sau khi tạo";
  if (editing) {
    afterSave = "sau khi lưu";
  }
  let summary: ReactNode;
  let summaryStyle = "bg-green-100 text-green-900";
  if (hasAssets && hasPeople) {
    summary = (
      <>
        Có {assetIds.length} tài sản và {beneficiaryIds.length} người nhận, nên gói sẽ ở trạng thái{" "}
        <strong>Sẵn sàng</strong> {afterSave}.
      </>
    );
  } else {
    summaryStyle = "bg-heritage-warning-bg text-heritage-warning";
    let missing = "tài sản và người nhận";
    if (hasAssets) {
      missing = "người nhận";
    } else if (hasPeople) {
      missing = "tài sản";
    }
    summary = (
      <>
        Gói sẽ ở trạng thái <strong>Nháp</strong> vì còn thiếu {missing}. Bạn có thể bổ sung sau.
      </>
    );
  }

  // Chỉnh sửa: chỉ cho lưu khi có gì đổi so với gói đang có.
  let changed = !editing;
  if (existing) {
    const sameAssets =
      assetIds.length === originalAssetIds.length &&
      assetIds.every((id) => originalAssetIds.includes(id));
    const samePeople =
      beneficiaryIds.length === originalBeneficiaryIds.length &&
      beneficiaryIds.every((id) => originalBeneficiaryIds.includes(id));
    const sameInfo =
      name.trim() === existing.name && description.trim() === (existing.description ?? "").trim();
    changed = !(sameAssets && samePeople && sameInfo);
  }

  function refreshQueries(): void {
    void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
  }

  /** Mỗi bước chỉ chạy một lần dù người dùng bấm lại sau lỗi giữa chừng. */
  function pending(step: string): boolean {
    return !done.current.includes(step);
  }

  async function applyChanges(info: { name: string; description: string }, confirmed: boolean) {
    let packageId = existing?.id ?? createdId.current;
    if (packageId === null || packageId === undefined) {
      const created = await ownerVaultService.createPackage(vaultId, info);
      createdId.current = created.id;
      packageId = created.id;
      setPackageCreated(true);
    } else if (existing && pending("info")) {
      if (info.name !== existing.name || info.description !== (existing.description ?? "")) {
        await ownerVaultService.updatePackage(vaultId, existing.id, {
          name: info.name,
          // Chuỗi rỗng = xóa mô tả; Backend giữ nguyên trường không gửi.
          description: info.description,
          etag: existing.etag,
        });
      }
      done.current.push("info");
    }
    // Gắn trước rồi mới gỡ: đổi mục này lấy mục khác không làm gói mất trạng thái Sẵn sàng giữa chừng.
    for (const id of assetIds) {
      if (!originalAssetIds.includes(id) && pending(`a+${id}`)) {
        await ownerVaultService.changeMember(vaultId, packageId, "assets", id, true);
        done.current.push(`a+${id}`);
      }
    }
    for (const id of beneficiaryIds) {
      if (!originalBeneficiaryIds.includes(id) && pending(`p+${id}`)) {
        await ownerVaultService.changeMember(vaultId, packageId, "beneficiaries", id, true);
        done.current.push(`p+${id}`);
      }
    }
    for (const id of originalAssetIds) {
      if (!assetIds.includes(id) && pending(`a-${id}`)) {
        await ownerVaultService.changeMember(vaultId, packageId, "assets", id, false, confirmed);
        done.current.push(`a-${id}`);
      }
    }
    for (const id of originalBeneficiaryIds) {
      if (!beneficiaryIds.includes(id) && pending(`p-${id}`)) {
        await ownerVaultService.changeMember(
          vaultId,
          packageId,
          "beneficiaries",
          id,
          false,
          confirmed,
        );
        done.current.push(`p-${id}`);
      }
    }
  }

  async function submit(confirmed = false): Promise<void> {
    const parsed = createPackageSchema.safeParse({ name, description: description.trim() });
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Tên gói bàn giao chưa hợp lệ.");
      return;
    }
    setNameError("");
    setPanel(null);
    const saved = await action.execute(
      async () => {
        try {
          await applyChanges(
            { name: parsed.data.name, description: parsed.data.description ?? "" },
            confirmed,
          );
        } finally {
          // Gói có thể đã đổi dù một bước lỗi: luôn đọc lại để danh sách và kế hoạch khớp máy chủ.
          refreshQueries();
        }
      },
      () => undefined,
      (error) => {
        if (needsPlanConfirmation(error)) {
          action.reset();
          setPlanOperation("save");
          setPanel("plan");
        }
      },
    );
    if (saved) {
      onClose();
    }
  }

  async function deletePackage(confirmed: boolean): Promise<void> {
    if (!existing) {
      return;
    }
    setPanel(null);
    const removed = await action.execute(
      async () => {
        try {
          await ownerVaultService.removePackage(vaultId, existing.id, confirmed);
        } finally {
          refreshQueries();
        }
      },
      () => undefined,
      (error) => {
        if (needsPlanConfirmation(error)) {
          action.reset();
          setPlanOperation("delete");
          setPanel("plan");
        }
      },
    );
    if (removed) {
      onClose();
    }
  }

  let selectAllLabel = "Chọn tất cả";
  if (allSelected) {
    selectAllLabel = "Bỏ chọn tất cả";
  }

  let title = "Tạo gói bàn giao";
  let intro =
    "Chọn tài sản và người nhận ngay tại đây. Xong form này là gói dùng được luôn, không phải mở lại để gán thêm.";
  let primaryLabel = "Tạo gói";
  if (editing) {
    title = "Chỉnh sửa bàn giao";
    intro = "Đổi tên, tick thêm hoặc bỏ tick tài sản và người nhận, rồi bấm Lưu.";
    primaryLabel = "Lưu";
  }

  let panelBox: ReactNode = null;
  let footer: ReactNode;
  if (panel === "delete" && existing) {
    panelBox = (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900"
      >
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Xóa gói “{existing.name}”? Các tài sản vẫn ở lại kho nhưng gói không còn người nhận. Gói
          đã xóa không khôi phục được.
        </p>
      </div>
    );
    footer = (
      <>
        <Button type="button" variant="outline" size="lg" onClick={() => setPanel(null)}>
          Giữ lại
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={DANGER_BUTTON}
          disabled={action.pending}
          onClick={() => void deletePackage(false)}
        >
          Xóa gói
        </Button>
      </>
    );
  } else if (panel === "plan") {
    panelBox = (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
      >
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Thay đổi này làm gói Sẵn sàng cuối cùng của kế hoạch đang chạy không còn đủ điều kiện, nên
          kế hoạch sẽ quay về Nháp và lịch điểm danh dừng lại. Bạn có đồng ý không?
        </p>
      </div>
    );
    footer = (
      <>
        <Button type="button" variant="outline" size="lg" onClick={() => setPanel(null)}>
          Quay lại
        </Button>
        <Button
          type="button"
          variant="dark"
          size="lg"
          disabled={action.pending}
          onClick={() => {
            if (planOperation === "delete") {
              void deletePackage(true);
            } else {
              void submit(true);
            }
          }}
        >
          Đồng ý, tiếp tục
        </Button>
      </>
    );
  } else {
    footer = (
      <>
        {existing && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={`${DANGER_BUTTON} sm:mr-auto`}
            disabled={action.pending}
            onClick={() => setPanel("delete")}
          >
            Xóa gói bàn giao
          </Button>
        )}
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
          type="button"
          variant="dark"
          size="lg"
          disabled={action.pending || !changed}
          onClick={() => void submit()}
        >
          {primaryLabel}
        </Button>
      </>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto bg-heritage-surface sm:max-w-3xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-heritage-primary">
            {title}
          </DialogTitle>
          <DialogDescription>{intro}</DialogDescription>
        </DialogHeader>
        {/* Không bọc bằng <form>: BeneficiaryForm bên trong có form riêng, form lồng nhau sẽ làm sự kiện submit lan ra ngoài. */}
        <div className="space-y-5">
          <fieldset disabled={action.pending} className="space-y-5">
            <label className="block space-y-2 text-sm font-semibold">
              Tên gói bàn giao
              <Input
                placeholder="Ví dụ: Giấy tờ gia đình"
                value={name}
                aria-invalid={nameError !== ""}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submit();
                  }
                }}
              />
            </label>
            {nameError !== "" && (
              <p role="alert" className="text-sm text-destructive">
                {nameError}
              </p>
            )}
            {editing && (
              <label className="block space-y-2 text-sm font-semibold">
                Mô tả (không bắt buộc)
                <Textarea
                  rows={2}
                  value={description}
                  className="font-normal"
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            )}
            <div className="grid items-start gap-4 md:grid-cols-2">
              <section aria-label="Tài sản trong gói">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    Tài sản{" "}
                    <span className="font-normal text-heritage-muted">
                      · đã chọn {assetIds.length}
                    </span>
                  </h3>
                  {selectableIds.length > 0 && (
                    <button
                      type="button"
                      className="text-sm font-semibold underline underline-offset-4"
                      onClick={toggleAllAssets}
                    >
                      {selectAllLabel}
                    </button>
                  )}
                </div>
                <div className={COLUMN_BOX}>
                  <div className="p-3">
                    <input
                      type="search"
                      aria-label="Tìm tài sản"
                      placeholder="Tìm tài sản…"
                      className={SEARCH_FIELD}
                      value={assetSearch}
                      onChange={(event) => setAssetSearch(event.target.value)}
                    />
                  </div>
                  {freeTotal > 0 && (
                    <p className="bg-heritage-warning-bg px-4 py-2 text-xs font-semibold text-heritage-warning">
                      {freeTotal} tài sản chưa thuộc gói nào — xếp lên đầu
                    </p>
                  )}
                  {assetBody}
                </div>
              </section>
              <section aria-label="Người nhận trong gói">
                <h3 className="mb-2 text-sm font-semibold">
                  Người nhận{" "}
                  <span className="font-normal text-heritage-muted">
                    · đã chọn {beneficiaryIds.length}
                  </span>
                </h3>
                <div className={COLUMN_BOX}>
                  {!addingBeneficiary && (
                    <div className="p-3">
                      <input
                        type="search"
                        aria-label="Tìm người nhận"
                        placeholder="Tìm người nhận…"
                        className={SEARCH_FIELD}
                        value={beneficiarySearch}
                        onChange={(event) => setBeneficiarySearch(event.target.value)}
                      />
                    </div>
                  )}
                  {personBody}
                  {!addingBeneficiary && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t border-heritage-border px-4 py-3 text-sm font-semibold hover:bg-heritage-neutral-bg/60"
                      onClick={() => setAddingBeneficiary(true)}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Thêm người nhận mới
                    </button>
                  )}
                </div>
              </section>
            </div>
          </fieldset>
          <p
            role="status"
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${summaryStyle}`}
          >
            <Check className="size-5 shrink-0" aria-hidden="true" />
            <span>{summary}</span>
          </p>
          {panelBox}
          {action.error && (
            <div role="alert" className="space-y-1 text-sm text-destructive">
              <p>{action.error}</p>
              {packageCreated && (
                <p>Gói đã được tạo. Bấm Tạo gói lần nữa để gắn tiếp phần còn thiếu.</p>
              )}
            </div>
          )}
          <DialogFooter>{footer}</DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
