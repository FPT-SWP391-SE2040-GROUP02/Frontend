import { useQuery } from "@tanstack/react-query";
import { POLLING_INTERVAL } from "@/shared/config";
import { handoverRecordService } from "../api/handoverRecordService";
import { verifierReportService } from "../api/verifierReportService";

/** Khóa cache của biên bản; mọi thao tác ký, chốt, mở lại làm mới các khóa dưới gốc này. */
export const handoverRecordKeys = {
  root: ["handover-record"] as const,
  verifierList: () => ["handover-record", "verifier", "list"] as const,
  reports: () => ["handover-record", "verifier", "reports"] as const,
  verifier: (recordId: string) => ["handover-record", "verifier", recordId] as const,
  executor: (vaultId: string) => ["handover-record", "executor", vaultId] as const,
  recipient: (turnId: string) => ["handover-record", "recipient", turnId] as const,
};

/** Biên bản được giao cho luật sư đang đăng nhập. */
export function useVerifierRecords() {
  return useQuery({
    queryKey: handoverRecordKeys.verifierList(),
    queryFn: ({ signal }) => handoverRecordService.list(signal),
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
  });
}

/** Hồ sơ báo tin được giao cho luật sư đang đăng nhập. */
export function useVerifierReports() {
  return useQuery({
    queryKey: handoverRecordKeys.reports(),
    queryFn: ({ signal }) => verifierReportService.list(signal),
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
  });
}

/** Hồ sơ báo tin còn chờ luật sư xét; dùng để đếm việc ở menu và Tổng quan. */
export function usePendingReports() {
  const reports = useVerifierReports();
  const waiting = (reports.data ?? []).filter(
    (report) => report.status === "SUBMITTED" || report.status === "SUPPLEMENT_REQUESTED",
  );
  return { ...reports, waiting };
}

export function useVerifierRecord(recordId: string | null) {
  return useQuery({
    queryKey: handoverRecordKeys.verifier(recordId ?? "none"),
    queryFn: ({ signal }) => handoverRecordService.get(recordId!, signal),
    enabled: Boolean(recordId),
    retry: false,
    refetchInterval: POLLING_INTERVAL.FAST,
    refetchIntervalInBackground: false,
  });
}

/** Biên bản của kho Người thực thi đang chọn; null khi chưa có yêu cầu nhận tài sản. */
export function useExecutorRecord(vaultId: string) {
  return useQuery({
    queryKey: handoverRecordKeys.executor(vaultId),
    queryFn: ({ signal }) => handoverRecordService.getForExecutor(vaultId, signal),
    retry: false,
    refetchInterval: POLLING_INTERVAL.FAST,
    refetchIntervalInBackground: false,
  });
}

/** Biên bản nhìn từ lượt của người nhận. */
export function useRecipientRecord(turnId: string | null, enabled = true) {
  return useQuery({
    queryKey: handoverRecordKeys.recipient(turnId ?? "none"),
    queryFn: ({ signal }) => handoverRecordService.getForRecipient(turnId!, signal),
    enabled: Boolean(turnId) && enabled,
    retry: false,
    refetchInterval: POLLING_INTERVAL.FAST,
    refetchIntervalInBackground: false,
  });
}
