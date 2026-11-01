import { useDeferredValue, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, FolderOpen, Lock, Search } from "lucide-react";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
import { ROUTES } from "@/shared/config/routes.config";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Chip, formatDate, Panel } from "@/shared/ui/heritageKit";
import { useVaultAssets } from "../model/useVaultAssets";
import { useVaultPinUnlock } from "../model/useVaultPinUnlock";

export { REVEAL_DURATION_MS } from "../model/pinUnlock";

const PAGE_SIZE = 10;

const MASK = "••••••";

type KindFilter = "ALL" | "FILE" | "TEXT";

const tabs: Array<{ value: KindFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "FILE", label: "Tệp tải lên" },
  { value: "TEXT", label: "Ghi chú bí mật" },
];

const kindLabels = { FILE: "Tệp tải lên", TEXT: "Ghi chú bí mật" } as const;

/**
 * Danh sách mục trong kho (thiết kế "Kho của tôi"): tìm theo tên (Backend), lọc theo loại trong trang
 * đang xem, mở trang chi tiết để sửa. Chỉ metadata; nội dung không bao giờ nằm trong danh sách.
 *
 * Mặc định che tên, loại, dung lượng, ngày của mọi mục (chống nhìn trộm màn hình). Bấm con mắt thì hỏi mã PIN kho
 * (`confirmPin`), đúng mới hiện. Tự che lại khi bấm con mắt lần nữa, chuyển tab, rời trang hoặc sau
 * REVEAL_DURATION_MS. Đang che thì khóa lọc, tìm kiếm và lối mở chi tiết vì các thao tác đó cũng lộ thông tin.
 * Lần mở khóa dùng chung với trang chi tiết (useVaultPinUnlock), nên vào chi tiết không bị hỏi PIN lại.
 * Đây là che trên giao diện; Backend vẫn trả danh sách như cũ.
 */
export function AssetList({
  vaultId,
  confirmPin,
}: {
  vaultId: string;
  /** Hỏi và kiểm mã PIN kho; widget nối hộp thoại PIN với API kiểm PIN. */
  confirmPin: () => Promise<VaultPinConfirmation>;
}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const gate = useVaultPinUnlock(vaultId, confirmPin);
  const revealed = gate.unlocked;
  const hide = () => {
    gate.lock();
    setSearch("");
    setKind("ALL");
  };
  // Tự che lại (hết giờ, chuyển tab) thì bỏ tìm kiếm và lọc đang có, vì chúng cũng lộ thông tin.
  const activeSearch = revealed ? search : "";
  const activeKind: KindFilter = revealed ? kind : "ALL";
  const searchTerm = useDeferredValue(activeSearch.trim());
  const requested = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested >= 1 && requested <= 1_000_000 ? requested : 1;
  const query = useVaultAssets(vaultId, {
    pageIndex: page,
    pageSize: PAGE_SIZE,
    ...(searchTerm ? { searchTerm } : {}),
  });
  const setPage = (value: number) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("page", String(value));
      return next;
    });
  const data = query.data;
  const items = data
    ? data.items.filter((item) => activeKind === "ALL" || item.kind === activeKind)
    : [];
  return (
    <Panel
      title="Danh sách mục"
      labelledBy="asset-list-title"
      action={
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-sm font-semibold text-[#7A5B25]">{data.totalCount} mục</span>
          )}
          <button
            type="button"
            aria-pressed={revealed}
            aria-label={revealed ? "Ẩn thông tin các mục" : "Hiện thông tin các mục"}
            title={revealed ? "Ẩn thông tin" : "Hiện thông tin (cần mã PIN)"}
            disabled={gate.pending}
            onClick={revealed ? hide : () => gate.request()}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#BDB8A6] text-[#0A281E] transition-colors hover:bg-[#F4F1E6] disabled:opacity-50"
          >
            {revealed ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      }
    >
      {gate.error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {gate.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo loại">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={activeKind === tab.value}
            disabled={!revealed}
            onClick={() => setKind(tab.value)}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              activeKind === tab.value
                ? "border-[#0A281E] bg-[#0A281E] text-white"
                : "border-[#BDB8A6] bg-transparent text-[#0A281E] hover:bg-[#F4F1E6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <label className="relative mt-4 block max-w-md">
        <span className="sr-only">Tìm theo tên mục</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={activeSearch}
          maxLength={200}
          disabled={!revealed}
          placeholder={revealed ? "Tìm theo tên mục" : "Bấm con mắt để tìm theo tên mục"}
          onChange={(event) => {
            setSearch(event.target.value);
            if (page !== 1) setPage(1);
          }}
          className="h-12 w-full rounded-xl border border-[#BDB8A6] bg-white pl-11 pr-4 text-sm disabled:cursor-not-allowed disabled:bg-[#F4F1E6]"
        />
      </label>
      <div className="mt-4">
        {query.isPending ? (
          <p role="status" className="py-8 text-sm text-heritage-muted">
            Đang tải danh sách…
          </p>
        ) : query.isError ? (
          <div role="alert" className="space-y-3 rounded-xl bg-[#F8E1DE] p-5">
            <p className="text-sm text-[#7A1A14]">Không tải được dữ liệu. Vui lòng thử lại.</p>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div
            role="status"
            className="rounded-xl border border-dashed border-heritage-border px-6 py-10 text-center"
          >
            <FolderOpen className="mx-auto mb-3 size-8 text-heritage-gold" aria-hidden="true" />
            <h3 className="font-semibold">
              {searchTerm
                ? "Không có mục khớp tên bạn tìm"
                : page === 1 && activeKind === "ALL"
                  ? "Chưa có nội dung"
                  : "Không có mục nào ở đây"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-heritage-muted">
              {searchTerm
                ? "Thử một tên khác hoặc xóa ô tìm kiếm."
                : "Mục bạn thêm vào kho sẽ hiện ở đây."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Các mục trong kho</caption>
              <thead>
                <tr className="border-b border-heritage-border text-xs text-heritage-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Tên mục
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Loại
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Dung lượng
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Cập nhật
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right font-semibold">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border">
                {items.map((item) =>
                  revealed ? (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <Link
                          to={ROUTES.DASHBOARD.ASSET_DETAIL(item.id)}
                          className="inline-flex items-center gap-2 font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-heritage-gold"
                        >
                          <Lock className="size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                          <span className="break-words">{item.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Chip tone="neutral">{kindLabels[item.kind]}</Chip>
                      </td>
                      <td className="px-4 py-4 text-heritage-muted">
                        {formatStorageSize(item.sizeBytes)}
                      </td>
                      <td className="px-4 py-4 text-heritage-muted">
                        {formatDate(item.updatedAt ?? item.createdAt)}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        {/* edit=1: trang chi tiết hỏi mã PIN ngay khi mở, đúng PIN mới hiện form sửa. */}
                        <Link
                          to={`${ROUTES.DASHBOARD.ASSET_DETAIL(item.id)}?edit=1`}
                          aria-label={`Sửa ${item.name}`}
                          className="font-semibold text-[#7A5B25] hover:underline focus-visible:outline-2 focus-visible:outline-heritage-gold"
                        >
                          Sửa
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    // Đang che: không đưa tên vào cả nhãn trợ năng, không cho mở chi tiết.
                    <tr key={item.id} aria-label="Mục đang ẩn">
                      <td className="py-4 pr-4 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Lock className="size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                          {MASK}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Chip tone="neutral">{MASK}</Chip>
                      </td>
                      <td className="px-4 py-4 text-heritage-muted">{MASK}</td>
                      <td className="px-4 py-4 text-heritage-muted">{MASK}</td>
                      <td className="py-4 pl-4" />
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && (page > 1 || data.totalCount > PAGE_SIZE) && (
        <nav aria-label="Phân trang" className="mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Trang trước
          </button>
          <span className="text-sm">Trang {page}</span>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={page * PAGE_SIZE >= data.totalCount || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </button>
        </nav>
      )}
    </Panel>
  );
}
