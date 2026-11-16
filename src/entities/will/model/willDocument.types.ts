/** Dữ liệu một bản di chúc để hiển thị (WillDocument). Chỉ có tên và số đếm, không có nội dung tài sản hay lời nhắn. */

export interface WillExecutorView {
  /** Email tài khoản LegacyVault của Người thực thi. */
  email: string;
  /** Họ tên trong tài khoản; Backend cũ hoặc người chưa có tài khoản thì không có. */
  fullName?: string | null;
  /** Lúc Người thực thi ký nhận vai; null khi mới được mời. */
  signedAt?: string | null;
}

export interface WillPackageView {
  id: string;
  name: string;
  assetCount: number;
}

export interface WillRecipientView {
  id: string;
  fullName: string;
  /** Chỉ cho biết đã viết lời nhắn chưa. Nội dung lời nhắn không bao giờ đưa vào di chúc. */
  hasMessage: boolean;
  packages: WillPackageView[];
}

/** Các hạn (ngày) in ở Điều 4; mặc định lấy từ cấu hình hệ thống khi nơi dùng không truyền. */
export interface WillPolicyView {
  checkInDays: number;
  responseDays: number;
  decisionDays: number;
  grantDays: number;
}
