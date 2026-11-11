import { z } from "zod";

/**
 * Một tỉnh/thành phố hoặc một phường/xã trong danh mục đơn vị hành chính của Backend
 * (GET /administrative-units/provinces và .../provinces/{code}/wards, BE mục 6.10a).
 * Mã luôn là chuỗi để giữ số 0 đứng đầu (ví dụ tỉnh "01", phường "00004").
 */
export const administrativeUnitSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1),
});
export type AdministrativeUnit = z.infer<typeof administrativeUnitSchema>;

export const administrativeUnitListSchema = z.array(administrativeUnitSchema);
