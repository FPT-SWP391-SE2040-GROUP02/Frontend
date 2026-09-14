import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBeneficiaryClaimDetail,
  verifyBiometricEkyc,
  confirmHandoverCompletion,
  refuseInheritance,
} from "../api/handoverService";
import type {
  BeneficiaryClaimDetailDto,
  EkycSessionResult,
  RefuseInheritanceRequest,
} from "./handover.types";

/**
 * @file useHandover.ts
 * @description Custom React Query Hooks cho Phân hệ Bàn giao Di sản Số & Xác thực eKYC.
 * Tuân thủ Rule 4 (Bước 3 Hooks), Rule 12 (Server State qua TanStack Query), Rule 24 (Cache Invalidation).
 */

/**
 * Factory quản lý Query Keys cho phân hệ Handover
 */
export const handoverKeys = {
  all: ["handover"] as const,
  details: () => [...handoverKeys.all, "detail"] as const,
  detail: (id: string) => [...handoverKeys.details(), id] as const,
};

/**
 * Hook truy xuất chi tiết hồ sơ bàn giao di sản của Người thụ hưởng
 * @param {string} claimId Mã định danh hồ sơ
 * @returns Kết quả truy vấn chứa dữ liệu BeneficiaryClaimDetailDto và trạng thái tải
 */
export function useBeneficiaryClaim(claimId: string) {
  return useQuery<BeneficiaryClaimDetailDto, Error>({
    queryKey: handoverKeys.detail(claimId),
    queryFn: () => getBeneficiaryClaimDetail(claimId),
    enabled: Boolean(claimId),
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

/**
 * Hook Mutation xác thực khuôn mặt sinh trắc học và kiểm tra người thật 3D (eKYC)
 * @returns Đối tượng Mutation để gửi ảnh webcam đối soát
 */
export function useVerifyBiometricEkyc() {
  return useMutation<
    EkycSessionResult,
    Error,
    { sessionId: string; faceImageBase64: string }
  >({
    mutationFn: ({ sessionId, faceImageBase64 }) =>
      verifyBiometricEkyc(sessionId, faceImageBase64),
  });
}

/**
 * Hook Mutation xác nhận hoàn tất giải mã tại RAM và đóng dấu biên bản bàn giao PDF/A
 * @returns Đối tượng Mutation xác nhận bàn giao di sản
 */
export function useConfirmHandover() {
  const queryClient = useQueryClient();

  return useMutation<
    { protocolPdfUrl: string; status: string },
    Error,
    { claimId: string; decryptedDigest: string }
  >({
    mutationFn: async ({ claimId, decryptedDigest }) => {
      const response = await confirmHandoverCompletion(claimId, decryptedDigest);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Rule 24: Tự động làm mới cache hồ sơ sau khi bàn giao thành công
      queryClient.invalidateQueries({
        queryKey: handoverKeys.detail(variables.claimId),
      });
    },
  });
}

/**
 * Hook Mutation gửi yêu cầu từ chối nhận di sản thừa kế theo Điều 620 BLDS
 * @returns Đối tượng Mutation từ chối thừa kế
 */
export function useRefuseInheritance() {
  const queryClient = useQueryClient();

  return useMutation<
    { fallbackTierActivated: boolean },
    Error,
    RefuseInheritanceRequest
  >({
    mutationFn: async (payload) => {
      const response = await refuseInheritance(payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Làm mới cache hồ sơ sau khi kích hoạt từ chối
      queryClient.invalidateQueries({
        queryKey: handoverKeys.detail(variables.claimId),
      });
    },
  });
}
