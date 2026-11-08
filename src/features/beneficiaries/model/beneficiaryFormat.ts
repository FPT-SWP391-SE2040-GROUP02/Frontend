/**
 * Kiểm định dạng số CCCD và số điện thoại Việt Nam trên form người nhận, để chặn lưu khi nhập sai.
 * Chỉ kiểm cấu trúc con số, không kiểm số đó có thật hay không.
 */

/** Mã tỉnh, thành phố ở 3 chữ số đầu của CCCD (63 mã đã cấp). */
const PROVINCE_CODES = new Set([
  "001", "002", "004", "006", "008", "010", "011", "012", "014", "015",
  "017", "019", "020", "022", "024", "025", "026", "027", "030", "031",
  "033", "034", "035", "036", "037", "038", "040", "042", "044", "045",
  "046", "048", "049", "051", "052", "054", "056", "058", "060", "062",
  "064", "066", "067", "068", "070", "072", "074", "075", "077", "079",
  "080", "082", "083", "084", "086", "087", "089", "091", "092", "093",
  "094", "095", "096",
]); // prettier-ignore

export const CITIZEN_ID_FORMAT_MESSAGE =
  "Số CCCD không đúng định dạng: 3 số đầu phải là mã tỉnh, thành phố và số thứ 4 từ 0 đến 3.";

/**
 * CCCD đủ 12 chữ số, 3 số đầu là mã tỉnh đã cấp, số thứ 4 (thế kỷ và giới tính) từ 0 đến 3,
 * tức người sinh từ năm 1900 đến 2099. Nhận chuỗi đã bỏ khoảng trắng.
 */
export function isValidCitizenIdFormat(citizenId: string): boolean {
  if (!/^\d{12}$/.test(citizenId)) {
    return false;
  }
  if (!PROVINCE_CODES.has(citizenId.slice(0, 3))) {
    return false;
  }
  const centuryCode = citizenId.charAt(3);
  return centuryCode >= "0" && centuryCode <= "3";
}
