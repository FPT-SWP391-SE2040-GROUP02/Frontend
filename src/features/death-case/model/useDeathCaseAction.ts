import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { deathCaseActionError } from "./deathCase.errors";

/**
 * Như usePrivateAction nhưng hiện lý do cụ thể của DEATH_CASE_NOT_ALLOWED và HANDOVER_NOT_ALLOWED.
 * Vẫn chặn bấm lặp, không retry và không optimistic; lỗi khác dùng thông báo chung.
 */
export function useDeathCaseAction() {
  const base = usePrivateAction();
  const [detail, setDetail] = useState("");
  async function execute<T>(operation: () => Promise<T>, publish: (result: T) => void) {
    setDetail("");
    return base.execute(async () => {
      try {
        return await operation();
      } catch (failure) {
        setDetail(deathCaseActionError(failure));
        throw failure;
      }
    }, publish);
  }
  return { ...base, execute, error: base.error ? detail || base.error : "" };
}
