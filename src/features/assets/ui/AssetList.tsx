import { useDeferredValue, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FolderOpen, Lock, Search } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip, formatDate, Panel } from "@/shared/ui/heritageKit";
import { useVaultAssets } from "../model/useVaultAssets";

const PAGE_SIZE = 10;

type KindFilter = "ALL" | "FILE" | "TEXT";

const tabs: Array<{ value: KindFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "FILE", label: "Tệp" },
  { value: "TEXT", label: "Văn bản" },
];

const kindLabels = { FILE: "Tệp", TEXT: "Văn bản" } as const;

/**
 * Danh sách mục trong kho (thiết kế "Kho của tôi"): tìm theo tên (Backend), lọc theo loại trong trang
 * đang xem, mở trang chi tiết để sửa. Chỉ metadata; nội dung không bao giờ nằm trong danh sách.
 */
export function AssetList({ vaultId }: { vaultId: string }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const searchTerm = useDeferredValue(search.trim());
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
  const items = data ? data.items.filter((item) => kind === "ALL" || item.kind === kind) : [];
  return (
    <Panel
      title="Danh sách mục"
      labelledBy="asset-list-title"
      action={
        data && <span className="text-sm font-semibold text-[#7A5B25]">{data.totalCount} mục</span>
      }
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo loại">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={kind === tab.value}
            onClick={() => setKind(tab.value)}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
              kind === tab.value
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
          value={search}
          maxLength={200}
          placeholder="Tìm theo tên mục"
          onChange={(event) => {
            setSearch(event.target.value);
            if (page !== 1) setPage(1);
          }}
          className="h-12 w-full rounded-xl border border-[#BDB8A6] bg-white pl-11 pr-4 text-sm"
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
                : page === 1 && kind === "ALL"
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
            <table className="w-full min-w-[480px] text-left text-sm">
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
                    Cập nhật
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right font-semibold">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border">
                {items.map((item) => (
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
                      {formatDate(item.updatedAt ?? item.createdAt)}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <Link
                        to={ROUTES.DASHBOARD.ASSET_DETAIL(item.id)}
                        aria-label={`Sửa ${item.name}`}
                        className="font-semibold text-[#7A5B25] hover:underline focus-visible:outline-2 focus-visible:outline-heritage-gold"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))}
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
