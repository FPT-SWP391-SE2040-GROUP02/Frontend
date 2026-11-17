import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { executorSigningPasswordError } from "../lib/executorSigningError";

/**
 * Trả lời lời mời Người thực thi kèm mật khẩu ký nhận vai (dùng chung cho cả ba nơi trả lời lời mời).
 * Mật khẩu chỉ gửi khi chấp nhận; chỉ xóa khỏi ô khi đã gửi xong hoặc khi chính mật khẩu bị báo lỗi,
 * lỗi khác (mạng, kế hoạch đổi trạng thái) giữ nguyên để người dùng bấm lại không phải gõ lại.
 */
export function useExecutorSigning() {
  const action = usePrivateAction();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const respond = (
    accept: boolean,
    send: (signingPassword: string | undefined) => Promise<unknown>,
    onDone: () => void,
  ) => {
    let signingPassword: string | undefined;
    if (accept) {
      signingPassword = password;
    }
    setPasswordError(null);
    void action.execute(
      () => send(signingPassword),
      () => {
        setPassword("");
        onDone();
      },
      (error, fieldErrors) => {
        if (!accept) return;
        const message = executorSigningPasswordError(error, fieldErrors);
        setPasswordError(message);
        if (message !== null) {
          setPassword("");
        }
      },
    );
  };

  return { action, password, setPassword, passwordError, respond };
}
