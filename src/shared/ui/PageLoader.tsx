import { LegacyVaultMark } from "./LegacyVaultArtwork";

/**
 * Màn hình chờ toàn trang (tải file trang, đồng bộ phiên).
 * Chỉ hiện sau khoảng 150ms nên trang tải nhanh không bị nháy; hiện ra bằng mờ dần, logo "thở" nhẹ.
 * Hoạt ảnh nằm ở index.css (`page-loader`); máy bật giảm chuyển động thì hiện ngay và đứng yên.
 */
export function PageLoader({ label = "Đang tải trang…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="page-loader flex h-screen w-full flex-col items-center justify-center gap-4 bg-heritage-canvas"
    >
      <LegacyVaultMark className="page-loader-mark size-14 text-heritage-primary" />
      <p className="text-xs font-medium text-heritage-muted">{label}</p>
    </div>
  );
}
