import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { Button } from "@/shared/ui";
import { FileText, Users } from "lucide-react";

/** Các khối đọc Backend; lỗi riêng từng module, không fallback dữ liệu mẫu. */
export function OwnerResourcesPanel({ vaultId }: { vaultId: string }) {
  const assets = useVaultAssets(vaultId);
  const beneficiaries = useBeneficiaries(vaultId);
  const sections = [
    {
      title: "Tài sản đang lưu",
      icon: FileText,
      query: assets,
      value: assets.data ? `${assets.data.totalCount} tài sản` : "",
      items: assets.data?.items.map((item) => ({ id: item.id, label: item.name })) ?? [],
    },
    {
      title: "Hồ sơ người nhận",
      icon: Users,
      query: beneficiaries,
      value: beneficiaries.data ? `${beneficiaries.data.totalCount} hồ sơ` : "",
      items: beneficiaries.data?.items.map((item) => ({ id: item.id, label: item.fullName })) ?? [],
    },
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sections.map(({ title, icon: Icon, query, value, items }) => (
        <section key={title} aria-label={title} className="owner-resource-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="size-4 text-heritage-gold" aria-hidden="true" />
            {title}
          </h3>
          {query.isPending ? (
            <p role="status">Đang tải…</p>
          ) : query.isError ? (
            <div role="alert">
              <p>Không tải được {title.toLowerCase()}.</p>
              <Button
                className="mt-2 min-h-11"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xl font-semibold tracking-tight">{value}</p>
              {items.length ? (
                <ul className="owner-resource-list">
                  {items.map((item) => (
                    <li key={item.id}>{item.label}</li>
                  ))}
                </ul>
              ) : (
                <p role="status">Chưa có dữ liệu.</p>
              )}
            </>
          )}
        </section>
      ))}
    </div>
  );
}
