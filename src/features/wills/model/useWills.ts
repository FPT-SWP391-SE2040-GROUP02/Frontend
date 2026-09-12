import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { willService } from "../api/willService";
import { toWillViewModel } from "../lib/adapters";
import type { 
  CreateWillRequest, 
  WillViewModel,
  CreateWillFormValues 
} from "./will.types";
import { toCreateWillPayload } from "../lib/adapters";
import type { PaginationParams } from "@/shared/types";

/**
 * @file useWills.ts
 * @description Custom React Query Hooks cho Module Di Chúc Số (Will Protocol).
 * Tuân thủ Rule 2 (Trách nhiệm đơn duy nhất: Hooks quản lý Server State & Cache) và Rule 8 (JSDoc).
 */

export const willKeys = {
  all: ["wills"] as const,
  lists: () => [...willKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...willKeys.lists(), params] as const,
  details: () => [...willKeys.all, "detail"] as const,
  detail: (id: string) => [...willKeys.details(), id] as const,
};

/**
 * Hook lấy danh sách di chúc kèm ViewModel đã chuẩn hóa
 * @param params Phân trang
 */
export function useWills(params?: PaginationParams) {
  return useQuery({
    queryKey: willKeys.list(params),
    queryFn: async () => {
      const paginated = await willService.getWills(params);
      const viewModels: WillViewModel[] = paginated.items.map(toWillViewModel);
      return {
        ...paginated,
        items: viewModels,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

/**
 * Hook lấy chi tiết một bản di chúc theo ID
 * @param id Mã định danh di chúc
 */
export function useWillDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: willKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID không hợp lệ");
      const dto = await willService.getWillDetail(id);
      return toWillViewModel(dto);
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook tạo mới và ký số bản di chúc qua Stepper 4 bước
 */
export function useCreateWill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formValues: CreateWillFormValues) => {
      const payload: CreateWillRequest = toCreateWillPayload(formValues);
      return willService.createWill(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
    },
  });
}

/**
 * Hook thu hồi bản di chúc
 */
export function useRevokeWill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return willService.revokeWill(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.all });
    },
  });
}
