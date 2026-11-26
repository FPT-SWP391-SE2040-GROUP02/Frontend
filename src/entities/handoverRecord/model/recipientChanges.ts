import { handoverRecordService } from "../api/handoverRecordService";
import { pairKey, pairsToLines, savedPairs } from "./divisionView";
import type { HandoverRecord } from "./handoverRecord.schema";
import { draftToRecipient, type RecipientDraft } from "./recipientDraft";

/** Kết quả một lần thêm, sửa, xóa người nhận: biên bản mới và phần cần chỉnh trên cách chia đang hiện. */
export interface RecipientChange {
  record: HandoverRecord;
  /** Cặp người nhận - tài sản của người vừa thêm. */
  addedPairs: string[];
  /** Người vừa xóa; cách chia đang hiện phải gỡ người này. */
  removedId: string | null;
  /** Email người vừa thêm, để bỏ người đó khỏi danh sách điền sẵn từ hồ sơ báo tin. */
  addedEmail: string;
  /** Đã thêm người nhưng chưa lưu được tài sản được chia: luật sư bấm Lưu nháp. */
  linesUnsaved: boolean;
}

const UNCHANGED = { addedPairs: [], removedId: null, addedEmail: "", linesUnsaved: false };

/**
 * Thêm người nhận rồi lưu ngay tài sản chia cho người đó. Chỉ gửi các dòng đã lưu cộng dòng của người mới, nên những
 * thay đổi khác đang chờ "Lưu nháp" không bị lưu kèm.
 */
export async function addRecordRecipient(
  recordId: string,
  draft: RecipientDraft,
): Promise<RecipientChange> {
  const added = await handoverRecordService.addRecipient(recordId, draftToRecipient(draft));
  const email = draft.email.trim().toLowerCase();
  const person = added.availableRecipients.find(
    (item) => item.email.trim().toLowerCase() === email,
  );
  if (!person) throw new Error("Không đọc được người nhận vừa thêm.");
  const addedPairs = draft.assetIds.map((assetId) => pairKey(person.beneficiaryId, assetId));
  const change = { ...UNCHANGED, addedPairs, addedEmail: email };
  const lines = savedPairs(added);
  for (const pair of addedPairs) lines.add(pair);
  try {
    const record = await handoverRecordService.setLines(recordId, pairsToLines(lines));
    return { ...change, record };
  } catch {
    // Người đã lưu rồi nên không báo lỗi như chưa thêm (bấm thêm lại sẽ bị trùng căn cước).
    return { ...change, record: added, linesUnsaved: true };
  }
}

export async function updateRecordRecipient(
  recordId: string,
  beneficiaryId: string,
  draft: RecipientDraft,
): Promise<RecipientChange> {
  const record = await handoverRecordService.updateRecipient(
    recordId,
    beneficiaryId,
    draftToRecipient(draft),
  );
  return { ...UNCHANGED, record };
}

export async function removeRecordRecipient(
  recordId: string,
  beneficiaryId: string,
): Promise<RecipientChange> {
  const record = await handoverRecordService.removeRecipient(recordId, beneficiaryId);
  return { ...UNCHANGED, record, removedId: beneficiaryId };
}
