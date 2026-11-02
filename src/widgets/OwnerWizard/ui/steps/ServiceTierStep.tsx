import type { ReactNode } from "react";

/** Bước 3: bảng chọn hạng dịch vụ do trang lắp ghép truyền vào (widget không import ngược lên pages). */
export function ServiceTierStep({ catalog }: { catalog: ReactNode }) {
  return <>{catalog}</>;
}
