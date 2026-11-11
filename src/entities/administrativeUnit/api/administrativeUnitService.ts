import { apiClient } from "@/shared/api/axiosClient";
import { administrativeUnitListSchema } from "../model/administrativeUnit.schema";

/**
 * Danh mục tỉnh/thành phố và phường/xã (dữ liệu tĩnh của Backend, cần đăng nhập).
 * Mã tỉnh được mã hóa vào đường dẫn; mã lạ nhận 404 ADMINISTRATIVE_UNIT_NOT_FOUND.
 */
export const administrativeUnitService = {
  async getProvinces(signal?: AbortSignal) {
    return administrativeUnitListSchema.parse(
      await apiClient.get<unknown, unknown>("/administrative-units/provinces", { signal }),
    );
  },
  async getWards(provinceCode: string, signal?: AbortSignal) {
    return administrativeUnitListSchema.parse(
      await apiClient.get<unknown, unknown>(
        `/administrative-units/provinces/${encodeURIComponent(provinceCode)}/wards`,
        { signal },
      ),
    );
  },
};
