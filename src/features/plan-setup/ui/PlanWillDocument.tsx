import type { z } from "zod";
import type { WillGapTarget } from "@/entities/will/model/willDocument.types";
import { WillDocument } from "@/entities/will/ui/WillDocument";
import {
  pickOwnerSignedAt,
  pickUnassignedPackages,
  pickWillExecutor,
  pickWillRecipients,
} from "../lib/willView";
import type { planSetupSchema } from "../model/planSetup.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

/**
 * Di chúc của kho, sinh từ dữ liệu kế hoạch bàn giao (plan-setup). Họ tên và email Chủ kho lấy từ Backend; Backend cũ
 * chưa trả thì dùng `ownerFallback` (tài khoản đang đăng nhập). Không gọi thêm API.
 */
export function PlanWillDocument({
  setup,
  ownerFallback,
  viewer = "owner",
  onGapClick,
}: {
  setup: PlanSetup;
  ownerFallback: { fullName: string; email: string };
  viewer?: "owner" | "reader";
  onGapClick?: (target: WillGapTarget) => void;
}) {
  let ownerName = ownerFallback.fullName;
  if (setup.ownerFullName) {
    ownerName = setup.ownerFullName;
  }
  let ownerEmail = ownerFallback.email;
  if (setup.ownerEmail) {
    ownerEmail = setup.ownerEmail;
  }
  return (
    <WillDocument
      ownerName={ownerName}
      ownerEmail={ownerEmail}
      signedAt={pickOwnerSignedAt(setup)}
      executor={pickWillExecutor(setup.executors)}
      recipients={pickWillRecipients(setup)}
      unassignedPackages={pickUnassignedPackages(setup.containers)}
      assetsOutsideCount={setup.assetsOutsideContainer.length}
      viewer={viewer}
      onGapClick={onGapClick}
    />
  );
}
