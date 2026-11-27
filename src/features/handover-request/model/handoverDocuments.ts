import { filesError } from "./handoverRequest.schema";

/** Giấy tờ nộp lần đầu, chia theo loại; dùng chung cho gửi yêu cầu nhận tài sản và nộp hồ sơ báo tin. */
export interface HandoverDocuments {
  deathCertificates: File[];
  wills: File[];
  others: File[];
}

export interface DocumentErrors {
  deathCertificates?: string;
  wills?: string;
  files?: string;
}

export const EMPTY_DOCUMENTS: HandoverDocuments = { deathCertificates: [], wills: [], others: [] };

/**
 * Cùng luật với Backend: bắt buộc giấy chứng tử và di chúc, giấy tờ khác không bắt buộc, tổng 1–10 tệp, mỗi tệp tối đa
 * 10 MB, PDF hoặc ảnh. Đối tượng rỗng khi hợp lệ.
 */
export function documentErrors(documents: HandoverDocuments): DocumentErrors {
  const errors: DocumentErrors = {};
  if (documents.deathCertificates.length === 0) {
    errors.deathCertificates = "Vui lòng đính kèm giấy chứng tử.";
  }
  if (documents.wills.length === 0) {
    errors.wills = "Vui lòng đính kèm di chúc.";
  }
  if (!errors.deathCertificates && !errors.wills) {
    const fileError = filesError([
      ...documents.deathCertificates,
      ...documents.wills,
      ...documents.others,
    ]);
    if (fileError !== "") errors.files = fileError;
  }
  return errors;
}
