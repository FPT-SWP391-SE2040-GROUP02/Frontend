import type { z } from "zod";
import type { checkInStatusSchema } from "../model/checkIn.schema";
import { CheckInNowButton } from "./CheckInNowButton";

/** Tổng quan dùng cùng nút và dữ liệu server với màn điểm danh. */
export function QuickCheckIn({
  vaultId,
  status,
  onCheckedIn,
}: {
  vaultId: string;
  status: z.infer<typeof checkInStatusSchema>;
  onCheckedIn?: () => void;
}) {
  return (
    <CheckInNowButton
      vaultId={vaultId}
      status={status}
      label="Điểm danh"
      className="overview-primary-action w-full"
      onCheckedIn={onCheckedIn}
    />
  );
}
