import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { avatarService } from "../api/avatarService";
import type { User } from "./user.types";

/**
 * Object URL của ảnh đại diện, hoặc undefined khi chưa có ảnh / đang tải / tải lỗi (UI rơi về chữ cái đầu).
 *
 * Ảnh là SERVER STATE nên Blob nằm trong cache của TanStack Query (không phải useState cục bộ):
 * - Query key ['user', 'avatar', id, avatarUpdatedAt]: có bao nhiêu component UserAvatar trên màn hình
 *   cũng chỉ phát đúng 1 request (dedupe nội tại của Query); chỉ fetch lại khi đổi người dùng hoặc ảnh.
 * - staleTime: Infinity + refetchOnWindowFocus: false => chuyển trang / chuyển tab trình duyệt KHÔNG gọi
 *   lại API /me/avatar.
 * - gcTime: Infinity giữ blob sống trong phiên; đăng xuất purge cache (AuthBootstrap: queryClient.clear()).
 *
 * Object URL tạo theo TỪNG COMPONENT, không phải trong Query cache: mỗi component tạo URL của riêng mình
 * từ blob cache và revoke đúng URL đó khi unmount (hoặc khi blob đổi). Không bao giờ revoke URL mà
 * component khác vẫn đang hiển thị, và cache không bao giờ giữ URL cũ đã revoke (tránh ảnh vỡ khi
 * key được dùng lại).
 */
export function useAvatarImage(
  user: Pick<User, "id" | "hasAvatar" | "avatarUpdatedAt"> | null | undefined,
): string | undefined {
  const id = user?.id;
  const hasAvatar = user?.hasAvatar === true;
  const stamp = user?.avatarUpdatedAt;

  const { data } = useQuery({
    queryKey: ["user", "avatar", id, stamp],
    queryFn: ({ signal }) => avatarService.download(signal),
    // Chỉ gọi API khi thật sự có ảnh; user chưa hydrate hoặc không có ảnh thì disabled, không request.
    enabled: id !== undefined && hasAvatar,
    // Ảnh là cache dài: mount lại / lấy focus không refetch; chỉ đổi khi key đổi.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // Giữ blob trong phiên; đăng xuất dọn cache nên không rò qua danh tính mới.
    gcTime: Infinity,
    // Ảnh trang trí: không retry, để fallback chữ cái hiện ngay.
    retry: false,
  });

  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!hasAvatar || !data) return undefined;
    const objectUrl = URL.createObjectURL(data);
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setUrl(objectUrl);
    });
    return () => {
      active = false;
      // Thu hồi đúng URL component này vừa tạo (khi blob đổi hoặc khi unmount).
      URL.revokeObjectURL(objectUrl);
    };
  }, [hasAvatar, data]);

  return hasAvatar && data ? url : undefined;
}
