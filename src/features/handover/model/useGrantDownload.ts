import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { downloadErrorMessage } from "./handover.errors";

/**
 * Tải nội dung qua grant: chặn bấm lặp, chỉ lưu file khi Backend trả đủ nội dung.
 * Không retry mù và không giữ Blob sau khi đã trao cho trình duyệt.
 * Đối chiếu theo người dùng, không theo token: phiên làm mới giữa chừng đổi token nhưng vẫn
 * là cùng người nên kết quả/lỗi phải hiện; đổi hoặc đăng xuất tài khoản thì bỏ kết quả cũ.
 */
export function useGrantDownload() {
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id ?? null);
  const currentUser = useRef(userId);
  const mounted = useRef(true);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    currentUser.current = userId;
  }, [userId]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function download(fetchContent: () => Promise<Blob>, fileName: string) {
    if (busy.current) return;
    const startedBy = currentUser.current;
    if (!accessTokenMemory.get() || startedBy === null) {
      setError("Vui lòng đăng nhập lại trước khi tiếp tục.");
      return;
    }
    const sameSession = () => mounted.current && currentUser.current === startedBy;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const blob = await fetchContent();
      // Màn hình đã đóng hoặc đã đổi tài khoản: bỏ nội dung, không lưu file cho người khác.
      if (!sameSession()) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      if (sameSession()) setError(downloadErrorMessage(failure));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return { download, pending, error };
}
