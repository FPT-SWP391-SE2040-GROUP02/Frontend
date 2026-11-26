import { useEffect, useState } from "react";

/** Địa chỉ blob chỉ nằm trong RAM để xem trước tệp, thu hồi khi rời màn hình; null khi chưa có. */
export function useObjectUrl(file: File | null): string | null {
  const [entry, setEntry] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) return undefined;

    let url: string;
    try {
      url = URL.createObjectURL(file);
    } catch {
      return undefined;
    }

    let active = true;
    void Promise.resolve().then(() => {
      if (active) setEntry({ file, url });
    });

    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Không trả địa chỉ của tệp cũ (đã thu hồi) khi tệp vừa đổi.
  if (entry && entry.file === file) return entry.url;
  return null;
}
