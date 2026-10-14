import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { Button } from "@/shared/ui";

/** Các khối đọc Backend; lỗi riêng từng module, không fallback dữ liệu mẫu. */
export function OwnerResourcesPanel({ vaultId }: { vaultId: string }) {
  const assets = useVaultAssets(vaultId);
  const beneficiaries = useBeneficiaries(vaultId);
  const checkIn = useCheckIn(vaultId);
  const sections = [
    {
      title: "Tài sản trong kho",
      query: assets,
      value: assets.data ? `${assets.data.totalCount} tài sản` : "",
      items: assets.data?.items.map((item) => ({ id: item.id, label: item.name })) ?? [],
    },
    {
      title: "Hồ sơ người nhận",
      query: beneficiaries,
      value: beneficiaries.data ? `${beneficiaries.data.totalCount} hồ sơ` : "",
      items: beneficiaries.data?.items.map((item) => ({ id: item.id, label: item.fullName })) ?? [],
    },
  ];
  const checkInLabels: Record<string, string> = {
    NOT_STARTED: "Chưa bắt đầu",
    ACTIVE: "Đang trong kỳ điểm danh",
    CHECKIN_OVERDUE: "Đã quá hạn điểm danh",
    AWAITING_CHECK: "Đang chờ kiểm tra",
    PAUSED: "Đang tạm dừng",
  };
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sections.map(({ title, query, value, items }) => (
        <section
          key={title}
          aria-label={title}
          className="space-y-3 rounded-lg border border-heritage-border p-4"
        >
          <h3 className="font-semibold">{title}</h3>
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
              <p>{value}</p>
              {items.length ? (
                <ul>
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
      <section
        aria-label="Điểm danh"
        className="space-y-3 rounded-lg border border-heritage-border p-4"
      >
        <h3 className="font-semibold">Điểm danh</h3>
        {checkIn.isPending ? (
          <p role="status">Đang tải…</p>
        ) : checkIn.isError ? (
          <div role="alert">
            <p>Không tải được trạng thái điểm danh.</p>
            <Button
              className="mt-2 min-h-11"
              disabled={checkIn.isFetching}
              onClick={() => void checkIn.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : checkIn.data ? (
          <>
            <p>{checkInLabels[checkIn.data.status]}</p>
            <p>Chu kỳ: {checkIn.data.settings.cycleDays} ngày</p>
            <p>Thời gian chờ: {checkIn.data.settings.graceDays} ngày</p>
          </>
        ) : null}
      </section>
    </div>
  );
}
