import type { UnsignedChanges } from "../model/planSetup.schema";

/** Các thay đổi chưa ký lại: danh sách dòng chữ và hai cờ để chọn câu về hệ quả bàn giao. */
export interface UnsignedChangeSummary {
  /** Mỗi loại thay đổi một dòng (xóa, thêm, đổi người nhận); số 0 không có dòng. */
  lines: string[];
  /** Có phần đã xóa (gói, tài sản, người nhận): phần đó không còn được bàn giao. */
  hasRemoved: boolean;
  /** Có phần thêm hoặc đổi người nhận: phần đó chưa được bàn giao cho tới khi ký lại. */
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
  addLine(result.lines, changes.removedContainers, `Đã xóa ${changes.removedContainers} gói`);
  addLine(result.lines, changes.removedAssets, `Đã xóa ${changes.removedAssets} tài sản khỏi gói`);
  addLine(
    result.lines,
    changes.removedRecipients,
    `Đã xóa ${changes.removedRecipients} người nhận`,
  );
  addLine(result.lines, changes.addedContainers, `Thêm ${changes.addedContainers} gói mới`);
  addLine(result.lines, changes.addedAssets, `Thêm ${changes.addedAssets} tài sản vào gói`);
  addLine(result.lines, changes.addedRecipients, `Thêm ${changes.addedRecipients} người nhận mới`);
  addLine(
    result.lines,
    changes.changedRecipientCount,
    `Đổi người nhận ở ${changes.changedRecipientCount} gói`,
  );
  if (changes.removedContainers > 0 || changes.removedAssets > 0 || changes.removedRecipients > 0) {
    result.hasRemoved = true;
  }
  if (
    changes.addedContainers > 0 ||
    changes.addedAssets > 0 ||
    changes.addedRecipients > 0 ||
    changes.changedRecipientCount > 0
  ) {
    result.hasAddedOrChanged = true;
  }
  return result;
}
