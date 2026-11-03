import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeathCaseWizardSteps } from "../DeathCaseWizardSteps";
import type { DeathCase } from "../../model/deathCase.schema";

const baseRecord: DeathCase = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  vaultId: "550e8400-e29b-41d4-a716-446655440001",
  status: "DRAFT",
  etag: "w-etag",
  currentVersion: {
    versionNo: 1,
    isDraft: true,
    ownerFullName: "Nguyễn Văn A",
    ownerCitizenIdLast4: "1234",
    dateOfDeath: "2026-10-01",
    certificateNumber: "123/TLKT",
    issuedOn: "2026-10-02",
    issuedBy: "UBND Phường Bến Nghé",
    files: [],
    submittedAt: null,
  },
  reviewVersionNo: null,
  missingRequirements: ["FILES"],
  ownerNotice: null,
  objectionEndsAt: null,
  createdAt: "2026-10-01T08:00:00Z",
  updatedAt: null,
};

describe("DeathCaseWizardSteps", () => {
  it("hiển thị đủ 3 bước của quy trình nộp hồ sơ", () => {
    render(<DeathCaseWizardSteps record={baseRecord} isFormDirty={false} />);

    expect(screen.getByText("Sự kiện tử")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ & Giấy tờ")).toBeInTheDocument();
    expect(screen.getByText("Cam kết & Ký nộp")).toBeInTheDocument();
  });

  it("đánh dấu bước 1 hoàn tất khi không thiếu thông tin và form không dirty", () => {
    render(<DeathCaseWizardSteps record={baseRecord} isFormDirty={false} />);

    // Step 1 hoàn tất vì missingRequirements chỉ còn ["FILES"]
    expect(screen.getByText("Họ tên, CCCD, ngày & nơi mất")).toBeInTheDocument();
  });

  it("cập nhật số lượng tệp ở bước 2 khi đã có giấy tờ đính kèm", () => {
    const recordWithFiles: DeathCase = {
      ...baseRecord,
      currentVersion: {
        ...baseRecord.currentVersion,
        files: [
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            position: 1,
            fileName: "trich-luc.pdf",
            contentType: "application/pdf",
            sizeBytes: 1024,
            uploadedAt: "2026-10-02T10:00:00Z",
          },
        ],
      },
      missingRequirements: [],
    };

    render(<DeathCaseWizardSteps record={recordWithFiles} isFormDirty={false} />);

    expect(screen.getByText("1 tệp đã tải (CCCD, trích lục)")).toBeInTheDocument();
  });
});
