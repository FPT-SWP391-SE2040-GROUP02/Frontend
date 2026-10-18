import { useEffect, useRef, useState } from "react";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { downloadErrorMessage } from "./handover.errors";

/**
 * Tải nội dung qua grant: chặn bấm lặp, chỉ lưu file khi Backend trả đủ nội dung.
 * Không retry mù và không giữ Blob sau khi đã trao cho trình duyệt.
 */
export function useGrantDownload() {
  const mounted = useRef(true);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function download(fetchContent: () => Promise<Blob>, fileName: string) {
    if (busy.current) return;
    const credential = accessTokenMemory.get();
    if (!credential) {
      setError("Vui lòng đăng nhập lại trước khi tiếp tục.");
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const blob = await fetchContent();
      // Phiên đổi hoặc màn hình đã đóng: bỏ nội dung, không lưu file cho người khác.
      if (!mounted.current || accessTokenMemory.get() !== credential) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      if (mounted.current && accessTokenMemory.get() === credential) {
        setError(downloadErrorMessage(failure));
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return { download, pending, error };
}
