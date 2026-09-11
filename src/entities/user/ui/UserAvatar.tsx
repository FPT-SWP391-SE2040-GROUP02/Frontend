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
 *
 * @param {string} [name=""] Họ tên người dùng (ví dụ: "Nguyễn Văn An")
 * @returns {string} 1 hoặc 2 chữ cái viết hoa đại diện (ví dụ: "NA")
 */
export function getInitials(name = ""): string {
  if (!name || !name.trim()) {
    return "U";
  }

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toLocaleUpperCase();
  }

  const firstLetter = words[0][0];
  const lastLetter = words[words.length - 1][0];

  return (firstLetter + lastLetter).toLocaleUpperCase();
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
