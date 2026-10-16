import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Vault, FileText, FolderOpen, Activity } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { Button } from "@/shared/ui/button";
import {
  useOwnerVault,
  useOwnerPackages,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { CheckInActions } from "@/features/dms/ui/CheckInActions";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { CreateAssetForm } from "@/features/assets/ui/CreateAssetForm";
import { NewContainerForm } from "@/features/vault-management/ui/NewContainerForm";
import { ROUTES } from "@/shared/config/routes.config";
import { OwnerPlanSetup } from "./OwnerPlanSetup";

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface px-6 py-12 text-center"
    >
      <FolderOpen className="mx-auto mb-4 size-8 text-heritage-gold" aria-hidden="true" />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-heritage-muted">{description}</p>
    </div>
  );
}

/** Hiển thị lỗi có đường phục hồi; không chuyển lỗi API thành empty/zero. */
function QueryError({ retry, pending }: { retry: () => void; pending: boolean }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm text-red-800">Không tải được dữ liệu. Vui lòng thử lại.</p>
      <Button variant="outline" disabled={pending} onClick={retry} className="mt-4 min-h-11">
        Thử lại
      </Button>
    </div>
  );
}

function ResourceList({ vaultId, section }: { vaultId: string; section: "assets" | "plans" }) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested >= 1 && requested <= 1_000_000 ? requested : 1;
  const assets = useVaultAssets(section === "assets" ? vaultId : "", {
    pageIndex: page,
    pageSize: 10,
  });
  const plans = useOwnerPackages(vaultId, section === "plans", { pageIndex: page, pageSize: 10 });
  const query = section === "assets" ? assets : plans;
  const data = query.data;
  const setPage = (value: number) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("page", String(value));
      return next;
    });
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải danh sách…
      </p>
    );
  if (query.isError)
    return <QueryError retry={() => void query.refetch()} pending={query.isFetching} />;
  if (!data) return null;
  const Icon = section === "assets" ? FileText : FolderOpen;
  return (
    <section aria-label={section === "assets" ? "Tài sản" : "Gói bàn giao"} className="space-y-4">
      <p className="text-sm text-heritage-muted">
        {data.totalCount} {section === "assets" ? "tài sản" : "gói bàn giao"}
      </p>
      {data.items.length === 0 ? (
        <Empty
          title={page === 1 ? "Chưa có nội dung" : "Trang này không có nội dung"}
          description="Nội dung trong kho sẽ được hiển thị tại đây khi có dữ liệu."
        />
      ) : (
        <ul className="divide-y divide-heritage-border overflow-hidden rounded-xl border border-heritage-border bg-heritage-surface">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-start gap-4 p-5">
              <div className="rounded-lg bg-heritage-primary/5 p-3 text-heritage-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-sm font-semibold">
                  {section === "plans" ? (
                    <Link
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                      to={ROUTES.WILLS.DETAIL(item.id)}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </h2>
                {item.description && (
                  <p className="mt-1 break-words text-sm text-heritage-muted">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {(page > 1 || data.totalCount > 10) && (
        <nav aria-label="Phân trang" className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm">Trang {page}</span>
          <Button
            variant="outline"
            disabled={page * 10 >= data.totalCount || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </section>
  );
}

const checkInLabels = {
  NOT_STARTED: "Chưa bắt đầu",
  ACTIVE: "Đang trong kỳ điểm danh",
  CHECKIN_OVERDUE: "Đã quá hạn điểm danh",
  AWAITING_CHECK: "Đang chờ kiểm tra",
  PAUSED: "Đang tạm dừng",
};
function CheckIn({ vaultId }: { vaultId: string }) {
  const query = useCheckIn(vaultId);
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải trạng thái điểm danh…
      </p>
    );
  if (query.isError)
    return <QueryError retry={() => void query.refetch()} pending={query.isFetching} />;
  if (!query.data) return null;
  const data = query.data;
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(value),
        )
      : "Chưa có";
  return (
    <section className="space-y-6 rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <Activity className="size-7 text-heritage-gold" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{checkInLabels[data.status]}</h2>
      <dl className="grid gap-6 sm:grid-cols-2">
        {[
          ["Lần điểm danh gần nhất", date(data.lastCheckInAt)],
          ["Hạn điểm danh tiếp theo", date(data.nextCheckInDueAt)],
          ["Chu kỳ", `${data.settings.cycleDays} ngày`],
          ["Thời gian ân hạn", `${data.settings.graceDays} ngày`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-heritage-muted">{label}</dt>
            <dd className="mt-2 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <CheckInActions key={data.settings.etag} vaultId={vaultId} status={data} />
    </section>
  );
}

/** Chỉ đọc DTO đã được tích hợp; chờ kho thật trước khi mount các truy vấn phụ thuộc. */
export function OwnerSection({ section }: { section: "assets" | "plans" | "check-in" }) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  if (vault.isError && isOwnerVaultMissing(vault.error))
    return (
      <div className="space-y-6">
        <Empty
          title="Bạn chưa có kho di sản"
          description="Kho giúp bạn sắp xếp tài sản, người nhận và kế hoạch bàn giao."
        />
        <CreateVaultForm />
      </div>
    );
  if (vault.isError)
    return <QueryError retry={() => void vault.refetch()} pending={vault.isFetching} />;
  if (!authenticated) return <p role="status">Vui lòng đăng nhập để xem kho.</p>;
  if (vault.isPending)
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-heritage-border p-6 text-sm text-heritage-muted"
      >
        <Vault className="size-5" aria-hidden="true" />
        Đang tải kho của bạn…
      </div>
    );
  if (section === "check-in") return <CheckIn vaultId={vault.data.id} />;
  return (
    <div className="space-y-6">
      {section === "plans" && <OwnerPlanSetup vaultId={vault.data.id} />}
      {section === "assets" ? (
        <CreateAssetForm
          vaultId={vault.data.id}
          remainingBytes={vault.data.storageRemainingBytes}
        />
      ) : (
        <NewContainerForm vaultId={vault.data.id} />
      )}
      <ResourceList vaultId={vault.data.id} section={section} />
    </div>
  );
}
