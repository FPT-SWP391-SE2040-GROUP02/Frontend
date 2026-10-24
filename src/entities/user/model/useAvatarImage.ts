import { useEffect, useRef, useState } from "react";
import { avatarService } from "../api/avatarService";
import type { User } from "./user.types";

/**
 * Object URL của ảnh đại diện, hoặc undefined khi chưa có ảnh / đang tải / tải lỗi (UI rơi về chữ cái đầu).
 * Tải lại khi đổi người dùng hoặc `avatarUpdatedAt`. Blob chỉ nằm trong object URL tạm, không vào cache hay Web Storage;
 * URL cũ được thu hồi khi có URL mới hoặc khi component bị gỡ.
 */
export function useAvatarImage(
  user: Pick<User, "id" | "hasAvatar" | "avatarUpdatedAt"> | null | undefined,
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const current = useRef<string | undefined>(undefined);
  const id = user?.id;
  const hasAvatar = user?.hasAvatar === true;
  const stamp = user?.avatarUpdatedAt;

  useEffect(() => {
    if (!id || !hasAvatar) return undefined;
    const controller = new AbortController();
    void avatarService
      .download(controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        if (current.current) URL.revokeObjectURL(current.current);
        current.current = URL.createObjectURL(blob);
        setUrl(current.current);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        if (current.current) URL.revokeObjectURL(current.current);
        current.current = undefined;
        setUrl(undefined);
      });
    return () => controller.abort();
  }, [id, hasAvatar, stamp]);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  return hasAvatar ? url : undefined;
}
