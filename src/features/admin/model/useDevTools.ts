import { useQuery } from "@tanstack/react-query";
import { devToolsService } from "../api/devToolsService";
import { adminKeys } from "./useAdmin";

export const devToolsKeys = {
  all: [...adminKeys.all, "dev-tools"] as const,
  vaults: () => [...devToolsKeys.all, "vaults"] as const,
  clock: (vaultId: string) => [...devToolsKeys.all, "clock", vaultId] as const,
  ekycThreshold: () => [...devToolsKeys.all, "ekyc-threshold"] as const,
};

/** Danh sách kho để chọn; không retry để 404 (không phải Development hoặc không phải Admin) hiện ngay. */
export function useDevVaults() {
  return useQuery({
    queryKey: devToolsKeys.vaults(),
    queryFn: ({ signal }) => devToolsService.listVaults(signal),
    retry: false,
  });
}

/** Đồng hồ và các mốc của kho đang chọn; chỉ chạy khi đã chọn kho. */
export function useDevClock(vaultId: string) {
  return useQuery({
    queryKey: devToolsKeys.clock(vaultId),
    queryFn: ({ signal }) => devToolsService.getClock(vaultId, signal),
    enabled: vaultId.length > 0,
    retry: false,
  });
}

/** Ngưỡng so khớp khuôn mặt eKYC đang chạy; không retry để 404 (không phải Development/Staging hoặc không phải Admin) hiện ngay. */
export function useDevEkycThreshold() {
  return useQuery({
    queryKey: devToolsKeys.ekycThreshold(),
    queryFn: ({ signal }) => devToolsService.getEkycThreshold(signal),
    retry: false,
  });
}
