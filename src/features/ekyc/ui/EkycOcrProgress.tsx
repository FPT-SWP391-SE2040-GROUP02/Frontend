import { useEffect, useRef, useState } from "react";

/** Phần thanh dành cho tải ảnh lên; phần còn lại (tới 95%) dành cho quét căn cước. */
const UPLOAD_SHARE = 40;

const SCAN_CEILING = 95;

const DEFAULT_SCAN_MS = 4000;

const SCAN_MS_KEY = "lv.ekyc.ocrScanMs";

const TICK_MS = 150;

/** Thời gian quét lần trước trên trình duyệt này (chỉ để ước lượng); không đọc được thì dùng mặc định. */
function readExpectedScanMs(): number {
  try {
    const stored = Number(window.localStorage.getItem(SCAN_MS_KEY));
    if (Number.isFinite(stored) && stored >= 500 && stored <= 60000) {
      return stored;
    }
  } catch {
    /* Web Storage bị chặn: dùng mặc định */
  }
  return DEFAULT_SCAN_MS;
}

function saveScanMs(value: number) {
  if (value < 500 || value > 60000) return;
  try {
    window.localStorage.setItem(SCAN_MS_KEY, String(Math.round(value)));
  } catch {
    /* Web Storage bị chặn: bỏ qua */
  }
}

/**
 * Một thanh cho hai giai đoạn đọc ảnh giấy tờ.
 * - 0 → 40%: % tải ảnh lên thật từ axios (`uploadPercent`).
 * - 40 → 95%: % quét căn cước ƯỚC LƯỢNG theo thời gian chờ, chậm dần và không tự lên 100%,
 *   vì dịch vụ OCR chỉ trả kết quả một lần, không báo tiến độ.
 * Chỉ render khi request đang chạy; server trả kết quả thì component được gỡ và kết quả hiện ra.
 * `uploadPercent = null` (trình duyệt không báo tiến độ upload) thì coi như đã sang giai đoạn quét.
 */
export function EkycOcrProgress({ uploadPercent }: { uploadPercent: number | null }) {
  const uploading = uploadPercent !== null && uploadPercent < 100;

  const [expectedScanMs] = useState(readExpectedScanMs);

  // `scanStartedAt`: lúc upload xong (hoặc lúc mount nếu không có tiến độ upload); null khi còn tải ảnh.
  const [clock, setClock] = useState(() => {
    const at = Date.now();
    return { now: at, scanStartedAt: uploading ? null : at };
  });

  const uploadingRef = useRef(uploading);

  const scanStartedRef = useRef<number | null>(null);

  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);

  useEffect(() => {
    scanStartedRef.current = clock.scanStartedAt;
  }, [clock.scanStartedAt]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock((previous) => {
        const at = Date.now();
        let scanStartedAt = previous.scanStartedAt;
        if (scanStartedAt === null && !uploadingRef.current) {
          scanStartedAt = at;
        }
        return { now: at, scanStartedAt };
      });
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
      // Ghi lại thời gian quét thật để lần sau ước lượng sát hơn.
      if (scanStartedRef.current !== null) {
        saveScanMs(Date.now() - scanStartedRef.current);
      }
    };
  }, []);

  let percent: number;
  let label: string;

  if (uploading) {
    percent = (uploadPercent * UPLOAD_SHARE) / 100;
    label = `Đang tải ảnh lên… ${uploadPercent}%`;
  } else {
    const elapsed = Math.max(0, clock.now - (clock.scanStartedAt ?? clock.now));
    const ratio = 1 - Math.exp(-elapsed / expectedScanMs);
    percent = UPLOAD_SHARE + (SCAN_CEILING - UPLOAD_SHARE) * ratio;
    const scanPercent = Math.min(
      99,
      Math.round(((percent - UPLOAD_SHARE) * 100) / (100 - UPLOAD_SHARE)),
    );
    label = `Đang quét căn cước… ${scanPercent}%`;
  }

  const rounded = Math.round(percent);

  const uploadWidth = Math.min(percent, UPLOAD_SHARE);

  const scanWidth = Math.max(0, percent - UPLOAD_SHARE);

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-heritage-muted">
        <p role="status">{label}</p>

        <span aria-hidden="true">{uploading ? "1/2 Tải ảnh" : "2/2 Quét"}</span>
      </div>

      <div
        role="progressbar"
        aria-label="Tiến trình đọc giấy tờ"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={label}
        className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-heritage-canvas"
      >
        <div
          className="h-full bg-[#1d4d3c] transition-[width] duration-150"
          style={{ width: `${uploadWidth}%` }}
        />

        <div
          className="h-full bg-[#B08A3E] transition-[width] duration-150"
          style={{ width: `${scanWidth}%` }}
        />
      </div>
    </div>
  );
}
