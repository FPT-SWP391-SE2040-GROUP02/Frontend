import type { z } from "zod";
import { WillDocument } from "@/entities/will/ui/WillDocument";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";
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
 * chưa trả thì dùng `ownerFallback` (tài khoản đang đăng nhập). Các hạn in ở Điều 4 lấy từ cấu hình hệ thống.
 */
export function PlanWillDocument({
  setup,
  ownerFallback,
  viewer = "owner",
}: {
  setup: PlanSetup;
  ownerFallback: { fullName: string; email: string };
  viewer?: "owner" | "reader";
}) {
  const policy = usePolicyWindows();
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
      clauses={setup.willClauses}
      policy={{
        responseDays: policy.responseDays,
        decisionDays: policy.decisionDays,
        grantDays: policy.grantDays,
      }}
      viewer={viewer}
    />
  );
}
