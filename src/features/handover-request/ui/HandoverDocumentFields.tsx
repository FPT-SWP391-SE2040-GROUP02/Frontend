import type { DocumentErrors, HandoverDocuments } from "../model/handoverDocuments";
import { DocumentPicker } from "./DocumentPicker";

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {children}
    </p>
  );
}

/**
 * Phần giấy tờ chia theo loại (giấy chứng tử, di chúc, giấy tờ khác) dùng chung cho form gửi yêu cầu nhận tài sản và form
 * nộp hồ sơ báo tin: cùng câu hướng dẫn, cùng ô chọn tệp, cùng thông báo lỗi.
 */
export function HandoverDocumentFields({
  legend,
  documents,
  errors,
  disabled,
  onChange,
}: {
  legend: string;
  documents: HandoverDocuments;
  errors: DocumentErrors;
  disabled?: boolean;
  onChange: (documents: HandoverDocuments) => void;
}) {
  const { deathCertificates, wills, others } = documents;
  return (
    <fieldset className="space-y-4">
      <legend className="font-serif text-xl text-heritage-primary">{legend}</legend>
      <p className="text-sm leading-6 text-heritage-muted">
        Bắt buộc có giấy chứng tử và di chúc; giấy tờ khác nộp nếu có. Tối đa 10 tệp PDF hoặc ảnh,
        mỗi tệp 10 MB. Hệ thống chỉ lưu tệp, luật sư xác minh ở ngoài hệ thống.
      </p>
      <DocumentPicker
        label="Giấy chứng tử (bắt buộc)"
        files={deathCertificates}
        onChange={(files) => onChange({ ...documents, deathCertificates: files })}
        disabled={disabled}
        reserved={wills.length + others.length}
      />
      <FieldError>{errors.deathCertificates}</FieldError>
      <DocumentPicker
        label="Di chúc (bắt buộc)"
        files={wills}
        onChange={(files) => onChange({ ...documents, wills: files })}
        disabled={disabled}
        reserved={deathCertificates.length + others.length}
      />
      <FieldError>{errors.wills}</FieldError>
      <DocumentPicker
        label="Giấy tờ khác (nếu có)"
        files={others}
        onChange={(files) => onChange({ ...documents, others: files })}
        disabled={disabled}
        reserved={deathCertificates.length + wills.length}
      />
      <FieldError>{errors.files}</FieldError>
    </fieldset>
  );
}
