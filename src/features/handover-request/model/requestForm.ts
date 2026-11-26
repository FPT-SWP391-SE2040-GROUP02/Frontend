import { filesError } from "./handoverRequest.schema";

/** Độ dài tối đa của lời nhắn cho luật sư. */
export const REQUEST_NOTE_MAX_LENGTH = 1000;

export interface RequestDraft {
  attested: boolean;
  wills: File[];
  others: File[];
}

export interface RequestErrors {
  attested?: string;
  wills?: string;
  files?: string;
}

/** Lỗi của form gửi yêu cầu, cùng luật với form nộp hồ sơ báo tin; đối tượng rỗng khi hợp lệ. */
export function requestErrors(draft: RequestDraft): RequestErrors {
  const errors: RequestErrors = {};
  if (!draft.attested) {
    errors.attested = "Vui lòng cam đoan giấy tờ là thật.";
  }
  if (draft.wills.length === 0) {
    errors.wills = "Vui lòng đính kèm di chúc.";
  } else {
    const fileError = filesError([...draft.wills, ...draft.others]);
    if (fileError !== "") {
      errors.files = fileError;
    }
  }
  return errors;
}
