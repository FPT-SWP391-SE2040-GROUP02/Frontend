import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/shared/ui";
import { APP_MESSAGES } from "@/shared/constants";

/** @description Props legacy; callback chỉ dành cho enrollment được BE xác nhận trong tương lai. */
export interface PasskeyEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollSuccess?: () => void;
}

/** @description Thông báo Passkey chưa khả dụng; không giả enrollment hoặc xác thực bằng timer. */
export function PasskeyEnrollModal({ isOpen, onClose }: PasskeyEnrollModalProps) {
  // TODO: [P3][AUTH-11] DEVELOPER BLUEPRINT
  // 1. [MỤC TIÊU]: Tách đăng nhập và enrollment WebAuthn sau khi BE xác nhận phạm vi.
  // 2. [INPUT & OUTPUT]: Options/challenge BE -> credential -> kết quả verify BE.
  // 3. [CÁC BƯỚC]: Chốt DTO; service/hooks riêng cho login và enrollment; chỉ gọi callback sau server xác nhận.
  // 4. [HÀM / THƯ VIỆN]: WebAuthn native, Zod, TanStack Query.
  // 5. [ĐIỀU KIỆN BIÊN]: Hủy prompt, HTTPS, rpId, challenge hết hạn; không lưu hoặc tự xác nhận credential.
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng nhập bằng Passkey</DialogTitle>
          <DialogDescription>{APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE}</DialogDescription>
        </DialogHeader>
        <Button type="button" onClick={onClose}>
          Quay lại đăng nhập
        </Button>
      </DialogContent>
    </Dialog>
  );
}
