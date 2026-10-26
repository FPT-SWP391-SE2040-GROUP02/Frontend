import { useEffect, useState } from "react";

/**
 * Ảnh xem trước chỉ trong RAM (blob URL), bắt buộc thu hồi đúng trong useEffect cleanup để tránh
 * rò rỉ bộ nhớ (ảnh CCCD có thể lớn).
 */
export function useImagePreview(file: File | null): string | null {
  const [prevFile, setPrevFile] = useState<File | null>(file);
  const [url, setUrl] = useState<string | null>(null);

  if (file !== prevFile) {
    setPrevFile(file);
    setUrl(null);
  }

  useEffect(() => {
    if (!file) return undefined;

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      objectUrl = null;
    }

    let active = true;
    void Promise.resolve().then(() => {
      if (active && objectUrl) {
        setUrl(objectUrl);
      }
    });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  return url;
}
