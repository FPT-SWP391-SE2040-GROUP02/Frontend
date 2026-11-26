/** Dữ liệu một bản biên bản phân chia để hiển thị (WillDocument). Chỉ có tên và số đếm, không có nội dung tài sản hay lời nhắn. */

export interface WillExecutorView {
  /** Email tài khoản LegacyVault của Người thực thi. */
  email: string;
  /** Họ tên trong tài khoản; Backend cũ hoặc người chưa có tài khoản thì không có. */
  fullName?: string | null;
  /** Lúc Người thực thi ký nhận vai; null khi mới được mời. */
  signedAt?: string | null;
}

/** Một tài sản trong biên bản phân chia; `sharedWithCount` lớn hơn 1 là tài sản nhận chung. */
export interface WillAssetView {
  id: string;
  name: string;
  sharedWithCount: number;
}

export interface WillRecipientView {
  id: string;
  fullName: string;
  assets: WillAssetView[];
  /** Ngày sinh "yyyy-MM-dd" của người nhận; chỉ có khi nơi xem đã tải danh tính đầy đủ. */
  dateOfBirth?: string | null;
  /** Số CCCD đầy đủ của người nhận; chỉ in trong biên bản phân chia, không ghi log hay lưu trữ. */
  citizenId?: string | null;
}

/** Danh tính đầy đủ của Chủ tài sản in ở mục I. */
export interface WillOwnerIdentityView {
  /** Ngày sinh "yyyy-MM-dd". */
  dateOfBirth: string;
  citizenId: string;
  residenceAddress: string;
}

/**
 * Tình trạng tải danh tính đầy đủ: "none" là nơi xem không dùng danh tính (Người thực thi xem lời mời), "loading" và
 * "error" là chưa có dữ liệu, "ready" là đã có (Chủ tài sản có thể chưa có danh tính eKYC: `ownerIdentity` = null).
 */
export type WillIdentityStatus = "none" | "loading" | "error" | "ready";

/** Chỗ trống trong biên bản phân chia mà Chủ tài sản có thể bấm để được đưa tới nơi điền. */
export type WillGapTarget = "executor" | "assignments";
