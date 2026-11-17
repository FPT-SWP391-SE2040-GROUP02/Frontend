import type { UnsignedChanges } from "../model/planSetup.schema";

/** Các thay đổi chưa ký lại, tách theo hệ quả bàn giao. */
export interface UnsignedChangeLines {
  /** Đã có hiệu lực ngay (xóa): phần còn lại vẫn được bàn giao. */
  effective: string[];
  /** Chưa có hiệu lực (thêm, đổi người nhận): bị bỏ qua khi bàn giao cho tới khi Chủ kho ký lại. */
  pending: string[];
}

function addLine(lines: string[], count: number, text: string): void {
  if (count > 0) {
    lines.push(text);
  }
}

/** Đổi số đếm thay đổi của Backend sang câu tiếng Việt, mỗi loại thay đổi một dòng; số 0 không có dòng. */
export function describeUnsignedChanges(
  changes: UnsignedChanges | null | undefined,
): UnsignedChangeLines {
  const result: UnsignedChangeLines = { effective: [], pending: [] };
  if (changes === null || changes === undefined) {
    return result;
  }
  addLine(result.effective, changes.removedContainers, `Đã xóa ${changes.removedContainers} gói`);
  addLine(
    result.effective,
    changes.removedAssets,
    `Đã xóa ${changes.removedAssets} tài sản khỏi gói`,
  );
  addLine(
    result.effective,
    changes.removedRecipients,
    `Đã xóa ${changes.removedRecipients} người nhận`,
  );
  addLine(result.pending, changes.addedContainers, `Thêm ${changes.addedContainers} gói mới`);
  addLine(result.pending, changes.addedAssets, `Thêm ${changes.addedAssets} tài sản vào gói`);
  addLine(
    result.pending,
    changes.addedRecipients,
    `Thêm ${changes.addedRecipients} người nhận mới`,
  );
  addLine(
    result.pending,
    changes.changedRecipientCount,
    `Đổi người nhận ở ${changes.changedRecipientCount} gói`,
  );
  return result;
}
