import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";

/**
 * Các mốc thời gian và hạn mức do Admin cấu hình, hiện trong câu chữ cho người dùng
 * (GET /settings/public trả mọi tham số đang bật). Chưa tải được hoặc Admin chưa đặt thì dùng mức gốc dưới đây,
 * khớp với mặc định của Backend.
 */
export interface PolicyWindows {
  /** Giờ Chủ kho được phản đối hồ sơ chứng tử (DeathCase.ObjectionHours). */
  objectionHours: number;
  /** Ngày Chủ kho gửi selfie sau khi báo còn sống (Alive.SelfieWindowDays). */
  selfieDays: number;
  /** Ngày lời mời Người thực thi còn hiệu lực (Executor.InvitationExpiresDays). */
  executorInviteDays: number;
  /** Phút tối thiểu giữa hai lần gửi lại lời mời (Handover.ResendCooldownMinutes). */
  resendCooldownMinutes: number;
  /** Ngày người nhận phản hồi lời mời (Handover.ResponseWindowDays). */
  responseDays: number;
  /** Ngày người nhận được xem/tải sau khi đồng ý (Handover.GrantWindowDays). */
  grantDays: number;
  /** Dung lượng gói Free (MiB) (Plans.Free.QuotaMb). */
  freeQuotaMb: number;
  /** Số tệp tối đa trong một bản hồ sơ chứng tử (DeathCase.MaxFilesPerVersion). */
  deathCaseMaxFiles: number;
  /** Dung lượng tối đa một tệp hồ sơ chứng tử, MiB (DeathCase.MaxFileSizeMb). */
  deathCaseMaxFileMb: number;
}

export const DEFAULT_POLICY_WINDOWS: PolicyWindows = {
  objectionHours: 72,
  selfieDays: 7,
  executorInviteDays: 7,
  resendCooldownMinutes: 15,
  responseDays: 5,
  grantDays: 30,
  freeQuotaMb: 20,
  deathCaseMaxFiles: 10,
  deathCaseMaxFileMb: 20,
};

const KEYS: Record<keyof PolicyWindows, string> = {
  objectionHours: "DeathCase.ObjectionHours",
  selfieDays: "Alive.SelfieWindowDays",
  executorInviteDays: "Executor.InvitationExpiresDays",
  resendCooldownMinutes: "Handover.ResendCooldownMinutes",
  responseDays: "Handover.ResponseWindowDays",
  grantDays: "Handover.GrantWindowDays",
  freeQuotaMb: "Plans.Free.QuotaMb",
  deathCaseMaxFiles: "DeathCase.MaxFilesPerVersion",
  deathCaseMaxFileMb: "DeathCase.MaxFileSizeMb",
};

/** Lấy số nguyên dương từ bảng tham số; thiếu hoặc sai dạng thì trả fallback. */
export function readPolicyWindows(raw: unknown): PolicyWindows {
  const result: PolicyWindows = { ...DEFAULT_POLICY_WINDOWS };
  if (typeof raw !== "object" || raw === null) return result;
  const record = raw as Record<string, unknown>;
  for (const name of Object.keys(KEYS) as Array<keyof PolicyWindows>) {
    const value = record[KEYS[name]];
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      result[name] = value;
    }
  }
  return result;
}

/** Tham số công khai do Admin cấu hình; luôn có giá trị (mức gốc khi chưa tải xong). */
export function usePolicyWindows(): PolicyWindows {
  const query = useQuery({
    queryKey: ["public-settings"],
    queryFn: ({ signal }) => apiClient.get<unknown, unknown>("/settings/public", { signal }),
    staleTime: 60_000,
    retry: false,
  });
  return readPolicyWindows(query.data);
}
