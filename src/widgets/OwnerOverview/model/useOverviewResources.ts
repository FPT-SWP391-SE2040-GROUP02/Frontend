import { useQuery } from "@tanstack/react-query";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { useVaultAuditLogs } from "@/features/audit-logs/model/useVaultAuditLogs";

/** Chỉ mount sau khi phiên và kho sẵn sàng; đọc metadata, không tải nội dung tài sản. */
export function useOverviewResources(vaultId: string) {
  const assets = useVaultAssets(vaultId, {
    pageIndex: 1,
    pageSize: 5,
    sortBy: "createdAt",
    isAscending: false,
  });
  const beneficiaries = useBeneficiaries(vaultId, { pageIndex: 1, pageSize: 4 });
  const checkIn = useCheckIn(vaultId);
  const setup = useQuery({
    queryKey: ["plan-setup", vaultId],
    queryFn: ({ signal }) => planSetupService.get(vaultId, signal),
    retry: false,
  });
  const audit = useVaultAuditLogs(
    vaultId,
    { pageIndex: 1, pageSize: 4, sortBy: "at", isAscending: false },
    true,
  );
  return { assets, beneficiaries, checkIn, setup, audit };
}

export type OverviewResources = ReturnType<typeof useOverviewResources>;
