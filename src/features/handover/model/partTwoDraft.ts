/**
 * Nháp Phần 2 của biên bản trong sessionStorage để tải lại trang không mất chữ đã điền.
 * Chỉ giữ họ tên và ngày sinh. Không giữ số căn cước, ảnh căn cước và ô tick ký: dữ liệu định danh không nằm lại trong trình duyệt,
 * và ký luôn là một thao tác có chủ ý mới. Hết phiên tab thì nháp mất; ký xong thì xóa ngay.
 */
export interface PartTwoDraft {
  fullName: string;
  dateOfBirth: string;
}

const PREFIX = "handover-part2-draft:";

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readPartTwoDraft(turnId: string): PartTwoDraft | null {
  try {
    const raw = storage()?.getItem(PREFIX + turnId);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { fullName, dateOfBirth } = parsed as Record<string, unknown>;
    if (typeof fullName !== "string" || typeof dateOfBirth !== "string") return null;
    return { fullName, dateOfBirth };
  } catch {
    return null;
  }
}

export function writePartTwoDraft(turnId: string, draft: PartTwoDraft): void {
  try {
    storage()?.setItem(PREFIX + turnId, JSON.stringify(draft));
  } catch {
    // Trình duyệt chặn lưu thì bỏ qua: form vẫn dùng bình thường, chỉ không giữ nháp.
  }
}

export function clearPartTwoDraft(turnId: string): void {
  try {
    storage()?.removeItem(PREFIX + turnId);
  } catch {
    // Không có gì để xóa.
  }
}
