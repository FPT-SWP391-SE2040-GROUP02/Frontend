import type { UnsignedChanges } from "../model/planSetup.schema";

/** Các thay đổi chưa ký lại: danh sách dòng chữ và hai cờ để chọn câu về hệ quả bàn giao. */
export interface UnsignedChangeSummary {
  /** Mỗi loại thay đổi một dòng (gỡ gán, gán thêm); số 0 không có dòng. */
  lines: string[];
  /** Có phần đã gỡ gán: phần đó không còn được bàn giao. */
  hasRemoved: boolean;
  /** Có phần gán thêm: phần đó chưa được bàn giao cho tới khi ký lại. */
  hasAddedOrChanged: boolean;
}

function addLine(lines: string[], count: number, text: string): void {
  if (count > 0) {
    lines.push(text);
  }
}

/**
 * Đổi số đếm thay đổi của Backend sang câu tiếng Việt, mỗi loại thay đổi một dòng. Mọi thay đổi (xóa lẫn thêm) đều
 * cần Chủ kho ký lại; hai cờ chỉ dùng để nói đúng hệ quả trong lúc chờ ký lại.
 */
export function describeUnsignedChanges(
  changes: UnsignedChanges | null | undefined,
): UnsignedChangeSummary {
  const result: UnsignedChangeSummary = { lines: [], hasRemoved: false, hasAddedOrChanged: false };
  if (changes === null || changes === undefined) {
    return result;
  }
  addLine(
    result.lines,
    changes.removedAssignments,
    `Đã gỡ ${changes.removedAssignments} lượt gán tài sản cho người nhận`,
  );
  addLine(
    result.lines,
    changes.addedAssignments,
    `Gán thêm ${changes.addedAssignments} lượt tài sản cho người nhận`,
  );
  addLine(
    result.lines,
    changes.affectedRecipientCount,
    `${changes.affectedRecipientCount} người nhận bị ảnh hưởng`,
  );
  if (changes.removedAssignments > 0) {
    result.hasRemoved = true;
  }
  if (changes.addedAssignments > 0) {
    result.hasAddedOrChanged = true;
  }
  return result;
}
