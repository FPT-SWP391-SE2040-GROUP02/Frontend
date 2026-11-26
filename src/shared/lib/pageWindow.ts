/** Số ô tối đa của thanh phân trang; thanh luôn rộng bằng nhau khi từ 8 trang trở lên. */
export const PAGE_SLOTS = 7;

/**
 * Các ô của thanh phân trang số: số trang, hoặc null cho dấu "…". Từ 8 trang trở lên luôn đủ bảy ô (đầu, cuối và cửa sổ
 * quanh trang hiện tại) để thanh không đổi chiều rộng; ít hơn thì hiện đủ mọi trang.
 */
export function pageWindow(current: number, total: number): Array<number | null> {
  const last = Math.max(1, total);
  const page = Math.min(Math.max(1, current), last);
  const slots: Array<number | null> = [];
  if (last <= PAGE_SLOTS) {
    for (let index = 1; index <= last; index += 1) {
      slots.push(index);
    }
    return slots;
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, null, last];
  }
  if (page >= last - 3) {
    return [1, null, last - 4, last - 3, last - 2, last - 1, last];
  }
  return [1, null, page - 1, page, page + 1, null, last];
}
