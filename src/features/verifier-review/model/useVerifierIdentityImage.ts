import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { HTTP_STATUS } from "@/shared/constants";
import { verifierReviewService } from "../api/verifierReviewService";

/** Ảnh danh tính Verifier được xem: mặt trước CCCD lúc eKYC, hoặc selfie gần nhất khi Owner báo còn sống. */
export type VerifierIdentityImageKind = "owner-document" | "objection-selfie";

export type VerifierIdentityImageState =
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "missing" }
  | { status: "error" };

/**
 * Object URL của ảnh danh tính (BR-48, BR-50 sửa 25/10/2026). Blob chỉ nằm trong object URL tạm, không vào cache
 * TanStack Query hay Web Storage; URL cũ bị thu hồi khi có ảnh mới hoặc khi rời màn hình. `version` (thời điểm chụp)
 * đổi thì tải lại. 404 → "missing" (Owner chưa có ảnh), lỗi khác → "error" và gọi `retry` để tải lại.
 */
export function useVerifierIdentityImage(
  caseId: string,
  kind: VerifierIdentityImageKind,
  version: string | null,
) {
  const [result, setResult] = useState<{ key: string; state: VerifierIdentityImageState } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const current = useRef<string | undefined>(undefined);
  const key = `${caseId}|${kind}|${version ?? ""}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const load =
      kind === "owner-document"
        ? verifierReviewService.downloadOwnerDocumentImage
        : verifierReviewService.downloadObjectionSelfieImage;
    void load(caseId, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        if (current.current) URL.revokeObjectURL(current.current);
        current.current = URL.createObjectURL(blob);
        setResult({ key, state: { status: "ready", url: current.current } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const missing = isAxiosError(error) && error.response?.status === HTTP_STATUS.NOT_FOUND;
        setResult({ key, state: missing ? { status: "missing" } : { status: "error" } });
      });
    return () => controller.abort();
  }, [caseId, kind, key]);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  const state: VerifierIdentityImageState =
    result !== null && result.key === key ? result.state : { status: "loading" };
  return { state, retry: () => setAttempt((value) => value + 1) };
}
