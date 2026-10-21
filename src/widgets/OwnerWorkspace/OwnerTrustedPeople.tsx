import { useSearchParams } from "react-router-dom";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { Button } from "@/shared/ui/button";
/** Compose person metadata with Executor setup without cross-feature imports. */
export function OwnerTrustedPeople({ vaultId }: { vaultId: string }) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("executorBeneficiaryPage") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested > 0 && requested <= 1_000_000 ? requested : 1;
  const people = useBeneficiaries(vaultId, { pageIndex: page, pageSize: 100 });
  const go = (value: number) => {
    const next = new URLSearchParams(params);
    next.set("executorBeneficiaryPage", String(value));
    setParams(next);
  };
  if (people.isPending) return <p role="status">Đang tải hồ sơ cho thiết lập Executor…</p>;
  if (people.isError)
    return (
      <div role="alert">
        <p>Không tải được hồ sơ người nhận cho thiết lập.</p>
        <Button onClick={() => void people.refetch()}>Thử lại</Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <ExecutorsSection
        vaultId={vaultId}
        beneficiaries={people.data.items.map((item) => ({
          id: item.id,
          label: `${item.fullName} · ****${item.citizenIdLast4}`,
        }))}
      />
      <nav aria-label="Trang người nhận cho Executor" className="flex items-center gap-4">
        <Button
          variant="outline"
          disabled={page === 1 || people.isFetching}
          onClick={() => go(page - 1)}
        >
          Trang trước
        </Button>
        <span>Trang {page}</span>
        <Button
          variant="outline"
          disabled={!people.data.hasNextPage || people.isFetching}
          onClick={() => go(page + 1)}
        >
          Trang sau
        </Button>
      </nav>
    </div>
  );
}
