import { useRef, useState } from "react";
import type { AxiosProgressEvent } from "axios";
import { useSuccessHold } from "./useSuccessHold";

/** Tùy chọn truyền vào request tải tệp để theo dõi tiến độ và hủy. */
export interface TransferOptions {
  signal?: AbortSignal;
  onDownloadProgress?: (event: AxiosProgressEvent) => void;
}

interface Transfer {
  key: string;
  percent: number | null;
}

/**
 * Theo dõi một lần tải: tệp nào đang tải (`activeKey`), phần trăm thật theo Content-Length của server (null khi
 * server còn chuẩn bị hoặc không cho biết dung lượng), xong thì giữ `done` một nhịp, và hủy được.
 */
export function useTransfer() {
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const controller = useRef<AbortController | null>(null);
  const success = useSuccessHold();

  function track(key: string, fetchContent: (options: TransferOptions) => Promise<Blob>) {
    return () =>
      success.hold(() => {
        const own = new AbortController();
        controller.current = own;
        setTransfer({ key, percent: null });
        return fetchContent({
          signal: own.signal,
          onDownloadProgress: (event) => {
            if (!event.total) {
              return;
            }
            const percent = Math.min(100, Math.floor((event.loaded * 100) / event.total));
            setTransfer({ key, percent });
          },
        });
      });
  }

  function cancel(): void {
    if (controller.current !== null) {
      controller.current.abort();
    }
  }

  let activeKey: string | null = null;
  let percent: number | null = null;
  if (transfer !== null) {
    activeKey = transfer.key;
    percent = transfer.percent;
  }
  return { activeKey, percent, done: success.done, track, cancel };
}
