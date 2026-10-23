import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";
import { ownerObjectionService } from "../api/ownerObjectionService";
import type { OwnerDeathCase } from "./ownerObjection.schema";

const missingSchema = z.object({ code: z.literal("DEATH_CASE_NOT_FOUND") });

/** Kho chưa có hồ sơ chứng tử mở; 404 route sai không bị coi là "không có hồ sơ". */
export function isDeathCaseMissing(error: unknown): boolean {
  return (
    isAxiosError<unknown>(error) &&
    error.response?.status === HTTP_STATUS.NOT_FOUND &&
    missingSchema.safeParse(error.response.data).success
  );
}

/** Cache theo kho; đổi identity thì `queryClient.clear()` của auth xóa cache này. */
export const ownerDeathCaseKeys = {
  all: ["owner-death-case"] as const,
  vault: (vaultId: string) => ["owner-death-case", vaultId] as const,
};

/** Đọc hồ sơ chứng tử mở của kho; `null` khi kho chưa có hồ sơ. */
export function useOwnerDeathCase(vaultId: string, enabled: boolean) {
  return useQuery({
    queryKey: ownerDeathCaseKeys.vault(vaultId),
    queryFn: async ({ signal }): Promise<OwnerDeathCase | null> => {
      try {
        return await ownerObjectionService.get(vaultId, signal);
      } catch (error) {
        if (isDeathCaseMissing(error)) return null;
        throw error;
      }
    },
    enabled: enabled && Boolean(vaultId),
    retry: false,
    // Hồ sơ có thể đổi do Verifier/job; đọc lại khi quay lại tab.
    refetchOnWindowFocus: true,
  });
}
