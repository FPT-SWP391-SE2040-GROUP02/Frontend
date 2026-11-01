/** Tên mặc định Backend đặt khi tạo kho mà không nhập tên; cũng là nhãn mục menu. */
export const DEFAULT_VAULT_TITLE = "Kho của tôi";

export interface VaultPageTitle {
  /** Tiêu đề lớn của trang: tên kho Chủ kho đặt, hoặc nhãn mặc định khi chưa có. */
  title: string;
  /** Nhãn nhỏ phía trên tiêu đề; chỉ có khi tiêu đề là tên riêng của kho. */
  eyebrow?: string;
}

/**
 * Tên kho làm tiêu đề trang; "Kho của tôi" chuyển xuống thành nhãn nhỏ.
 * Chưa tải xong, tên rỗng hoặc trùng nhãn mặc định thì giữ "Kho của tôi", không lặp nhãn.
 */
export function vaultPageTitle(name: string | null | undefined): VaultPageTitle {
  const trimmed = (name ?? "").trim();
  if (trimmed === "" || trimmed === DEFAULT_VAULT_TITLE) {
    return { title: DEFAULT_VAULT_TITLE };
  }
  return { title: trimmed, eyebrow: DEFAULT_VAULT_TITLE };
}
