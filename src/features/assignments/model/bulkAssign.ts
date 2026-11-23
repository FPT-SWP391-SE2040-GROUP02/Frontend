/** Cách áp dụng danh sách người nhận lên nhiều tài sản. */
export type BulkMode = "add" | "replace";

export interface BulkChange {
  assetId: string;
  /** Danh sách người nhận sau cùng của tài sản này. */
  beneficiaryIds: string[];
}

function sameSet(first: string[], second: string[]): boolean {
  if (first.length !== second.length) {
    return false;
  }
  for (const id of first) {
    if (!second.includes(id)) {
      return false;
    }
  }
  return true;
}

/**
 * Tính việc cần lưu khi gán `pickedIds` cho nhiều tài sản. `add` giữ người đang nhận và thêm người mới;
 * `replace` đặt đúng danh sách đã chọn. Tài sản đã có đúng danh sách sau cùng thì bỏ qua, nên không gửi request thừa.
 * Chưa chọn ai thì không có thay đổi nào (không gỡ hàng loạt ở đây).
 */
export function planBulkChanges(
  assetIds: string[],
  currentByAsset: Record<string, string[]>,
  pickedIds: string[],
  mode: BulkMode,
): BulkChange[] {
  if (pickedIds.length === 0) {
    return [];
  }
  const changes: BulkChange[] = [];
  for (const assetId of assetIds) {
    const current = currentByAsset[assetId] ?? [];
    let next = [...pickedIds];
    if (mode === "add") {
      next = [...current];
      for (const id of pickedIds) {
        if (!next.includes(id)) {
          next.push(id);
        }
      }
    }
    if (!sameSet(next, current)) {
      changes.push({ assetId, beneficiaryIds: next });
    }
  }
  return changes;
}
