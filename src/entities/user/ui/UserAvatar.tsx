import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

/**
 * @description Thuộc tính cấu hình cho component UserAvatar.
 */
export interface UserAvatarProps {
  /** Họ tên người dùng dùng để lấy chữ cái viết tắt fallback */
  fullName?: string;
  /** Đường dẫn ảnh đại diện */
  avatarUrl?: string;
  /** Kích thước avatar (class Tailwind, mặc định: "h-9 w-9") */
  className?: string;
}

/**
 * @description Hàm tiện ích trích xuất chữ cái đầu của các từ trong tên để làm Fallback Avatar.
 * Tuân thủ Quy tắc 7: Để trống logic, developer tự hoàn thiện theo hướng dẫn // TODO.
 *
 * @param {string} [name=""] Họ tên người dùng (ví dụ: "Nguyễn Văn An")
 * @returns {string} 1 hoặc 2 chữ cái viết hoa đại diện (ví dụ: "NA")
 */
export function getInitials(_name = ""): string {
  // TODO: 1. Kiểm tra chuỗi _name nếu rỗng hoặc chỉ toàn khoảng trắng thì trả về "U" (User)
  // TODO: 2. Cắt chuỗi thành mảng các từ: const words = _name.trim().split(/\s+/)
  // TODO: 3. Nếu chỉ có 1 từ, lấy 2 ký tự đầu viết hoa: words[0].substring(0, 2).toUpperCase()
  // TODO: 4. Nếu có từ 2 từ trở lên, lấy ký tự đầu của từ đầu tiên ghép với ký tự đầu của từ cuối cùng viết hoa
  // TODO: 5. Trả về chuỗi ký tự viết tắt
  return "U";
}

/**
 * @description Component hiển thị Avatar người dùng có hỗ trợ fallback chữ cái khi không có ảnh.
 */
export function UserAvatar({ fullName = "", avatarUrl, className = "h-9 w-9" }: UserAvatarProps) {
  const initials = getInitials(fullName);

  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
      <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
