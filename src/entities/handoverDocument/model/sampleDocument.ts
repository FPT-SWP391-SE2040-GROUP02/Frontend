import type { DocumentKind, HandoverDocument, TemplateParagraph } from "./handoverDocument.schema";

/**
 * Biên bản mẫu để Admin xem trước mẫu đang sửa: dữ liệu giả, đã ký đủ, chữ lấy từ các đoạn đang sửa.
 * Chỉ dùng cho xem trước, không gửi đi đâu.
 */
export function sampleHandoverDocument(
  kind: DocumentKind,
  paragraphs: TemplateParagraph[],
  declineNotice: string,
): HandoverDocument {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    turnId: "00000000-0000-4000-8000-000000000002",
    vaultId: "00000000-0000-4000-8000-000000000003",
    code: "XEMTRUOC",
    kind,
    status: "COMPLETED",
    templateVersion: "xem-truoc",
    declineNotice,
    templateParagraphs: paragraphs,
    containerName: "Gói gia đình",
    itemCount: 3,
    owner: {
      fullName: "Nguyễn Văn A",
      dateOfDeath: "2026-11-05",
      certificateNumber: "0456/2026",
      certificateIssuedOn: "2026-11-07",
      deathRegistrationPlace: "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
      residenceAddress: "",
    },
    recipient: {
      fullName: "Trần Minh Anh",
      birthYear: 1990,
      citizenId: "079090001234",
      citizenIdLast4: "1234",
      residenceAddress: "",
      signedAt: "2026-11-11T03:00:00Z",
    },
    verifier: {
      signedByName: "Luật sư Lê Văn Dũng",
      checks: [true, true],
      signedAt: "2026-11-11T04:00:00Z",
    },
    resubmitted: false,
    vaultRecipientTotal: 0,
    createdAt: "2026-11-11T02:00:00Z",
    completedAt: "2026-11-11T04:00:00Z",
  };
}
