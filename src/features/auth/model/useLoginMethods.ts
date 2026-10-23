import { useQuery } from "@tanstack/react-query";
import { loginMethodsService } from "../api/loginMethodsService";

/** Cache theo phiên; `queryClient.clear()` khi đổi danh tính sẽ xóa luôn danh sách này. */
export const loginMethodKeys = {
  all: ["auth", "login-methods"] as const,
};

export function useLoginMethods() {
  return useQuery({
    queryKey: loginMethodKeys.all,
    queryFn: ({ signal }) => loginMethodsService.list(signal),
    retry: false,
  });
}
