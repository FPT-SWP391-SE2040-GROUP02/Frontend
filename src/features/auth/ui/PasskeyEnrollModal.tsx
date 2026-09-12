import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Fingerprint, CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";

/**
 * @description Thuộc tính cấu hình cho PasskeyEnrollModal component.
 */
export interface PasskeyEnrollModalProps {
  /** Trạng thái mở modal */
  isOpen: boolean;
  /** Hàm callback đóng modal */
  onClose: () => void;
  /** Callback khi đăng ký passkey thành công */
  onEnrollSuccess?: () => void;
}

/**
 * @description Modal hướng dẫn đăng ký TouchID / FaceID / Windows Hello (WebAuthn Passkey FIDO2).
 *
 * @param {PasskeyEnrollModalProps} props Thuộc tính component
 * @returns {React.JSX.Element} Modal đăng ký Passkey
 *
 * @example
 * ```tsx
 * <PasskeyEnrollModal
 *   isOpen={isPasskeyOpen}
 *   onClose={() => setIsPasskeyOpen(false)}
 *   onEnrollSuccess={() => alert("Đã kích hoạt FaceID thành công!")}
 * />
 * ```
 */
export function PasskeyEnrollModal({
  isOpen,
  onClose,
  onEnrollSuccess,
}: PasskeyEnrollModalProps) {
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  /**
   * @description Kích hoạt API WebAuthn trên trình duyệt
   */
  const handleEnrollPasskey = async () => {
    setIsEnrolling(true);
    try {
      // TODO: 1. Gọi WebAuthn API: navigator.credentials.create(...)
      // TODO: 2. Gửi public key credential lên Backend C#: POST /api/v1/auth/passkey/register
      setTimeout(() => {
        setIsEnrolling(false);
        setIsSuccess(true);
        onEnrollSuccess?.();
      }, 1200);
    } catch (_error) {
      setIsEnrolling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#fafaf7] dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f] p-6 sm:p-7 rounded-3xl text-center">
        <DialogHeader className="border-b border-[#e2ebd9] dark:border-[#193a28] pb-3 text-center sm:text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mx-auto flex items-center justify-center mb-2">
            <Fingerprint className="w-8 h-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Đăng Nhập Bằng Sinh Trắc Học
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5b6f5f] dark:text-[#9bb39f]">
            Kích hoạt TouchID, FaceID hoặc Khóa bảo mật FIDO2
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
              Đã Kích Hoạt Passkey Thành Công!
            </h4>
            <p className="text-xs text-[#526656] dark:text-[#a0b8a5] leading-relaxed max-w-xs mx-auto">
              Từ lần đăng nhập kế tiếp, bạn chỉ cần chạm vân tay hoặc quét khuôn mặt mà không cần nhớ
              mật khẩu dài.
            </p>
            <Button
              className="mt-3 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white text-xs h-10 px-5 rounded-xl font-bold"
              onClick={onClose}
            >
              Hoàn tất
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-2xl bg-[#edf5e8] dark:bg-[#122e20] border border-[#d2e4cb] dark:border-[#1d4631] text-[#394f3e] dark:text-[#b4cebb] space-y-1.5">
              <strong className="block font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
                Ưu điểm của chuẩn Passkey WebAuthn:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Chống hoàn toàn các cuộc tấn công lừa đảo (Anti-Phishing).</li>
                <li>Khóa bí mật được lưu an toàn trong Secure Enclave của thiết bị.</li>
                <li>Không lo quên mật khẩu phức tạp.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#e2ebd9] dark:border-[#193a28]">
              <Button variant="outline" onClick={onClose} className="h-10 px-4 rounded-xl text-xs">
                Để sau
              </Button>
              <Button
                disabled={isEnrolling}
                onClick={handleEnrollPasskey}
                className="gap-2 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white text-xs h-10 px-5 rounded-xl font-bold"
              >
                <Fingerprint className="w-4 h-4 text-[var(--heritage-gold,#f5d482)]" />
                <span>{isEnrolling ? "Đang xác thực thiết bị..." : "Kích hoạt TouchID / FaceID"}</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
