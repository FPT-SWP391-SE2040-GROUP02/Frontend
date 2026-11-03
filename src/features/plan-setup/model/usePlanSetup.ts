import { useQuery } from "@tanstack/react-query";
import { planSetupService } from "../api/planSetupService";

/** Điều kiện kích hoạt kế hoạch của kho; dùng chung một cache cho mọi nơi hiển thị. */
export function usePlanSetup(vaultId: string) {
  return useQuery({
    queryKey: ["plan-setup", vaultId],
    queryFn: ({ signal }) => planSetupService.get(vaultId, signal),
    retry: false,
  });
}
