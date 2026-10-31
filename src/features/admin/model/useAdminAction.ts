import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { adminActionError } from "./adminError";

/**
 * Như usePrivateAction nhưng hiện lý do riêng của lỗi quản trị (CANNOT_CHANGE_SELF, LAST_ADMIN,
 * INCIDENT_NOT_OPEN...). Vẫn chặn bấm lặp, không retry, không optimistic;
 * lỗi khác dùng thông báo chung.
 */
export function useAdminAction() {
  const base = usePrivateAction();
  const [detail, setDetail] = useState("");
  async function execute<T>(operation: () => Promise<T>, publish: (result: T) => void) {
    setDetail("");
    return base.execute(async () => {
      try {
        return await operation();
      } catch (failure) {
        setDetail(adminActionError(failure));
        throw failure;
      }
    }, publish);
  }
  return { ...base, execute, error: base.error ? detail || base.error : "" };
}
