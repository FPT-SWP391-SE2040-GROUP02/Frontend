import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { notaryCardService } from "../api/notaryCardService";

export const notaryCardKeys = {
  status: () => ["verifier", "notary-card", "status"] as const,
  image: (stamp: string | null | undefined) => ["verifier", "notary-card", "image", stamp] as const,
};

/** Tình trạng thẻ công chứng viên của Người xét duyệt đang đăng nhập. */
export function useNotaryCardStatus() {
  return useQuery({
    queryKey: notaryCardKeys.status(),
    queryFn: ({ signal }) => notaryCardService.getStatus(signal),
    // Lỗi thì báo ngay kèm nút Thử lại, không để nhãn "Đang tải" treo trong lúc tự gọi lại.
    retry: false,
  });
}

/**
 * Object URL của ảnh thẻ, hoặc undefined khi chưa có ảnh, đang tải hoặc tải lỗi.
 * Blob nằm trong cache theo thời điểm nộp nên nộp ảnh mới là tải lại; URL do component này tạo và tự thu hồi.
 */
export function useNotaryCardImage(hasCard: boolean, stamp: string | null | undefined) {
  const { data, isError } = useQuery({
    queryKey: notaryCardKeys.image(stamp),
    queryFn: ({ signal }) => notaryCardService.download(signal),
    enabled: hasCard,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!hasCard || !data) return undefined;
    const objectUrl = URL.createObjectURL(data);
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setUrl(objectUrl);
    });
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [hasCard, data]);

  return { url: hasCard && data ? url : undefined, failed: isError };
}
