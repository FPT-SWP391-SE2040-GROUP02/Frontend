import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, FileText, FolderOpen, Lock, TriangleAlert } from "lucide-react";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, formatDate, Notice } from "@/shared/ui/heritageKit";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useVaultAssets } from "../model/useVaultAssets";
import { useVaultPinUnlock } from "../model/useVaultPinUnlock";

export { REVEAL_DURATION_MS } from "../model/pinUnlock";

/** Tối đa tài sản nạp một lần: lọc, đếm và chia trang đều làm trên danh sách này. */
const LOAD_LIMIT = 100;
const PAGE_SIZE = 10;
const MASK = "••••••";
const UNASSIGNED = "none";
const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const DARK_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-heritage-sidebar px-5 text-sm font-semibold text-white hover:bg-heritage-sidebar/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-heritage-gold";

type KindFilter = "ALL" | "FILE" | "TEXT";

const kindTabs: Array<{ value: KindFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "FILE", label: "Tệp tải lên" },
  { value: "TEXT", label: "Ghi chú bí mật" },
];
const kindLabels = { FILE: "Tệp tải lên", TEXT: "Ghi chú bí mật" } as const;

/** Ô chọn lọc: đang lọc (khác "tất cả") thì tô đậm để thấy ngay bộ lọc nào đang bật. */
function filterSelectStyle(active: boolean): string {
  let style = "border-heritage-border bg-heritage-surface text-heritage-text";
  if (active) {
    style = "border-heritage-sidebar bg-heritage-sidebar text-white";
  }
  return `min-h-12 max-w-full rounded-xl border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${style}`;
}

/** Gói bàn giao do trang cha truyền vào (feature này không import feature khác). */
export interface AssetPackageOption {
  id: string;
  name: string;
  assetIds: string[];
}

/**
 * Màn Tài sản (thiết kế "Tài sản"): tìm theo tên, lọc theo gói bàn giao và loại, đổi gói ngay trên từng dòng hoặc gán
 * nhiều dòng cùng lúc. Chỉ metadata; nội dung không bao giờ nằm trong danh sách.
 *
 * Mặc định che tên, loại, ngày của mọi mục (chống nhìn trộm màn hình). Bấm "Hiện thông tin" thì hỏi mã PIN kho
 * (`confirmPin`), đúng mới hiện; tự che lại khi chuyển tab, rời trang hoặc hết REVEAL_DURATION_MS.
 * Đang che thì khóa tìm kiếm, lọc, chọn dòng, đổi gói và lối mở chi tiết vì các thao tác đó cũng lộ thông tin.
 * Lần mở khóa dùng chung với trang chi tiết (useVaultPinUnlock), nên vào chi tiết không bị hỏi PIN lại.
 * Đây là che trên giao diện; Backend vẫn trả danh sách như cũ.
 *
 * Gói bàn giao và việc đổi gói do trang cha lo (`packages`, `onMove`): một tài sản chỉ nằm trong một gói.
 */
export function AssetList({
  vaultId,
  confirmPin,
  packages,
  onMove,
  packagesHref,
  toolbarAction,
}: {
  vaultId: string;
  /** Hỏi và kiểm mã PIN kho; widget nối hộp thoại PIN với API kiểm PIN. */
  confirmPin: () => Promise<VaultPinConfirmation>;
  packages: AssetPackageOption[];
  /** Đổi gói cho các tài sản (null = bỏ khỏi gói). Trả câu lỗi để hiện, hoặc null khi xong. */
  onMove: (assetIds: string[], packageId: string | null) => Promise<string | null>;
  /** Lối sang màn Gói bàn giao, dùng cho nút đầu trang và dòng nhắc cuối bảng. */
  packagesHref: string;
  /** Nút do trang cha truyền vào (ví dụ "Thêm tài sản"), đặt ở góc phải đầu trang. */
  toolbarAction?: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTarget, setBulkTarget] = useState("");
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const gate = useVaultPinUnlock(vaultId, confirmPin);
  const revealed = gate.unlocked;
  const query = useVaultAssets(vaultId, { pageIndex: 1, pageSize: LOAD_LIMIT });

  const hide = () => {
    gate.lock();
    setSearch("");
    setKind("ALL");
    setSelected([]);
  };

  // Tự che lại (hết giờ, chuyển tab) thì bỏ tìm kiếm, lọc và lựa chọn đang có, vì chúng cũng lộ thông tin.
  const activeSearch = revealed ? search.trim().toLowerCase() : "";
  const activeKind: KindFilter = revealed ? kind : "ALL";
  let activePackage = "";
  if (revealed) {
    activePackage = params.get("package") ?? "";
  }
  const requested = Number(params.get("page") ?? 1);
  const requestedPage = Number.isSafeInteger(requested) && requested >= 1 ? requested : 1;

  const packageOfAsset: Record<string, string> = {};
  for (const item of packages) {
    for (const assetId of item.assetIds) {
      packageOfAsset[assetId] = item.id;
    }
  }

  const all = query.data ? query.data.items : [];
  let unassignedCount = 0;
  const perPackage: Record<string, number> = {};
  const perKind = { ALL: all.length, FILE: 0, TEXT: 0 };
  for (const item of all) {
    perKind[item.kind] = perKind[item.kind] + 1;
    if (Object.hasOwn(packageOfAsset, item.id)) {
      const packageId = packageOfAsset[item.id];
      perPackage[packageId] = (perPackage[packageId] ?? 0) + 1;
    } else {
      unassignedCount = unassignedCount + 1;
    }
  }

  const filtered = all.filter((item) => {
    if (activeKind !== "ALL" && item.kind !== activeKind) {
      return false;
    }
    if (activeSearch !== "" && !item.name.toLowerCase().includes(activeSearch)) {
      return false;
    }
    const inPackage = Object.hasOwn(packageOfAsset, item.id);
    if (activePackage === UNASSIGNED) {
      return !inPackage;
    }
    if (activePackage !== "") {
      return inPackage && packageOfAsset[item.id] === activePackage;
    }
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function setParam(key: string, value: string): void {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        if (key !== "page") {
          next.delete("page");
        }
        return next;
      },
      { replace: true },
    );
  }

  async function move(assetIds: string[], packageId: string | null): Promise<void> {
    setMoving(true);
    setMoveError("");
    const failure = await onMove(assetIds, packageId);
    setMoving(false);
    if (failure !== null) {
      setMoveError(failure);
      return;
    }
    setSelected((current) => current.filter((id) => !assetIds.includes(id)));
    setBulkTarget("");
  }

  const pageIds = rows.map((item) => item.id);
  let allOnPageSelected = pageIds.length > 0;
  for (const id of pageIds) {
    if (!selected.includes(id)) {
      allOnPageSelected = false;
    }
  }
  function togglePage(): void {
    if (allOnPageSelected) {
      setSelected(selected.filter((id) => !pageIds.includes(id)));
      return;
    }
    const next = [...selected];
    for (const id of pageIds) {
      if (!next.includes(id)) {
        next.push(id);
      }
    }
    setSelected(next);
  }
  function toggleOne(id: string): void {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  }

  const packageOptions: ReactNode[] = [];
  for (const item of packages) {
    packageOptions.push(
      <option key={item.id} value={item.id}>
        {item.name}
      </option>,
    );
  }

  const packageFilterOptions: ReactNode[] = [];
  for (const item of packages) {
    packageFilterOptions.push(
      <option key={item.id} value={item.id}>
        {item.name} ({perPackage[item.id] ?? 0})
      </option>,
    );
  }
  const kindFilterOptions: ReactNode[] = [];
  for (const tab of kindTabs) {
    let label = `Loại: ${tab.label.toLowerCase()} (${perKind[tab.value]})`;
    if (tab.value !== "ALL") {
      label = `${tab.label} (${perKind[tab.value]})`;
    }
    kindFilterOptions.push(
      <option key={tab.value} value={tab.value}>
        {label}
      </option>,
    );
  }

  const bodyRows: ReactNode[] = [];
  for (const item of rows) {
    const packageId = packageOfAsset[item.id] ?? "";
    let rowStyle = "";
    if (packageId === "") {
      rowStyle = "bg-amber-50/70";
    }
    let nameCell: ReactNode = (
      <span className="inline-flex items-center gap-2 font-semibold">
        <Lock className="size-3.5 shrink-0 text-heritage-success" aria-hidden="true" />
        {MASK}
      </span>
    );
    let kindCell: ReactNode = MASK;
    let dateCell: ReactNode = MASK;
    let packageCell: ReactNode = MASK;
    if (revealed) {
      nameCell = (
        <Link
          to={ROUTES.DASHBOARD.ASSET_DETAIL(item.id)}
          className="inline-flex items-center gap-2 font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-heritage-gold"
        >
          <Lock className="size-3.5 shrink-0 text-heritage-success" aria-hidden="true" />
          <span className="break-words">{item.name}</span>
        </Link>
      );
      kindCell = kindLabels[item.kind];
      dateCell = formatDate(item.updatedAt ?? item.createdAt);
      let selectStyle = "border-amber-300 bg-amber-100 text-amber-900";
      if (packageId !== "") {
        selectStyle = "border-green-200 bg-green-100 text-green-900";
      }
      packageCell = (
        <select
          aria-label={`Gói bàn giao của ${item.name}`}
          value={packageId}
          disabled={moving}
          onChange={(event) => {
            const value = event.target.value;
            let target: string | null = value;
            if (value === "") {
              target = null;
            }
            void move([item.id], target);
          }}
          className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${selectStyle}`}
        >
          <option value="">— Chưa gán —</option>
          {packageOptions}
        </select>
      );
    }
    bodyRows.push(
      <tr
        key={item.id}
        aria-label={revealed ? undefined : "Mục đang ẩn"}
        className={`border-b border-heritage-border last:border-b-0 ${rowStyle}`}
      >
        <td className="w-10 py-3 pl-3">
          <input
            type="checkbox"
            aria-label={`Chọn ${revealed ? item.name : "mục đang ẩn"}`}
            className="size-5 accent-heritage-sidebar"
            disabled={!revealed}
            checked={selected.includes(item.id)}
            onChange={() => toggleOne(item.id)}
          />
        </td>
        <td className="px-4 py-3">{nameCell}</td>
        <td className="px-4 py-3 text-heritage-muted">{kindCell}</td>
        <td className="px-4 py-3">{packageCell}</td>
        <td className="px-4 py-3 text-right text-heritage-muted">{dateCell}</td>
      </tr>,
    );
  }

  let content: ReactNode;
  if (query.isPending) {
    content = (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải danh sách…
      </p>
    );
  } else if (query.isError) {
    content = (
      <Notice
        tone="danger"
        role="alert"
        title="Không tải được dữ liệu"
        action={
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </button>
        }
      >
        Vui lòng thử lại.
      </Notice>
    );
  } else if (filtered.length === 0) {
    let title = "Không có mục nào ở đây";
    let description = "Thử bỏ bớt bộ lọc hoặc xóa ô tìm kiếm.";
    if (all.length === 0) {
      title = "Chưa có nội dung";
      description = "Mục bạn thêm vào kho sẽ hiện ở đây.";
    }
    content = (
      <div role="status">
        <EmptyState icon={FolderOpen} title={title} description={description} />
      </div>
    );
  } else {
    content = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Các mục trong kho</caption>
          <thead>
            <tr className="bg-heritage-neutral-bg/70 text-xs font-semibold text-heritage-muted">
              <th scope="col" className="w-10 py-3 pl-3">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả mục trên trang này"
                  className="size-5 accent-heritage-sidebar"
                  disabled={!revealed}
                  checked={allOnPageSelected}
                  onChange={togglePage}
                />
              </th>
              <th scope="col" className="px-4 py-3">
                Tên tài sản
              </th>
              <th scope="col" className="px-4 py-3">
                Loại
              </th>
              <th scope="col" className="px-4 py-3">
                Gói bàn giao
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Cập nhật
              </th>
            </tr>
          </thead>
          <tbody>{bodyRows}</tbody>
        </table>
      </div>
    );
  }

  let packageHeading = "Tất cả tài sản";
  if (activePackage === UNASSIGNED) {
    packageHeading = "Tài sản chưa gán gói";
  } else if (activePackage !== "") {
    for (const item of packages) {
      if (item.id === activePackage) {
        packageHeading = `Tài sản trong ${item.name}`;
      }
    }
  }

  let toggleLabel = "Hiện thông tin";
  let toggleIcon = <Eye className="size-4" aria-hidden="true" />;
  if (revealed) {
    toggleLabel = "Ẩn thông tin";
    toggleIcon = <EyeOff className="size-4" aria-hidden="true" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={revealed}
            aria-label={revealed ? "Ẩn thông tin các mục" : "Hiện thông tin các mục"}
            title={revealed ? "Ẩn thông tin" : "Hiện thông tin (cần mã PIN)"}
            disabled={gate.pending}
            onClick={revealed ? hide : () => gate.request()}
            className={DARK_BUTTON}
          >
            {toggleIcon}
            {toggleLabel}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to={packagesHref} className={buttonStyles.outline}>
            Quản lý gói bàn giao
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          {toolbarAction}
        </div>
      </div>
      {gate.error && (
        <p role="alert" className="text-sm text-destructive">
          {gate.error}
        </p>
      )}
      <section aria-label="Tìm và lọc tài sản" className={CARD}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block min-w-56 flex-1">
            <span className="sr-only">Tìm theo tên mục</span>
            <input
              type="search"
              value={search}
              maxLength={200}
              disabled={!revealed}
              placeholder={
                revealed ? "Tìm tài sản theo tên…" : "Bấm Hiện thông tin để tìm theo tên"
              }
              onChange={(event) => {
                setSearch(event.target.value);
                setParam("page", "");
              }}
              className="h-12 w-full rounded-xl border border-heritage-border bg-heritage-surface px-4 text-sm disabled:cursor-not-allowed disabled:bg-heritage-neutral-bg"
            />
          </label>
          <select
            aria-label="Lọc theo gói bàn giao"
            value={activePackage}
            disabled={!revealed}
            onChange={(event) => setParam("package", event.target.value)}
            className={filterSelectStyle(activePackage !== "")}
          >
            <option value="">Gói bàn giao: tất cả ({all.length})</option>
            <option value={UNASSIGNED}>Chưa gán gói ({unassignedCount})</option>
            {packageFilterOptions}
          </select>
          <select
            aria-label="Lọc theo loại"
            value={activeKind}
            disabled={!revealed}
            onChange={(event) => {
              setKind(event.target.value as KindFilter);
              setParam("page", "");
            }}
            className={filterSelectStyle(activeKind !== "ALL")}
          >
            {kindFilterOptions}
          </select>
        </div>
      </section>
      <section aria-label="Danh sách mục" className={CARD}>
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-heritage-sidebar pb-3">
          <h2 className="text-xl font-medium text-heritage-primary">{packageHeading}</h2>
          {query.data && (
            <span className="text-sm text-heritage-muted">
              {query.data.totalCount} tài sản · trang {page} trên {pageCount}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-heritage-muted">
          Đổi ô <strong className="text-heritage-text">Gói bàn giao</strong> ở từng dòng để gán một
          tài sản. Muốn gán nhiều cùng lúc thì tích ô vuông bên trái.
        </p>
        {selected.length > 0 && revealed && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-heritage-neutral-bg px-4 py-3 text-sm">
            <span className="font-semibold">Đã chọn {selected.length} tài sản</span>
            <select
              aria-label="Gán các tài sản đã chọn vào gói"
              value={bulkTarget}
              disabled={moving}
              onChange={(event) => setBulkTarget(event.target.value)}
              className="min-h-10 rounded-full border border-heritage-border bg-heritage-surface px-3 text-sm"
            >
              <option value="">Chọn gói bàn giao…</option>
              <option value={UNASSIGNED}>— Bỏ khỏi gói —</option>
              {packageOptions}
            </select>
            <button
              type="button"
              className={DARK_BUTTON}
              disabled={moving || bulkTarget === ""}
              onClick={() => {
                let target: string | null = bulkTarget;
                if (bulkTarget === UNASSIGNED) {
                  target = null;
                }
                void move(selected, target);
              }}
            >
              Gán
            </button>
            <button
              type="button"
              className="font-semibold underline underline-offset-4"
              onClick={() => setSelected([])}
            >
              Bỏ chọn
            </button>
          </div>
        )}
        {moveError !== "" && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {moveError}
          </p>
        )}
        <div className="mt-4">{content}</div>
        {query.data && filtered.length > 0 && (
          <nav
            aria-label="Phân trang"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-heritage-border pt-4"
          >
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={page === 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              Trang trước
            </button>
            <span className="text-sm">
              Trang {page} trên {pageCount} · đang xem {rows.length} của {filtered.length}
            </span>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={page >= pageCount}
              onClick={() => setParam("page", String(page + 1))}
            >
              Trang sau
            </button>
          </nav>
        )}
        {unassignedCount > 0 && (
          <p className="mt-4 flex items-start gap-3 rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Tài sản chưa thuộc gói bàn giao nào sẽ không được giao cho ai, và dòng của nó có nền
              vàng nhạt. Gán gói xong, gói còn cần ít nhất một người nhận thì mới chuyển sang trạng
              thái sẵn sàng.{" "}
              <Link to={packagesHref} className="font-semibold underline underline-offset-4">
                Xem các gói và người nhận
              </Link>
            </span>
          </p>
        )}
        {query.data && query.data.totalCount > LOAD_LIMIT && (
          <p role="status" className="mt-3 flex items-center gap-2 text-xs text-heritage-muted">
            <FileText className="size-4" aria-hidden="true" />
            Đang hiện {LOAD_LIMIT} tài sản đầu tiên trong {query.data.totalCount}.
          </p>
        )}
      </section>
    </div>
  );
}
