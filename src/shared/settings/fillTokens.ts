/**
 * Thay các mốc `{tên}` trong chuỗi bằng giá trị cấu hình hiện hành, đi sâu vào mảng và object.
 * Mốc không có trong bảng giá trị được giữ nguyên để lộ ra khi quên khai báo.
 */
export function fillTokens<T>(value: T, tokens: Record<string, string | number>): T {
  if (typeof value === "string") {
    return value.replace(/\{(\w+)\}/g, (whole, name: string) =>
      name in tokens ? String(tokens[name]) : whole,
    ) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => fillTokens(item, tokens)) as T;
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = fillTokens(item, tokens);
    }
    return result as T;
  }
  return value;
}
