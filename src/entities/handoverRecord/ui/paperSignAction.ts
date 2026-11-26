import type { ReactNode } from "react";

/**
 * Nút ký đặt ngay tại ô chữ ký của chính người đang xem: Người thực thi ở ô "Bên giao", luật sư ở ô "Luật sư chứng kiến",
 * người nhận ở ô "Bên nhận" của mình (`recipientId` là beneficiaryId của người đó).
 */
export interface PaperSignAction {
  target: "executor" | "verifier" | { recipientId: string };
  node: ReactNode;
}

/** Nút ký của một ô chữ ký: có khi `signAction` nhắm đúng ô này, không thì không có. */
export function signActionFor(
  signAction: PaperSignAction | undefined,
  target: "executor" | "verifier" | { recipientId: string },
): ReactNode {
  if (!signAction) {
    return undefined;
  }
  if (typeof target === "string" || typeof signAction.target === "string") {
    return target === signAction.target ? signAction.node : undefined;
  }
  return target.recipientId === signAction.target.recipientId ? signAction.node : undefined;
}
