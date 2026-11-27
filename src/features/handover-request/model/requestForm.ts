import { documentErrors, type DocumentErrors, type HandoverDocuments } from "./handoverDocuments";

/** Độ dài tối đa của lời nhắn cho luật sư. */
export const REQUEST_NOTE_MAX_LENGTH = 1000;

export interface RequestDraft extends HandoverDocuments {
  attested: boolean;
}

export interface RequestErrors extends DocumentErrors {
  attested?: string;
}

/** Lỗi của form gửi yêu cầu, cùng luật với form nộp hồ sơ báo tin; đối tượng rỗng khi hợp lệ. */
export function requestErrors(draft: RequestDraft): RequestErrors {
  const errors: RequestErrors = {};
  if (!draft.attested) {
    errors.attested = "Vui lòng cam đoan giấy tờ là thật.";
  }
  return { ...errors, ...documentErrors(draft) };
}
