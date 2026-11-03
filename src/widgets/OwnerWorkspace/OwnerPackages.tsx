import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Plus, TriangleAlert } from "lucide-react";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { createPackageSchema } from "@/entities/package/model/package.schema";
import { privateActionError, usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { EmptyState } from "@/shared/ui/EmptyState";
import { buttonStyles, formatDate } from "@/shared/ui/heritageKit";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { needsPlanConfirmation } from "@/features/vault-management/model/planConfirmation";
import { ownerVaultKeys, useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { PackageDialog } from "./PackageDialog";

/** Số gói, tài sản và người nhận tối đa nạp một lần. */
const LIST_LIMIT = 100;
/** Số tên tài sản hiện trên thẻ gói; phần còn lại gộp thành "và N tài sản khác". */
const ASSET_CHIPS = 3;
const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6 shadow-sm";
const CHIP = "rounded-full bg-heritage-neutral-bg px-4 py-2 text-sm";

/** Đổi tên gói trong một hộp thoại nhỏ; mô tả, tài sản và người nhận giữ nguyên. */
function RenameDialog({
  vaultId,
  pkg,
  onClose,
}: {
  vaultId: string;
  pkg: PackageResponse;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [name, setName] = useState(pkg.name);
  const [error, setError] = useState("");

  async function submit(): Promise<void> {
    const parsed = createPackageSchema.safeParse({ name, description: pkg.description ?? "" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Tên gói bàn giao chưa hợp lệ.");
      return;
    }
    setError("");
    const saved = await action.execute(
      () =>
        ownerVaultService.updatePackage(vaultId, pkg.id, {
          name: parsed.data.name,
          etag: pkg.etag,
        }),
      () => {
        void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
        void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
      },
    );
    if (saved) {
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Đổi tên gói bàn giao</DialogTitle>
          <DialogDescription>
            Chỉ đổi tên; tài sản và người nhận của gói giữ nguyên.
          </DialogDescription>
        </DialogHeader>
        <label className="block space-y-2 text-sm font-semibold">
          Tên gói bàn giao
          <Input
            value={name}
            disabled={action.pending}
            aria-invalid={error !== ""}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
            }}
          />
        </label>
        {error !== "" && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
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
            type="button"
            variant="dark"
            size="lg"
            disabled={action.pending || name.trim() === pkg.name}
            onClick={() => void submit()}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Xóa gói: hỏi lại trước, rồi mới gửi. Backend báo xóa sẽ làm mất gói Sẵn sàng cuối cùng của kế hoạch đang chạy thì
 * hỏi thêm một lần về việc đưa kế hoạch về Nháp và chỉ gửi lại kèm xác nhận khi Chủ kho đồng ý.
 */
function DeleteDialog({
  vaultId,
  pkg,
  onClose,
}: {
  vaultId: string;
  pkg: PackageResponse;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [planStep, setPlanStep] = useState(false);

  async function remove(confirmed: boolean): Promise<void> {
    const removed = await action.execute(
      async () => {
        try {
          await ownerVaultService.removePackage(vaultId, pkg.id, confirmed);
        } finally {
          void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
          void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
          void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
        }
      },
      () => undefined,
      (error) => {
        if (needsPlanConfirmation(error)) {
          action.reset();
          setPlanStep(true);
        }
      },
    );
    if (removed) {
      onClose();
    }
  }

  let message = `Xóa gói “${pkg.name}”? Các tài sản vẫn ở lại kho nhưng gói không còn người nhận. Gói đã xóa không khôi phục được.`;
  let confirmLabel = "Xóa gói";
  if (planStep) {
    message =
      "Xóa gói này làm gói Sẵn sàng cuối cùng của kế hoạch đang chạy không còn đủ điều kiện, nên kế hoạch sẽ quay về Nháp và lịch điểm danh dừng lại. Bạn có đồng ý không?";
    confirmLabel = "Đồng ý, xóa gói";
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Xóa gói bàn giao</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
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
            Giữ lại
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-red-300 text-red-700 hover:bg-red-50"
            disabled={action.pending}
            onClick={() => void remove(planStep)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Person {
  id: string;
  name: string;
  last4: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/** Số ô tròn tối đa trong chồng ô tròn; người thứ năm trở đi gộp thành "+N". */
const STACK_LIMIT = 4;
const AVATAR =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft text-sm font-semibold text-heritage-on-gold ring-2 ring-heritage-surface";

/**
 * Người nhận của gói kiểu chia sẻ của Google Docs: các ô tròn chữ cái đầu xếp ĐÈ LÊN NHAU thành một chồng, kèm một ô
 * tròn dấu "+". Bấm vào chồng ô tròn thì hiện thông tin của các người nhận (tên, CCCD 4 số cuối, ngày sinh, email,
 * điện thoại) và nút "Gỡ" từng người; bấm "+" thì hiện danh sách người chưa có trong gói để thêm ngay một cú bấm.
 * Mọi thay đổi gửi thẳng lên Backend (có thể hỏi PIN), không cần mở hộp thoại.
 */
function RecipientAvatars({
  vaultId,
  pkg,
  assigned,
  candidates,
  onOpenDialog,
}: {
  vaultId: string;
  pkg: PackageResponse;
  assigned: Person[];
  candidates: Person[];
  onOpenDialog: () => void;
}) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  /** Người đang chờ Chủ kho đồng ý đưa kế hoạch về Nháp trước khi gỡ. */
  const [planAsk, setPlanAsk] = useState<string | null>(null);

  function refresh(): void {
    void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
  }

  async function add(person: Person): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await ownerVaultService.changeMember(vaultId, pkg.id, "beneficiaries", person.id, true);
    } catch (failure) {
      setError(privateActionError(failure));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  async function remove(person: Person, confirmed: boolean): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await ownerVaultService.changeMember(
        vaultId,
        pkg.id,
        "beneficiaries",
        person.id,
        false,
        confirmed,
      );
      setPlanAsk(null);
    } catch (failure) {
      if (needsPlanConfirmation(failure)) {
        setPlanAsk(person.id);
      } else {
        setError(privateActionError(failure));
      }
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const needle = search.trim().toLowerCase();
  const rows: ReactNode[] = [];
  for (const person of candidates) {
    if (needle !== "" && !`${person.name} ${person.last4}`.toLowerCase().includes(needle)) {
      continue;
    }
    rows.push(
      <li key={person.id}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void add(person)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-heritage-neutral-bg disabled:opacity-60"
        >
          <span className={AVATAR}>{initialOf(person.name)}</span>
          <span className="min-w-0 flex-1">
            <span className="block break-words font-semibold">{person.name}</span>
            <span className="block text-xs text-heritage-muted">CCCD ****{person.last4}</span>
          </span>
          <Plus className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">
            Thêm {person.name} vào {pkg.name}
          </span>
        </button>
      </li>,
    );
  }

  const circles: ReactNode[] = [];
  for (const person of assigned.slice(0, STACK_LIMIT)) {
    circles.push(
      <span key={person.id} className={AVATAR} title={person.name} aria-hidden="true">
        {initialOf(person.name)}
      </span>,
    );
  }
  if (assigned.length > STACK_LIMIT) {
    circles.push(
      <span key="more" className={`${AVATAR} bg-heritage-neutral-bg text-heritage-text`}>
        +{assigned.length - STACK_LIMIT}
      </span>,
    );
  }

  const infoRows: ReactNode[] = [];
  for (const person of assigned) {
    let removeLabel = "Gỡ";
    if (planAsk === person.id) {
      removeLabel = "Đồng ý, gỡ";
    }
    let birth = "";
    if (person.dateOfBirth !== "") {
      birth = ` · Sinh ${formatDate(person.dateOfBirth)}`;
    }
    let last4 = "";
    if (person.last4 !== "") {
      last4 = `CCCD ****${person.last4}`;
    }
    infoRows.push(
      <li
        key={person.id}
        className="flex items-start gap-3 border-b border-heritage-border py-3 last:border-b-0"
      >
        <span className={AVATAR} aria-hidden="true">
          {initialOf(person.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{person.name}</p>
          {(last4 !== "" || birth !== "") && (
            <p className="text-xs text-heritage-muted">
              {last4}
              {birth}
            </p>
          )}
          {person.email && <p className="break-all text-xs text-heritage-muted">{person.email}</p>}
          {person.phone && <p className="text-xs text-heritage-muted">{person.phone}</p>}
          {planAsk === person.id && (
            <p className="mt-2 rounded-xl bg-heritage-warning-bg px-3 py-2 text-xs text-heritage-warning">
              Gỡ người này làm gói Sẵn sàng cuối cùng của kế hoạch đang chạy không còn đủ điều kiện,
              nên kế hoạch sẽ quay về Nháp. Bạn có đồng ý không?
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-red-300 text-red-700 hover:bg-red-50"
          aria-label={`${removeLabel} ${person.name} khỏi ${pkg.name}`}
          disabled={busy}
          onClick={() => void remove(person, planAsk === person.id)}
        >
          {removeLabel}
        </Button>
      </li>,
    );
  }

  // Dấu + nằm trong cùng chồng với các ô tròn: đè lên ô tròn cuối (nằm sau trong DOM nên được vẽ phía trên).
  let plusOverlap = "";
  if (assigned.length > 0) {
    plusOverlap = "-ml-3";
  }
  return (
    <div className="mt-3 flex items-center">
      {assigned.length > 0 && (
        <Popover onOpenChange={() => setPlanAsk(null)}>
          <PopoverTrigger
            aria-label={`Xem thông tin ${assigned.length} người nhận của ${pkg.name}`}
            className="flex cursor-pointer items-center -space-x-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            {circles}
          </PopoverTrigger>
          <PopoverContent className="w-96">
            <h4 className="text-base font-semibold">Người nhận của {pkg.name}</h4>
            <ul className="mt-2 max-h-72 overflow-y-auto">{infoRows}</ul>
            {error !== "" && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {error}
              </p>
            )}
          </PopoverContent>
        </Popover>
      )}
      <Popover
        onOpenChange={() => {
          setSearch("");
          setError("");
        }}
      >
        <PopoverTrigger
          aria-label={`Thêm người nhận vào ${pkg.name}`}
          title="Thêm người nhận"
          className={`relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-heritage-border bg-heritage-surface ring-2 ring-heritage-surface hover:bg-heritage-neutral-bg ${plusOverlap}`}
        >
          <Plus className="size-5" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <h4 className="text-base font-semibold">Thêm người nhận</h4>
          {candidates.length > 0 && (
            <input
              type="search"
              aria-label="Tìm người nhận để thêm"
              placeholder="Tìm người nhận…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-3 w-full rounded-xl border border-heritage-border bg-heritage-surface px-3 py-2 text-sm"
            />
          )}
          {candidates.length === 0 && (
            <p className="mt-2 text-xs text-heritage-muted">
              Mọi người nhận đã có trong gói này. Cần thêm người mới thì bấm nút bên dưới.
            </p>
          )}
          {candidates.length > 0 && rows.length === 0 && (
            <p className="mt-2 text-xs text-heritage-muted">Không có ai khớp.</p>
          )}
          {rows.length > 0 && <ul className="mt-2 max-h-56 overflow-y-auto">{rows}</ul>}
          {error !== "" && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {error}
            </p>
          )}
          <button
            type="button"
            className="mt-3 flex w-full items-center gap-2 border-t border-heritage-border pt-3 text-sm font-semibold underline-offset-4 hover:underline"
            onClick={onOpenDialog}
          >
            <Plus className="size-4" aria-hidden="true" />
            Thêm người nhận mới…
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface PackageCardProps {
  pkg: PackageResponse;
  assetNames: string[];
  vaultId: string;
  people: Person[];
  candidates: Person[];
  onRename: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Thẻ một gói: tên, trạng thái, việc còn thiếu (kèm nút làm tiếp), các tài sản và người nhận. */
function PackageCard({
  pkg,
  assetNames,
  vaultId,
  people,
  candidates,
  onRename,
  onEdit,
  onDelete,
}: PackageCardProps) {
  const ready = pkg.status === "READY";
  const assetCount = pkg.assetIds.length;
  const personCount = pkg.beneficiaryIds.length;

  let statusChip: ReactNode = (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
      Chưa sẵn sàng
    </span>
  );
  if (ready) {
    statusChip = (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-semibold text-green-800">
        <Check className="size-4" aria-hidden="true" />
        Sẵn sàng
      </span>
    );
  }

  let hint: ReactNode = null;
  if (assetCount === 0 && personCount === 0) {
    hint = (
      <>
        Gói này còn trống. Cần <strong>tài sản</strong> và <strong>người nhận</strong>.
      </>
    );
  } else if (personCount === 0) {
    hint = (
      <>
        Còn thiếu <strong>người nhận</strong>. Gói đã có tài sản, chỉ cần chọn ai sẽ nhận là xong.
      </>
    );
  } else if (assetCount === 0) {
    hint = (
      <>
        Còn thiếu <strong>tài sản</strong>. Gói đã có người nhận, chỉ cần thêm tài sản là xong.
      </>
    );
  }

  const assetChips: ReactNode[] = [];
  for (const name of assetNames.slice(0, ASSET_CHIPS)) {
    assetChips.push(
      <span key={name} className={CHIP}>
        {name}
      </span>,
    );
  }
  if (assetCount > ASSET_CHIPS) {
    assetChips.push(
      <span key="more" className={`${CHIP} text-heritage-muted`}>
        và {assetCount - ASSET_CHIPS} tài sản khác
      </span>,
    );
  }

  return (
    <section aria-label={pkg.name} className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-medium text-heritage-primary">{pkg.name}</h2>
          {statusChip}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label={`Sửa ${pkg.name}`}
            onClick={onEdit}
          >
            Sửa
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label={`Đổi tên ${pkg.name}`}
            onClick={onRename}
          >
            Đổi tên
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-red-300 text-red-700 hover:bg-red-50"
            aria-label={`Xóa ${pkg.name}`}
            onClick={onDelete}
          >
            Xóa
          </Button>
        </div>
      </div>
      {hint && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-heritage-warning-bg/70 px-4 py-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900"
            aria-hidden="true"
          >
            <TriangleAlert className="size-4" />
          </span>
          <p className="min-w-0 flex-1 text-sm">{hint}</p>
          <div className="flex flex-wrap gap-2">
            {assetCount === 0 && (
              <Button type="button" variant="outline" size="lg" onClick={onEdit}>
                Thêm tài sản
              </Button>
            )}
            {personCount === 0 && (
              <Button type="button" variant="dark" size="lg" onClick={onEdit}>
                Chọn người nhận
              </Button>
            )}
          </div>
        </div>
      )}
      {(assetCount > 0 || personCount > 0) && (
        <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
          <div>
            <h3 className="text-sm font-semibold text-heritage-muted">
              {assetCount} tài sản trong gói
            </h3>
            {assetCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {assetChips}
                <Link
                  to={`${ROUTES.DASHBOARD.ASSETS}?package=${pkg.id}`}
                  className="ml-2 text-sm font-semibold underline underline-offset-4"
                >
                  Mở màn Tài sản, lọc sẵn {pkg.name}
                </Link>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-heritage-muted">Người nhận</h3>
            {personCount === 0 && (
              <p className="mt-3 text-sm font-semibold text-amber-700">Chưa có ai</p>
            )}
            <RecipientAvatars
              vaultId={vaultId}
              pkg={pkg}
              assigned={people}
              candidates={candidates}
              onOpenDialog={onEdit}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Màn Gói bàn giao (thiết kế "Gói bàn giao"): mỗi gói một thẻ kèm trạng thái, việc còn thiếu và nút làm tiếp.
 * Mỗi thẻ có ba nút: Sửa (hộp thoại tick chọn tài sản và người nhận, PackageDialog), Đổi tên (hộp thoại nhỏ) và Xóa
 * (hỏi lại rồi mới xóa). Tạo gói cũng mở PackageDialog.
 */
export function OwnerPackages({ vaultId }: { vaultId: string }) {
  const packages = useOwnerPackages(vaultId, true, { pageIndex: 1, pageSize: LIST_LIMIT });
  const assets = useVaultAssets(vaultId, { pageIndex: 1, pageSize: LIST_LIMIT });
  const beneficiaries = useBeneficiaries(vaultId, { pageIndex: 1, pageSize: LIST_LIMIT });
  const planSetup = usePlanSetup(vaultId);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PackageResponse | null>(null);
  const [renaming, setRenaming] = useState<PackageResponse | null>(null);
  const [deleting, setDeleting] = useState<PackageResponse | null>(null);

  const assetName: Record<string, string> = {};
  if (assets.data) {
    for (const item of assets.data.items) {
      assetName[item.id] = item.name;
    }
  }
  const directory: Person[] = [];
  const personName: Record<string, Person> = {};
  if (beneficiaries.data) {
    for (const person of beneficiaries.data.items) {
      const entry: Person = {
        id: person.id,
        name: person.fullName,
        last4: person.citizenIdLast4,
        dateOfBirth: person.dateOfBirth,
        email: person.email,
        phone: person.phone,
      };
      directory.push(entry);
      personName[person.id] = entry;
    }
  }

  let body: ReactNode;
  if (packages.isPending) {
    body = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải danh sách gói bàn giao…
      </p>
    );
  } else if (packages.isError) {
    body = (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được danh sách gói bàn giao.</p>
        <Button
          variant="outline"
          disabled={packages.isFetching}
          onClick={() => void packages.refetch()}
        >
          Thử lại
        </Button>
      </div>
    );
  } else if (packages.data.items.length === 0) {
    body = (
      <div role="status" className={CARD}>
        <EmptyState
          title="Bạn chưa có gói bàn giao nào"
          description="Gói bàn giao gom các tài sản có cùng người nhận. Tạo gói, tick tài sản và người nhận là xong."
        />
        <div className="mt-4 flex justify-center">
          <Button size="lg" variant="dark" onClick={() => setCreating(true)}>
            Tạo gói bàn giao đầu tiên
          </Button>
        </div>
      </div>
    );
  } else {
    const cards: ReactNode[] = [];
    for (const pkg of packages.data.items) {
      const names: string[] = [];
      for (const id of pkg.assetIds) {
        if (Object.hasOwn(assetName, id)) {
          names.push(assetName[id]);
        }
      }
      const people: Person[] = [];
      for (const id of pkg.beneficiaryIds) {
        let entry: Person = {
          id,
          name: "Người nhận",
          last4: "",
          dateOfBirth: "",
          email: null,
          phone: null,
        };
        if (Object.hasOwn(personName, id)) {
          entry = personName[id];
        }
        people.push(entry);
      }
      const candidates = directory.filter((person) => !pkg.beneficiaryIds.includes(person.id));
      cards.push(
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          assetNames={names}
          vaultId={vaultId}
          people={people}
          candidates={candidates}
          onRename={() => setRenaming(pkg)}
          onEdit={() => setEditing(pkg)}
          onDelete={() => setDeleting(pkg)}
        />,
      );
    }
    body = <div className="space-y-5">{cards}</div>;
  }

  const planIsDraft = planSetup.data !== undefined && planSetup.data.planStatus === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl rounded-2xl border border-heritage-border bg-heritage-surface px-5 py-4 text-sm leading-6">
          Một gói gom các tài sản có cùng người nhận. Gói chuyển sang <strong>sẵn sàng</strong> khi
          có ít nhất một tài sản và một người nhận. Kế hoạch bàn giao cần ít nhất một gói sẵn sàng
          mới kích hoạt được.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {planIsDraft && (
            <Link to={`${ROUTES.SETUP}?step=activate`} className={buttonStyles.outline}>
              Kích hoạt kế hoạch
            </Link>
          )}
          <Button size="lg" variant="dark" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Tạo gói bàn giao
          </Button>
        </div>
      </div>
      {body}
      {packages.data && packages.data.hasNextPage && (
        <p role="status" className="text-xs text-heritage-muted">
          Đang hiện {LIST_LIMIT} gói đầu tiên.
        </p>
      )}
      {creating && <PackageDialog vaultId={vaultId} onClose={() => setCreating(false)} />}
      {editing && (
        <PackageDialog
          key={editing.id}
          vaultId={vaultId}
          existing={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          key={deleting.id}
          vaultId={vaultId}
          pkg={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
      {renaming && (
        <RenameDialog
          key={renaming.id}
          vaultId={vaultId}
          pkg={renaming}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}
