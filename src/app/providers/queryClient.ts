import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 15, // 15 giây: dữ liệu tự động làm mới khi chuyển trang nếu đã quá 15s
      gcTime: 1000 * 60 * 30, // 30 phút giữ rác
      retry: 2,
      refetchOnWindowFocus: true, // Tự động refetch dữ liệu mới nhất ngay khi người dùng quay lại tab/cửa sổ
      refetchOnReconnect: true, // Tự động refetch khi kết nối mạng phục hồi
      refetchOnMount: true, // Đảm bảo làm mới dữ liệu khi mount component nếu dữ liệu đã stale
    },
    mutations: {
      retry: 0,
    },
  },
});
