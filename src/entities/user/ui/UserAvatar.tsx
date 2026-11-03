import { cn } from "cn";
import { useAvatarImage } from "../model/useAvatarImage";
import type { User } from "../model/user.types";

/** Người dùng tối thiểu để hiện avatar; lấy từ phiên Backend. */
export type UserAvatarSubject = Pick<
  User,
  "id" | "fullName" | "email" | "hasAvatar" | "avatarUpdatedAt"
>;

export interface UserAvatarProps {
  /** Chưa có người dùng (đang tải phiên) thì hiện chữ cái dự phòng. */
  user?: UserAvatarSubject | null;
  /** Chữ cái hiện khi chưa có tên hoặc ảnh. */
  fallbackLetter?: string;
  /** Class kích thước và màu nền của vòng tròn, ví dụ "size-10 bg-[#E0C486] text-[#0A281E]". */
  className?: string;
}

/** Chữ cái đầu của tên (hoặc email), viết hoa theo tiếng Việt. */
function initialOf(user: UserAvatarSubject | null | undefined, fallbackLetter: string): string {
  const source = (user?.fullName || user?.email || "").trim();
  if (source.length === 0) return fallbackLetter;
  return source.slice(0, 1).toLocaleUpperCase("vi-VN");
}

/**
 * Avatar tròn của người dùng: ảnh Backend nếu có, không thì chữ cái đầu. Ảnh là trang trí (tên đã hiện cạnh đó)
 * nên ẩn khỏi trình đọc màn hình.
 */
export function UserAvatar({ user, fallbackLetter = "?", className }: UserAvatarProps) {
  const imageUrl = useAvatarImage(user);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        className,
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        initialOf(user, fallbackLetter)
      )}
    </span>
  );
}
