import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { recipientReviewService } from "../api/recipientReviewService";

export const recipientReviewKeys = {
  all: ["recipient-review"] as const,
  list: () => [...recipientReviewKeys.all, "list"] as const,
  detail: (id: string) => [...recipientReviewKeys.all, "detail", id] as const,
};

/** Hàng chờ hồ sơ người nhận; không retry để 403 (không phải Người xét duyệt) hiện ngay. */
export function useRecipientSubmissions() {
  return useQuery({
    queryKey: recipientReviewKeys.list(),
    queryFn: ({ signal }) => recipientReviewService.list(signal),
    retry: false,
  });
}

/**
 * Số hồ sơ người nhận đang chờ bạn duyệt, dùng cho huy hiệu ở menu. Dùng lại đúng query của danh sách nên không gọi API thêm.
 * Chưa tải xong hoặc lỗi thì trả 0 (huy hiệu ẩn), không đoán số.
 */
export function usePendingRecipientCount(): number {
  const query = useRecipientSubmissions();
  if (!query.data) return 0;
  return query.data.length;
}

export function useRecipientSubmission(id: string | null) {
  return useQuery({
    queryKey: recipientReviewKeys.detail(id ?? ""),
    queryFn: ({ signal }) => recipientReviewService.get(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
}

export type SubmissionImageState =
  { status: "loading" } | { status: "ready"; url: string } | { status: "error" };

/**
 * Object URL của ảnh căn cước một mặt. Blob chỉ nằm trong URL tạm trong RAM, không vào cache TanStack Query hay Web Storage;
 * URL bị thu hồi khi đổi hồ sơ hoặc rời màn hình.
 */
export function useRecipientImage(id: string, side: "front" | "back") {
  const [result, setResult] = useState<{ key: string; state: SubmissionImageState } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${id}|${side}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    let url: string | null = null;
    void recipientReviewService
      .image(id, side, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setResult({ key, state: { status: "ready", url } });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, state: { status: "error" } });
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, side, key]);

  const state: SubmissionImageState =
    result !== null && result.key === key ? result.state : { status: "loading" };
  return { state, retry: () => setAttempt((value) => value + 1) };
}
