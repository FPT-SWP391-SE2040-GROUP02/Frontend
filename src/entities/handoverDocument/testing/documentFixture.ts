import type { HandoverDocument } from "../model/handoverDocument.schema";

/** Biên bản mẫu đã hoàn tất cho test; ghi đè từng phần qua over. */
const ID = "0199e7a4-3333-7c3e-9a51-3f0f5d2b8a10";
const ZERO = "00000000-0000-0000-0000-000000000000";

export function documentFixture(over: Partial<HandoverDocument> = {}): HandoverDocument {
  return {
    id: ID,
    turnId: ZERO,
    vaultId: ZERO,
    code: "3F0F5D2B",
    kind: "ACCEPT",
    status: "COMPLETED",
    templateVersion: "bb-2026-11",
    containerName: "Gói gia đình",
    itemCount: 3,
    owner: {
      fullName: "Nguyễn Văn A",
      dateOfDeath: "2026-11-05",
      certificateNumber: "0456/2026",
      certificateIssuedOn: "2026-11-07",
      residenceAddress: "12 Lê Lợi, Phường Bến Thành, TP. Hồ Chí Minh",
    },
    recipient: {
      fullName: "Trần Minh Anh",
      birthYear: 1990,
      citizenIdLast4: "1234",
      residenceAddress: "34 Trần Hưng Đạo, Phường Hoàn Kiếm, Hà Nội",
      signedAt: "2026-11-10T04:00:00+00:00",
    },
    verifier: {
      signedByName: "Luật sư Dũng",
      checks: [true, true, true, true],
      signedAt: "2026-11-10T05:00:00+00:00",
    },
    supplementReason: null,
    submissionId: null,
    createdAt: "2026-11-10T02:00:00+00:00",
    completedAt: "2026-11-10T05:00:00+00:00",
    ...over,
  };
}
