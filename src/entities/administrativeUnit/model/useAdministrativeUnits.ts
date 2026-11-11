import { useQuery } from "@tanstack/react-query";
import { administrativeUnitService } from "../api/administrativeUnitService";

export const administrativeUnitKeys = {
  all: ["administrative-units"] as const,
  provinces: () => [...administrativeUnitKeys.all, "provinces"] as const,
  wards: (provinceCode: string) => [...administrativeUnitKeys.all, "wards", provinceCode] as const,
};

/** Danh mục là dữ liệu tĩnh (đổi theo nghị quyết, không đổi trong một phiên): giữ 24 giờ, không tự tải lại. */
const STATIC_DATA_STALE_MS = 24 * 60 * 60 * 1000;

/** 34 tỉnh/thành phố. */
export function useProvinces() {
  return useQuery({
    queryKey: administrativeUnitKeys.provinces(),
    queryFn: ({ signal }) => administrativeUnitService.getProvinces(signal),
    staleTime: STATIC_DATA_STALE_MS,
    gcTime: STATIC_DATA_STALE_MS,
    retry: 1,
  });
}

/** Phường/xã của một tỉnh; chưa chọn tỉnh (mã rỗng) thì không gọi Backend. */
export function useWards(provinceCode: string) {
  return useQuery({
    queryKey: administrativeUnitKeys.wards(provinceCode),
    queryFn: ({ signal }) => administrativeUnitService.getWards(provinceCode, signal),
    enabled: provinceCode.length > 0,
    staleTime: STATIC_DATA_STALE_MS,
    gcTime: STATIC_DATA_STALE_MS,
    retry: 1,
  });
}
