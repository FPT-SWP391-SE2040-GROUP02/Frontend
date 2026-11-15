import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { planSetupService } from "../api/planSetupService";

/** Số ký tự tối thiểu Backend yêu cầu trước khi trả kết quả. */
export const CANDIDATE_MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

/** Tìm tài khoản có sẵn để chọn làm Người thực thi; chờ người dùng ngừng gõ rồi mới gọi Backend. */
export function useExecutorCandidates(vaultId: string, text: string) {
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(text.trim()), DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [text]);

  const enabled = term.length >= CANDIDATE_MIN_CHARS;
  const query = useQuery({
    queryKey: ["executor-candidates", vaultId, term],
    queryFn: ({ signal }) => planSetupService.searchCandidates(vaultId, term, signal),
    enabled,
    retry: false,
  });
  return { query, term, enabled };
}
