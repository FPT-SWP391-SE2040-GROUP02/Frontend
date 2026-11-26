import type { z } from "zod";
import type { WillGapTarget, WillIdentityStatus } from "@/entities/will/model/willDocument.types";
import { WillDocument } from "@/entities/will/ui/WillDocument";
import {
  pickOwnerIdentity,
  pickOwnerSignedAt,
  pickWillExecutor,
  pickWillRecipients,
} from "../lib/willView";
import type { planSetupSchema } from "../model/planSetup.schema";
import type { WillIdentity } from "../model/willIdentity.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

/**
 * Biên bản phân chia của kho, sinh từ dữ liệu kế hoạch bàn giao (plan-setup) và danh tính đầy đủ (`identity`, do nơi gọi tải qua
 * useWillIdentity). Họ tên và email Chủ tài sản lấy từ Backend; Backend cũ chưa trả thì dùng `ownerFallback` (tài khoản đang
 * đăng nhập). Có danh tính eKYC của Chủ tài sản thì dùng họ tên trên giấy tờ. `identityStatus` mặc định "none": không in
 * ngày sinh, CCCD, thường trú. Không gọi thêm API.
 */
export function PlanWillDocument({
  setup,
  ownerFallback,
  viewer = "owner",
  onGapClick,
  identityStatus = "none",
  identity,
}: {
  setup: PlanSetup;
  ownerFallback: { fullName: string; email: string };
  viewer?: "owner" | "reader";
  onGapClick?: (target: WillGapTarget) => void;
  identityStatus?: WillIdentityStatus;
  /** Chỉ dùng khi `identityStatus` = "ready". */
  identity?: WillIdentity;
}) {
  let ownerName = ownerFallback.fullName;
  if (setup.ownerFullName) {
    ownerName = setup.ownerFullName;
  }
  let ownerEmail = ownerFallback.email;
  if (setup.ownerEmail) {
    ownerEmail = setup.ownerEmail;
  }
  let readyIdentity: WillIdentity | undefined;
  if (identityStatus === "ready" && identity !== undefined) {
    readyIdentity = identity;
    if (identity.owner !== null && identity.owner.fullName) {
      ownerName = identity.owner.fullName;
    }
  }
  let ownerIdentity = null;
  if (readyIdentity !== undefined) {
    ownerIdentity = pickOwnerIdentity(readyIdentity);
  }
  return (
    <WillDocument
      ownerName={ownerName}
      ownerEmail={ownerEmail}
      signedAt={pickOwnerSignedAt(setup)}
      executor={pickWillExecutor(setup)}
      recipients={pickWillRecipients(setup, readyIdentity)}
      unassignedAssetCount={setup.unassignedAssets.length}
      viewer={viewer}
      onGapClick={onGapClick}
      identityStatus={identityStatus}
      ownerIdentity={ownerIdentity}
    />
  );
}
