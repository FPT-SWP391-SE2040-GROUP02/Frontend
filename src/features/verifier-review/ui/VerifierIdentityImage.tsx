import { ImageOff } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  useVerifierIdentityImage,
  type VerifierIdentityImageKind,
} from "../model/useVerifierIdentityImage";

/**
 * Một ảnh danh tính cho Verifier đối chiếu (CCCD hoặc selfie). Bấm vào ảnh để mở cỡ lớn ở tab mới;
 * ảnh chỉ là object URL tạm trong RAM.
 */
export function VerifierIdentityImage({
  caseId,
  kind,
  version,
  alt,
}: {
  caseId: string;
  kind: VerifierIdentityImageKind;
  version: string | null;
  alt: string;
}) {
  const { state, retry } = useVerifierIdentityImage(caseId, kind, version);
  if (state.status === "loading")
    return (
      <div
        role="status"
        className="flex h-48 items-center justify-center rounded-xl bg-[#ECE8DB] text-sm text-heritage-muted"
      >
        Đang tải ảnh…
      </div>
    );
  if (state.status === "missing")
    return (
      <p className="flex h-48 items-center justify-center gap-2 rounded-xl bg-[#ECE8DB] px-4 text-center text-sm text-heritage-muted">
        <ImageOff className="size-4 shrink-0" aria-hidden="true" />
        Không có ảnh.
      </p>
    );
  if (state.status === "error")
    return (
      <div role="alert" className="space-y-3 rounded-xl bg-[#F8E1DE] p-4 text-sm text-[#7A1A14]">
        <p>Không tải được ảnh.</p>
        <button type="button" className={buttonStyles.outline} onClick={retry}>
          Thử lại
        </button>
      </div>
    );
  return (
    <a
      href={state.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
      aria-label={`${alt} (mở cỡ lớn)`}
    >
      <img
        src={state.url}
        alt={alt}
        className="h-48 w-full rounded-xl border border-heritage-border bg-white object-contain"
      />
    </a>
  );
}
