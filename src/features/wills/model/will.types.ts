import type { BeneficiaryAllocation, AffidavitProof } from "@/entities/will/model/will.types";
export type * from "@/entities/will/model/will.types";

/**
 * Dữ liệu Form thu thập qua 4 bước của Stepper Wizard
 */
export interface CreateWillFormValues {
  /** Bước 1: Khai báo ý chí & chọn tài sản */
  title: string;
  declarationNotes: string;
  selectedAssetIds: string[];

  /** Bước 2: Phân bổ tỷ lệ cho người thừa kế (Tổng = 100%) */
  allocations: BeneficiaryAllocation[];
  legalComplianceConfirmed: boolean; // Cam đoan Điều 644 BLDS 2015

  /** Bước 3: Video tuyên thệ minh mẫn 15s (Điều 630 BLDS 2015) */
  affidavitProof: AffidavitProof;

  /** Bước 4: Ký số xác nhận */
  confirmDigitalSignature: boolean;
}
