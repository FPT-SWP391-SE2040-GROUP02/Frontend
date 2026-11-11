import { LockKeyhole } from "lucide-react";

/**
 * Dải thông báo đầu mọi trang Chủ kho khi kho đã bị khóa (hồ sơ chứng tử, bàn giao, bị chặn, đã đóng).
 * Các nút thay đổi dữ liệu ở bên dưới được khóa theo; xem dữ liệu vẫn dùng được.
 */
export function OwnerVaultLockedBanner({ reason }: { reason: string }) {
  return (
    <section
      role="status"
      aria-labelledby="vault-locked-title"
      className="flex items-start gap-3 rounded-2xl border border-[#E0C486] bg-[#FBF3DF] px-5 py-4"
    >
      <LockKeyhole className="mt-0.5 size-5 shrink-0 text-[#7A5B25]" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <h2 id="vault-locked-title" className="text-sm font-semibold text-[#5C4318]">
          Kho đang bị khóa
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[#5C4318]">
          {reason} Bạn vẫn xem được dữ liệu, nhưng các nút thêm, sửa, xóa đã bị khóa.
        </p>
      </div>
    </section>
  );
}
