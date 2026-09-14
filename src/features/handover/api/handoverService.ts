import { axiosClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  BeneficiaryClaimDetailDto,
  EkycSessionResult,
  RefuseInheritanceRequest,
} from "../model/handover.types";

/**
 * @file handoverService.ts
 * @description Tầng dịch vụ API cho phân hệ Bàn giao Di sản Số & Xác thực eKYC Người thụ hưởng.
 * Tuân thủ Rule 2 (Zero Hardcoding), Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc 100%).
 */

const HANDOVER_ENDPOINT = "/handover";
const EKYC_ENDPOINT = "/ekyc";

/**
 * Lấy chi tiết hồ sơ bàn giao di sản của Người thụ hưởng kèm 2 mảnh khóa Shamir
 * @param {string} claimId Mã định danh hồ sơ
 * @returns {Promise<BeneficiaryClaimDetailDto>} DTO chi tiết hồ sơ bàn giao di sản
 */
export async function getBeneficiaryClaimDetail(
  claimId: string
): Promise<BeneficiaryClaimDetailDto> {
  // =========================================================================
  // [RULE 7 - BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // =========================================================================
  // 1. [MỤC TIÊU]: Lấy hồ sơ bàn giao đã được Công chứng viên phê duyệt kèm Mảnh khóa 1 & Mảnh khóa 2.
  // 2. [INPUT]: claimId (string). [OUTPUT]: BeneficiaryClaimDetailDto.
  // 3. [CÁC BƯỚC TUẦN TỰ]:
  //    - Gọi GET /handover/claims/{claimId} qua axiosClient.
  //    - Trả về dữ liệu chi tiết hồ sơ từ response.data.
  // 4. [THƯ VIỆN]: axiosClient có tự động gắn X-Active-Role và X-Correlation-ID.
  // 5. [ĐIỀU KIỆN BIÊN]: Xử lý lỗi 404 nếu claimId không tồn tại hoặc 403 nếu chưa tới lượt nhận di sản.

  // TODO: [Developer Step] Thay thế mock data bên dưới bằng:
  // const response = await axiosClient.get<ApiResponse<BeneficiaryClaimDetailDto>>(`${HANDOVER_ENDPOINT}/claims/${claimId}`);
  // return response.data.data;

  return {
    id: claimId,
    vaultId: "vlt_01",
    vaultTitle: "Két Di Sản Gia Tộc Hayes (Private Key & Bất Động Sản Số)",
    deceasedFullName: "Alexander Hayes",
    deceasedDateOfDeath: "2026-08-15",
    beneficiaryFullName: "Eleanor Hayes",
    beneficiaryNationalId: "001095009876",
    allocatedPercentage: 100.0,
    notaryApprovalDate: "2026-09-12",
    notaryOfficeName: "Văn phòng Công chứng Tràng An - Hà Nội",
    notaryOfficerName: "Công chứng viên Nguyễn Văn Hùng",
    // Mảnh khóa 1 trích xuất từ Két di sản (index = 1)
    vaultShare1: "1-4f8a29b3c10e42d7",
    // Mảnh khóa 2 do Công chứng viên giải phóng sau kiểm toán tư cách (index = 2)
    notaryShare2: "2-7b1c38e9a25f60d4",
    // Bản mã AES-256-GCM mẫu (Chứa Private Key 12 Seed Words di sản)
    encryptedAssetPayload: "8zU1x9qA+MockEncryptedPayloadHeritageAssetWordsLegacyVault2026==",
    assetPayloadIv: "dGhpcy1pcy1hbi1pdi0xMg==", // 12 bytes IV
    assetCount: 3,
    status: "APPROVED_READY_FOR_HANDOVER",
    pdfHandoverProtocolUrl: "https://storage.legacyvault.vn/protocols/protocol_clm_01.pdf",
  };
}

/**
 * Gửi dữ liệu khuôn mặt và kiểm tra người thật 3D (Liveness) để xác thực danh tính Người thụ hưởng
 * @param {string} sessionId Mã phiên eKYC
 * @param {string} faceImageBase64 Dữ liệu ảnh khuôn mặt Base64 chụp từ webcam
 * @returns {Promise<EkycSessionResult>} Kết quả xác thực sinh trắc học
 */
export async function verifyBiometricEkyc(
  sessionId: string,
  faceImageBase64: string
): Promise<EkycSessionResult> {
  // =========================================================================
  // [RULE 7 - BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // =========================================================================
  // 1. [MỤC TIÊU]: Đối chiếu khuôn mặt với ảnh Căn cước công dân gắn chip và chống giả mạo Deepfake.
  // 2. [INPUT]: sessionId (string), faceImageBase64 (string). [OUTPUT]: EkycSessionResult.
  // 3. [CÁC BƯỚC TUẦN TỰ]:
  //    - Gọi POST /ekyc/verify-liveness kèm { sessionId, image: faceImageBase64 }.
  //    - Kiểm tra faceMatchScore >= 85.0 và livenessConfidence >= 90.0.
  //    - Trả về EkycSessionResult.
  // 4. [THƯ VIỆN]: axiosClient.
  // 5. [ĐIỀU KIỆN BIÊN]: Ném lỗi nếu phát hiện giả mạo khuôn mặt hoặc ánh sáng không đủ.

  // TODO: [Developer Step] Thay thế mock bên dưới bằng lệnh gọi API thực tế
  if (!faceImageBase64) {
    throw new Error("Dữ liệu hình ảnh khuôn mặt không được để trống.");
  }

  return {
    sessionId,
    faceMatchScore: 94.5,
    livenessConfidence: 96.8,
    isPassed: true,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Xác nhận hoàn tất ghép khóa và tải biên bản bàn giao di sản số đã đóng dấu ký số
 * @param {string} claimId Mã hồ sơ bàn giao
 * @param {string} decryptedDigest Mã băm xác nhận giải mã thành công tại RAM (không gửi Master Key lên server)
 * @returns {Promise<ApiResponse<{ protocolPdfUrl: string; status: string }>>} Kết quả xác nhận bàn giao
 */
export async function confirmHandoverCompletion(
  claimId: string,
  decryptedDigest: string
): Promise<ApiResponse<{ protocolPdfUrl: string; status: string }>> {
  // =========================================================================
  // [RULE 7 - BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // =========================================================================
  // 1. [MỤC TIÊU]: Ghi nhận trạng thái bàn giao thành công và sinh Biên bản bàn giao PDF/A có chữ ký số.
  // 2. [INPUT]: claimId (string), decryptedDigest (string).
  // 3. [LƯU Ý BẢO MẬT]: TUYỆT ĐỐI KHÔNG GỬI MASTER KEY LÊN MÁY CHỦ. Chỉ gửi SHA-256 digest chứng minh đã giải mã.
  // 4. [THƯ VIỆN]: axiosClient POST /handover/confirm.
  // 5. [ĐIỀU KIỆN BIÊN]: Bắt lỗi nếu hồ sơ đã từng bị từ chối hoặc đã được bàn giao trước đó.

  // TODO: [Developer Step] Thay thế mock data bằng lệnh gọi axiosClient.post
  return {
    success: true,
    message: "Bàn giao di sản số thành công! Biên bản bàn giao đã được đóng dấu chữ ký số điện tử.",
    data: {
      protocolPdfUrl: `https://storage.legacyvault.vn/protocols/protocol_${claimId}.pdf`,
      status: "DECRYPTED_HANDED_OVER",
    },
  };
}

/**
 * Gửi yêu cầu từ chối nhận di sản thừa kế theo Điều 620 Bộ luật Dân sự 2015
 * @param {RefuseInheritanceRequest} payload Dữ liệu từ chối nhận thừa kế
 * @returns {Promise<ApiResponse<{ fallbackTierActivated: boolean }>>} Kết quả kích hoạt cơ chế người thụ hưởng dự phòng
 */
export async function refuseInheritance(
  payload: RefuseInheritanceRequest
): Promise<ApiResponse<{ fallbackTierActivated: boolean }>> {
  // =========================================================================
  // [RULE 7 - BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // =========================================================================
  // 1. [MỤC TIÊU]: Ghi nhận việc từ bỏ quyền thừa kế theo Điều 620 BLDS và tự động kích hoạt Tầng dự phòng (Fallback Tier 2).
  // 2. [INPUT]: RefuseInheritanceRequest. [OUTPUT]: ApiResponse<{ fallbackTierActivated: boolean }>.
  // 3. [CÁC BƯỚC TUẦN TỰ]:
  //    - Validate payload bằng refuseInheritanceSchema.
  //    - Gọi POST /handover/refuse qua axiosClient.
  //    - Backend tự động chuyển phần di sản cho Người thụ hưởng dự phòng kế tiếp trong di chúc.
  // 4. [THƯ VIỆN]: axiosClient.
  // 5. [ĐIỀU KIỆN BIÊN]: Bắt lỗi lý do < 30 ký tự hoặc chưa đánh dấu xác nhận cam kết tự nguyện.

  // TODO: [Developer Step] Thay thế mock data bằng lệnh gọi axiosClient.post
  return {
    success: true,
    message: "Đã tiếp nhận yêu cầu từ chối nhận di sản theo Điều 620 BLDS. Hệ thống đã kích hoạt cơ chế phân bổ cho Người thụ hưởng dự phòng.",
    data: {
      fallbackTierActivated: true,
    },
  };
}
