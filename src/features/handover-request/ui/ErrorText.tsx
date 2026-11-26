import type { ReactNode } from "react";

/** Dòng lỗi dưới một ô hoặc một nhóm ô; không có nội dung thì không vẽ gì. */
export function ErrorText({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {children}
    </p>
  );
}
