import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Check,
  X,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  Sliders,
  Shield,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Clock,
  Archive,
  Users,
  FileText,
  AlertTriangle,
  CreditCard,
  Lock,
} from "lucide-react";
import { adminSettingsService } from "../api/adminSettingsService";
import type { SystemSetting } from "../model/adminSettings.types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Switch } from "@/shared/ui/switch";
import { describePlanKey, describePlanValue } from "../model/planCatalog";
import { PlanCatalogEditor } from "./PlanCatalogEditor";
import {
  DEFAULT_MAX_TOTAL_SLOTS,
  MAX_SLOT_PRICE_PER_YEAR,
  MAX_TOTAL_SLOTS_LIMIT,
} from "../model/planCatalog";
import { settingsSaveError } from "../model/adminError";

interface SettingMeta {
  key: string;
  label: string;
  category: string;
  categoryTitle: string;
  unit?: string;
  step?: number;
  defaultValue: string;
  description: string;
  src?: string;
  dataType: "NUMBER" | "BOOLEAN" | "STRING";
  isSecurity?: boolean;
}

const SETTING_DEFINITIONS: SettingMeta[] = [
  // 1. Điểm danh (Check-in)
  {
    key: "CheckIn.DefaultCycleDays",
    label: "Chu kỳ điểm danh mặc định",
    category: "CheckIn",
    categoryTitle: "Điểm danh định kỳ",
    unit: "ngày",
    step: 1,
    defaultValue: "30",
    description:
      "Chu kỳ điểm danh mặc định của chủ kho. Chủ kho vẫn chọn được 30, 60 hoặc 90 ngày.",
    src: "CheckInRules.DefaultCycleDays",
    dataType: "NUMBER",
  },
  {
    key: "CheckIn.DefaultGraceDays",
    label: "Thời gian chờ mặc định sau hạn",
    category: "CheckIn",
    categoryTitle: "Điểm danh định kỳ",
    unit: "ngày",
    step: 1,
    defaultValue: "7",
    description: "Hết thời gian chờ ân hạn thì hệ thống giao việc cho Người thực thi.",
    src: "CheckInRules.DefaultGraceDays",
    dataType: "NUMBER",
  },

  // 2. Bàn giao & Lưu trữ (Handover & Retention)
  {
    key: "Handover.ResponseWindowDays",
    label: "Hạn người nhận phản hồi lời mời",
    category: "Handover",
    categoryTitle: "Bàn giao & Lưu trữ",
    unit: "ngày",
    step: 1,
    defaultValue: "5",
    description: "Thời hạn tối đa để người nhận phản hồi lời mời tiếp nhận di sản.",
    src: "HandoverRules.ResponseWindow",
    dataType: "NUMBER",
  },
  {
    key: "Handover.DecisionWindowDays",
    label: "Hạn người nhận quyết định",
    category: "Handover",
    categoryTitle: "Bàn giao & Lưu trữ",
    unit: "ngày",
    step: 1,
    defaultValue: "7",
    description: "Thời hạn người nhận quyết định đồng ý nhận hoặc từ chối gói bàn giao.",
    src: "HandoverRules.DecisionWindow",
    dataType: "NUMBER",
  },
  {
    key: "Handover.GrantWindowDays",
    label: "Thời gian xem và tải sau khi nhận",
    category: "Handover",
    categoryTitle: "Bàn giao & Lưu trữ",
    unit: "ngày",
    step: 1,
    defaultValue: "30",
    description: "Thời gian được cấp quyền xem và tải tệp tài sản sau khi đã đồng ý nhận.",
    src: "HandoverRules.GrantWindow",
    dataType: "NUMBER",
  },
  {
    key: "Handover.RetentionWindowDays",
    label: "Lưu dữ liệu trước khi xóa",
    category: "Handover",
    categoryTitle: "Bàn giao & Lưu trữ",
    unit: "ngày",
    step: 1,
    defaultValue: "30",
    description: "Thời gian lưu trữ dữ liệu sau khi kết thúc bàn giao trước khi xóa hoàn toàn.",
    src: "RetentionRules.RetentionWindow",
    dataType: "NUMBER",
  },
  {
    key: "Handover.ResendCooldownMinutes",
    label: "Khoảng cách gửi lại lời mời",
    category: "Handover",
    categoryTitle: "Bàn giao & Lưu trữ",
    unit: "phút",
    step: 5,
    defaultValue: "15",
    description: "Khoảng cách tối thiểu giữa 2 lần gửi lại lời mời để tránh spam email.",
    src: "HandoverInvitationService.ResendCooldown",
    dataType: "NUMBER",
  },

  // 3. Người thực thi (Executor)
  {
    key: "Executor.InvitationExpiresDays",
    label: "Hạn lời mời Người thực thi",
    category: "Executor",
    categoryTitle: "Người thực thi",
    unit: "ngày",
    step: 1,
    defaultValue: "7",
    description: "Thời hạn hiệu lực của lời mời đảm nhận vai trò Người thực thi.",
    src: "Executors.ExpiresAt (7 ngày)",
    dataType: "NUMBER",
  },
  {
    key: "Executor.ReminderAfterHours",
    label: "Nhắc nhở lời mời sau",
    category: "Executor",
    categoryTitle: "Người thực thi",
    unit: "giờ",
    step: 6,
    defaultValue: "48",
    description: "Gửi email nhắc nhở người được mời nếu chưa phản hồi sau khoảng thời gian này.",
    src: "ExecutorInvitationJob.ReminderAfter",
    dataType: "NUMBER",
  },

  // 4. Hồ sơ chứng tử (DeathCase)
  {
    key: "DeathCase.SupplementDueDays",
    label: "Hạn Người thực thi bổ sung hồ sơ",
    category: "DeathCase",
    categoryTitle: "Hồ sơ chứng tử",
    unit: "ngày",
    step: 1,
    defaultValue: "7",
    description: "Hạn để Người thực thi nộp giấy tờ bổ sung khi Người xét duyệt yêu cầu.",
    src: "DeathCaseReviewRules.SupplementDueDays",
    dataType: "NUMBER",
  },
  {
    key: "DeathCase.MaxFilesPerVersion",
    label: "Số tệp tối đa mỗi bản hồ sơ",
    category: "DeathCase",
    categoryTitle: "Hồ sơ chứng tử",
    unit: "tệp",
    step: 1,
    defaultValue: "10",
    description: "Số lượng tệp bằng chứng giấy chứng tử tối đa được đính kèm.",
    src: "DeathCaseRules.MaxFilesPerVersion",
    dataType: "NUMBER",
  },
  {
    key: "DeathCase.MaxFileSizeMb",
    label: "Dung lượng tối đa mỗi tệp",
    category: "DeathCase",
    categoryTitle: "Hồ sơ chứng tử",
    unit: "MiB",
    step: 5,
    defaultValue: "20",
    description: "Kích thước tệp chứng từ tối đa cho mỗi lần tải lên.",
    src: "DeathCaseRules.MaxFileBytes",
    dataType: "NUMBER",
  },
  {
    key: "DeathCase.ReviewDueHours",
    label: "Hạn Người xét duyệt thẩm định",
    category: "DeathCase",
    categoryTitle: "Hồ sơ chứng tử",
    unit: "giờ",
    step: 6,
    defaultValue: "48",
    description: "Thời hạn SLA tối đa để Người xét duyệt phải ra quyết định về hồ sơ.",
    src: "DeathCaseRules.ReviewDueHours",
    dataType: "NUMBER",
  },
  {
    key: "DeathCase.MaxNoticeAttempts",
    label: "Số lần thông báo cho Chủ kho",
    category: "DeathCase",
    categoryTitle: "Hồ sơ chứng tử",
    unit: "lần",
    step: 1,
    defaultValue: "5",
    description: "Số lần gửi thông báo trước khi hệ thống đánh dấu lỗi và mở sự cố vận hành.",
    src: "DeathCaseRules.MaxNoticeAttempts",
    dataType: "NUMBER",
  },

  // 6. Sự cố & Tạm giữ (Incident & Hold)
  {
    key: "Incident.ReminderAfterHours",
    label: "Nhắc người phụ trách sau",
    category: "Incident",
    categoryTitle: "Sự cố & Tạm giữ",
    unit: "giờ",
    step: 6,
    defaultValue: "48",
    description: "Khoảng thời gian gửi cảnh báo nếu sự cố chưa có tiến triển xử lý.",
    src: "IncidentService.ReminderAfter",
    dataType: "NUMBER",
  },
  {
    key: "Incident.EscalateAfterHours",
    label: "Báo cáo lên Quản trị viên sau",
    category: "Incident",
    categoryTitle: "Sự cố & Tạm giữ",
    unit: "giờ",
    step: 6,
    defaultValue: "72",
    description: "Tự động leo thang sự cố lên cấp Quản trị viên cao nhất khi quá hạn SLA.",
    src: "IncidentService.EscalateAfter",
    dataType: "NUMBER",
  },
  {
    key: "Incident.MaxReviewIntervalDays",
    label: "Khoảng hẹn xem lại tối đa",
    category: "Incident",
    categoryTitle: "Sự cố & Tạm giữ",
    unit: "ngày",
    step: 1,
    defaultValue: "7",
    description: "Thời hạn tối đa cho một mốc hẹn xem lại sự cố tiếp theo.",
    src: "IncidentService.MaxReviewInterval",
    dataType: "NUMBER",
  },

  // 7. Giới hạn chống lạm dụng (Limits)
  {
    key: "Limits.MaxUploadsPerHour",
    label: "Tải lên tối đa mỗi giờ",
    category: "Limits",
    categoryTitle: "Giới hạn chống lạm dụng",
    unit: "lần",
    step: 10,
    defaultValue: "60",
    description: "Số lượt tải lên tối đa trong 1 giờ trên mỗi tài khoản nhằm chống lạm dụng.",
    src: "RateLimiting (SRS 1.2)",
    dataType: "NUMBER",
  },
  {
    key: "Limits.MaxAssetsPerVault",
    label: "Số tài sản tối đa mỗi kho",
    category: "Limits",
    categoryTitle: "Giới hạn chống lạm dụng",
    unit: "tài sản",
    step: 100,
    defaultValue: "2000",
    description: "Giới hạn số lượng mục tài sản kỹ thuật số tối đa cho một kho di sản.",
    src: "VaultLimits.MaxAssets",
    dataType: "NUMBER",
  },
  {
    key: "Limits.MaxUploadBytesMb",
    label: "Dung lượng tối đa mỗi tệp",
    category: "Limits",
    categoryTitle: "Giới hạn chống lạm dụng",
    unit: "MiB",
    step: 50,
    defaultValue: "500",
    description: "Dung lượng tệp tài sản tối đa cho mỗi lần tải lên hệ thống.",
    src: "StorageLimits.MaxUploadBytes",
    dataType: "NUMBER",
  },
  {
    key: "Limits.ReservationHoldMinutes",
    label: "Thời gian giữ chỗ khi tải lên",
    category: "Limits",
    categoryTitle: "Giới hạn chống lạm dụng",
    unit: "phút",
    step: 5,
    defaultValue: "15",
    description: "Thời gian giữ tạm dung lượng lưu trữ trước khi hoàn tất hoặc hủy tải lên.",
    src: "AssetService.ReservationHold",
    dataType: "NUMBER",
  },

  // 8. Bảo mật & Tính năng (Security & Features)
  {
    key: "Security.MaxPinAttempts",
    label: "Số lần nhập sai mã PIN tối đa",
    category: "Security",
    categoryTitle: "Bảo mật & Tính năng",
    unit: "lần",
    step: 1,
    defaultValue: "5",
    description: "Số lần cho phép thử mã PIN bảo vệ kho trước khi kích hoạt tạm khóa.",
    src: "VaultPinRules.MaxFailedAttempts",
    dataType: "NUMBER",
    isSecurity: true,
  },
  {
    key: "Security.PinLockoutMinutes",
    label: "Thời gian tạm khóa mã PIN",
    category: "Security",
    categoryTitle: "Bảo mật & Tính năng",
    unit: "phút",
    step: 5,
    defaultValue: "15",
    description: "Thời gian tài khoản bị tạm khóa sau khi nhập sai mã PIN vượt ngưỡng.",
    src: "AuthService.LockoutDuration",
    dataType: "NUMBER",
    isSecurity: true,
  },
  {
    key: "Features.MaintenanceMode",
    label: "Chế độ bảo trì toàn hệ thống",
    category: "Security",
    categoryTitle: "Bảo mật & Tính năng",
    defaultValue: "false",
    description: "Khi bật, chỉ tài khoản Quản trị viên mới được phép truy cập hệ thống.",
    src: "FeatureFlag.MaintenanceMode",
    dataType: "BOOLEAN",
    isSecurity: true,
  },
];

const CATEGORY_ICONS: Record<string, typeof Clock> = {
  CheckIn: Clock,
  Handover: Archive,
  Executor: Users,
  DeathCase: FileText,
  Alive: Shield,
  Incident: AlertTriangle,
  Limits: Sliders,
  Security: Lock,
};

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"params" | "plans">("params");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [filterMode, setFilterMode] = useState<"all" | "changed" | "security">("all");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    CheckIn: true,
    Handover: true,
  });

  // Local draft values (key -> { value: string, isEnabled: boolean })
  const [draft, setDraft] = useState<Record<string, { value: string; isEnabled: boolean }>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [auditReason, setAuditReason] = useState("");
  const [securityAcknowledged, setSecurityAcknowledged] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  /** Lỗi lưu hiện ngay trong hộp xác nhận (thông báo đầu trang bị hộp che mất). */
  const [saveError, setSaveError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-settings"],
    queryFn: ({ signal }) => adminSettingsService.getAll(signal),
  });

  // Map of server settings by key
  const serverMap = useMemo(() => {
    const map = new Map<string, SystemSetting>();
    for (const s of query.data ?? []) {
      map.set(s.key, s);
    }
    return map;
  }, [query.data]);

  // Helper to read setting value (draft takes precedence, then server, then default)
  const getValue = (key: string, defaultVal = ""): string => {
    if (draft[key]?.value !== undefined) return draft[key].value;
    const fromServer = serverMap.get(key)?.value;
    if (fromServer !== undefined) return fromServer;
    return defaultVal;
  };

  const getIsEnabled = (key: string, defaultEnabled = true): boolean => {
    if (draft[key]?.isEnabled !== undefined) return draft[key].isEnabled;
    const fromServer = serverMap.get(key)?.isEnabled;
    if (fromServer !== undefined) return fromServer;
    return defaultEnabled;
  };

  const setKeyValue = (key: string, nextVal: string) => {
    const serverVal = serverMap.get(key)?.value ?? "";
    const serverEnabled = serverMap.get(key)?.isEnabled ?? true;
    const currentEnabled = draft[key]?.isEnabled ?? serverEnabled;

    if (nextVal === serverVal && currentEnabled === serverEnabled) {
      setDraft((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setDraft((prev) => ({
        ...prev,
        [key]: { value: nextVal, isEnabled: currentEnabled },
      }));
    }
  };

  const toggleKeyEnabled = (key: string) => {
    const currentVal = getValue(key);
    const serverEnabled = serverMap.get(key)?.isEnabled ?? true;
    const nextEnabled = !getIsEnabled(key);
    const nextVal =
      currentVal === "true" || currentVal === "false" || key.endsWith(".On")
        ? nextEnabled
          ? "true"
          : "false"
        : currentVal;
    const serverVal = serverMap.get(key)?.value ?? "";

    if (nextEnabled === serverEnabled && nextVal === serverVal) {
      setDraft((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setDraft((prev) => ({
        ...prev,
        [key]: { value: nextVal, isEnabled: nextEnabled },
      }));
    }
  };

  const stepValue = (key: string, delta: number, min = 0, max = 100000000) => {
    const current = parseInt(getValue(key, "0"), 10);
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(min, Math.min(max, base + delta));
    setKeyValue(key, String(next));
  };

  const resetToDefault = (key: string, defaultVal: string) => {
    setKeyValue(key, defaultVal);
  };

  const discardDraft = () => {
    setDraft({});
  };

  // Compute diffs for confirmation
  const diffList = useMemo(() => {
    return Object.entries(draft).map(([k, d]) => {
      const server = serverMap.get(k);
      const oldVal = server ? server.value : "(mặc định)";
      const meta = SETTING_DEFINITIONS.find((m) => m.key === k);
      const label = describePlanKey(k) ?? (meta ? meta.label : k);
      return {
        key: k,
        label,
        oldValue: server ? describePlanValue(k, oldVal) : oldVal,
        newValue: describePlanValue(k, d.value),
        oldEnabled: server?.isEnabled ?? true,
        newEnabled: d.isEnabled,
        unit: meta?.unit,
      };
    });
  }, [draft, serverMap]);

  const isSensitiveKey = (k: string): boolean => {
    return (
      k.startsWith("Security.") ||
      k.startsWith("Features.") ||
      k.startsWith("Handover.Retention") ||
      k.startsWith("Billing.") ||
      Boolean(SETTING_DEFINITIONS.find((s) => s.key === k)?.isSecurity)
    );
  };

  const hasSensitiveChanges = useMemo(() => {
    return diffList.some((d) => isSensitiveKey(d.key));
  }, [diffList]);

  const batchMutation = useMutation({
    mutationFn: (data: {
      items: Array<{ key: string; value: string; isEnabled?: boolean }>;
      reason?: string;
    }) => adminSettingsService.batchUpdate(data.items, data.reason),
    onSuccess: (updated) => {
      queryClient.setQueryData<SystemSetting[]>(["admin-settings"], (old) => {
        if (!old) return updated;
        const map = new Map(old.map((s) => [s.key, s]));
        for (const u of updated) {
          map.set(u.key, u);
        }
        return Array.from(map.values());
      });
      setDraft({});
      setSaveError(null);
      setConfirmOpen(false);
      setAuditReason("");
      setSecurityAcknowledged(false);
      setNotice({
        text: `Đã lưu thành công ${updated.length} thay đổi cấu hình vào hệ thống và ghi nhận vào Audit Log.`,
        ok: true,
      });
      setTimeout(() => setNotice(null), 5000);
    },
    onError: (err: unknown) => {
      const message =
        settingsSaveError(err) ??
        "Không lưu được cấu hình. Kiểm tra lại các giá trị đã nhập rồi thử lại.";
      setSaveError(message);
      setNotice({ text: message, ok: false });
    },
  });

  const handleApplyChanges = () => {
    const items = Object.entries(draft).map(([key, d]) => ({
      key,
      value: d.value,
      isEnabled: d.isEnabled,
    }));
    setSaveError(null);
    batchMutation.mutate({ items, reason: auditReason.trim() });
  };

  // Group definitions for Tab 1
  const groupedSettings = useMemo(() => {
    const groups: Record<string, { title: string; items: SettingMeta[] }> = {};
    for (const def of SETTING_DEFINITIONS) {
      if (!groups[def.category]) {
        groups[def.category] = { title: def.categoryTitle, items: [] };
      }
      groups[def.category].items.push(def);
    }
    return groups;
  }, []);

  const toggleGroup = (cat: string) => {
    setOpenGroups((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="space-y-6 pb-24">
      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${
            notice.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.ok ? (
              <Check className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <p>{notice.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-inherit opacity-70 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Main Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-heritage-border pb-4">
        <div className="inline-flex rounded-xl border border-heritage-border bg-heritage-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("params")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "params"
                ? "bg-[#0A281E] text-white dark:bg-[#E0C486] dark:text-[#0A281E]"
                : "text-heritage-muted hover:bg-heritage-primary/5"
            }`}
          >
            <Sliders className="size-4" />
            Tham số hệ thống
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "plans"
                ? "bg-[#0A281E] text-white dark:bg-[#E0C486] dark:text-[#0A281E]"
                : "text-heritage-muted hover:bg-heritage-primary/5"
            }`}
          >
            <CreditCard className="size-4" />
            Bảng so sánh gói dịch vụ
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="min-h-10 gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Tải lại
          </Button>
        </div>
      </div>

      {/* TAB 1: THAM SỐ HỆ THỐNG */}
      {activeTab === "params" && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <Search
                className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Tìm tham số (ví dụ: tải lên, nhắc, hạn...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-11 bg-heritage-surface pl-9 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filterMode === "all"
                    ? "bg-[#0A281E] text-white dark:bg-[#E0C486] dark:text-[#0A281E]"
                    : "border border-heritage-border bg-heritage-surface text-heritage-muted hover:bg-heritage-primary/5"
                }`}
              >
                Tất cả ({SETTING_DEFINITIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("changed")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filterMode === "changed"
                    ? "bg-amber-600 text-white"
                    : "border border-heritage-border bg-heritage-surface text-heritage-muted hover:bg-heritage-primary/5"
                }`}
              >
                Đã sửa ({diffList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("security")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filterMode === "security"
                    ? "bg-red-700 text-white"
                    : "border border-heritage-border bg-heritage-surface text-heritage-muted hover:bg-heritage-primary/5"
                }`}
              >
                Bảo mật
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {["Tất cả", ...Object.keys(groupedSettings)].map((cat) => {
              const label = cat === "Tất cả" ? "Tất cả nhóm" : groupedSettings[cat]?.title || cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#0A281E] text-white dark:bg-[#E0C486] dark:text-[#0A281E]"
                      : "border border-heritage-border bg-heritage-surface text-heritage-muted hover:bg-heritage-primary/5"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Grouped Settings Accordion */}
          <div className="space-y-4">
            {Object.entries(groupedSettings).map(([catKey, group]) => {
              const Icon = CATEGORY_ICONS[catKey] ?? Sliders;
              const isOpen = openGroups[catKey] ?? false;

              // Filter items inside this group
              const items = group.items.filter((item) => {
                if (filterMode === "changed") {
                  return draft[item.key] !== undefined;
                }
                if (filterMode === "security") {
                  return item.isSecurity;
                }
                if (selectedCategory !== "Tất cả" && selectedCategory !== catKey) {
                  return false;
                }
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                  item.label.toLowerCase().includes(q) ||
                  item.description.toLowerCase().includes(q) ||
                  item.key.toLowerCase().includes(q)
                );
              });

              if (items.length === 0) return null;

              const changedInGroup = items.filter((i) => draft[i.key] !== undefined).length;

              return (
                <section
                  key={catKey}
                  className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(catKey)}
                    className="flex w-full items-center justify-between border-b border-heritage-border/60 bg-heritage-surface px-5 py-4 text-left transition-colors hover:bg-heritage-primary/5"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-heritage-primary/10 text-heritage-primary">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-heritage-primary">
                          {group.title}
                        </h2>
                        <p className="text-xs text-heritage-muted">
                          {items.length} tham số cấu hình
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {changedInGroup > 0 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {changedInGroup} đã sửa
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="size-5 text-heritage-muted" />
                      ) : (
                        <ChevronRight className="size-5 text-heritage-muted" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-heritage-border/40 px-5">
                      {items.map((item) => {
                        const currentVal = getValue(item.key, item.defaultValue);
                        const isChanged = draft[item.key] !== undefined;
                        const isEnabled = getIsEnabled(item.key, true);
                        const serverVal = serverMap.get(item.key)?.value ?? item.defaultValue;

                        return (
                          <div
                            key={item.key}
                            className={`flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center ${
                              isChanged ? "rounded-xl bg-amber-50/40 px-2" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-heritage-text">
                                  {item.label}
                                </span>
                                {item.isSecurity && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-800">
                                    Bảo mật
                                  </span>
                                )}
                                <span className="font-mono text-[11px] text-muted-foreground opacity-80">
                                  {item.key}
                                </span>
                              </div>
                              <p className="text-xs text-heritage-muted">{item.description}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 sm:shrink-0">
                              {item.dataType === "BOOLEAN" ? (
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={currentVal === "true"}
                                    onCheckedChange={(checked) =>
                                      setKeyValue(item.key, checked ? "true" : "false")
                                    }
                                    aria-label={item.label}
                                  />
                                  <span
                                    className={`text-xs font-semibold ${
                                      currentVal === "true"
                                        ? "text-green-700 dark:text-green-400"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    {currentVal === "true" ? "Bật" : "Tắt"}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center rounded-lg border border-heritage-border bg-white shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => stepValue(item.key, -(item.step ?? 1), 0)}
                                    className="flex size-9 items-center justify-center text-heritage-muted transition-colors hover:bg-zinc-100 hover:text-heritage-text"
                                    aria-label={`Giảm ${item.label}`}
                                  >
                                    <Minus className="size-3.5" />
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={currentVal}
                                    onChange={(e) =>
                                      setKeyValue(item.key, e.target.value.replace(/\D/g, ""))
                                    }
                                    className="h-9 w-20 text-center font-mono text-sm font-semibold focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => stepValue(item.key, item.step ?? 1)}
                                    className="flex size-9 items-center justify-center text-heritage-muted transition-colors hover:bg-zinc-100 hover:text-heritage-text"
                                    aria-label={`Tăng ${item.label}`}
                                  >
                                    <Plus className="size-3.5" />
                                  </button>
                                  {item.unit && (
                                    <span className="border-l border-zinc-200 px-3 text-xs font-medium text-heritage-muted">
                                      {item.unit}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                {isChanged && (
                                  <span className="text-[11px] font-medium text-amber-700">
                                    Cũ: {serverVal} {item.unit}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleKeyEnabled(item.key)}
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                                    isEnabled
                                      ? "bg-green-100 text-green-800"
                                      : "bg-zinc-200 text-zinc-600"
                                  }`}
                                >
                                  {isEnabled ? "Đang bật" : "Tắt"}
                                </button>
                                {currentVal !== item.defaultValue && (
                                  <button
                                    type="button"
                                    onClick={() => resetToDefault(item.key, item.defaultValue)}
                                    className="text-[11px] font-semibold text-heritage-gold underline hover:text-amber-800"
                                  >
                                    Về mặc định ({item.defaultValue})
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BẢNG SO SÁNH GÓI DỊCH VỤ (PLANS MATRIX) */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-heritage-border bg-heritage-surface p-4">
            <div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                Chính sách CS-2026.11 đang áp dụng
              </span>
              <p className="mt-1 text-xs text-heritage-muted">
                Mỗi gói một cột, mỗi kỳ bán một dòng. Chỉnh giá, hạn mức, bật hoặc tắt bán, thêm
                hoặc xóa kỳ trực tiếp tại ô. Mọi thay đổi chỉ áp dụng cho đơn mới tạo, không làm sai
                lệch đơn cũ. Trang Gói dịch vụ của người dùng tự xếp các gói từ rẻ đến đắt theo giá
                kỳ ngắn nhất, nên bạn đặt giá thế nào cũng được. Giá mỗi kỳ tối đa 50.000.000đ để
                tránh gõ thừa số 0 và giữ mỗi đơn trong mức chuyển khoản.
              </p>
            </div>
          </div>

          <PlanCatalogEditor getValue={getValue} setKeyValue={setKeyValue} />

          {/* Sub-card: Add-on & Order Limits */}
          <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-heritage-primary">
              Suất người nhận thêm và thanh toán SePay
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-heritage-muted">
                  Giá một suất thêm / năm
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={getValue("Plans.Addon.SlotPricePerYear", "49000")}
                    onChange={(e) =>
                      setKeyValue("Plans.Addon.SlotPricePerYear", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-9 font-mono text-sm font-semibold"
                  />
                  <span className="text-xs text-heritage-muted">đ</span>
                </div>
                {parseInt(getValue("Plans.Addon.SlotPricePerYear", "49000"), 10) >
                  MAX_SLOT_PRICE_PER_YEAR && (
                  <p role="alert" className="text-[11px] text-red-700">
                    Tối đa {MAX_SLOT_PRICE_PER_YEAR.toLocaleString("vi-VN")}đ mỗi năm
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-heritage-muted">
                  Số suất thêm tối đa / đơn
                </label>
                <div className="flex items-center rounded-lg border border-heritage-border bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => stepValue("Plans.Addon.MaxSlotsPerOrder", -1, 1)}
                    className="flex size-9 items-center justify-center text-heritage-muted hover:bg-zinc-100"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={getValue("Plans.Addon.MaxSlotsPerOrder", "20")}
                    onChange={(e) =>
                      setKeyValue("Plans.Addon.MaxSlotsPerOrder", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-9 w-full text-center font-mono text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => stepValue("Plans.Addon.MaxSlotsPerOrder", 1)}
                    className="flex size-9 items-center justify-center text-heritage-muted hover:bg-zinc-100"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <span className="border-l border-zinc-200 px-3 text-xs text-heritage-muted">
                    suất
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-heritage-muted">
                  Tổng người nhận tối đa / tài khoản
                </label>
                <div className="flex items-center rounded-lg border border-heritage-border bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      stepValue("Plans.Addon.MaxTotalSlots", -5, 1, MAX_TOTAL_SLOTS_LIMIT)
                    }
                    className="flex size-9 items-center justify-center text-heritage-muted hover:bg-zinc-100"
                    aria-label="Giảm tổng người nhận tối đa"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={getValue("Plans.Addon.MaxTotalSlots", String(DEFAULT_MAX_TOTAL_SLOTS))}
                    onChange={(e) =>
                      setKeyValue("Plans.Addon.MaxTotalSlots", e.target.value.replace(/\D/g, ""))
                    }
                    aria-label="Tổng người nhận tối đa mỗi tài khoản"
                    className="h-9 w-full text-center font-mono text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      stepValue("Plans.Addon.MaxTotalSlots", 5, 1, MAX_TOTAL_SLOTS_LIMIT)
                    }
                    className="flex size-9 items-center justify-center text-heritage-muted hover:bg-zinc-100"
                    aria-label="Tăng tổng người nhận tối đa"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <span className="border-l border-zinc-200 px-3 text-xs text-heritage-muted">
                    người
                  </span>
                </div>
                <p className="text-[11px] text-heritage-muted">
                  Gồm cả suất kèm gói. Mua nhiều đơn cũng không vượt số này.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-heritage-muted">
                  Hạn đơn chờ thanh toán SePay
                </label>
                <div className="flex items-center rounded-lg border border-heritage-border bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => stepValue("Plans.Addon.OrderTimeoutMinutes", -5, 5)}
                    className="flex size-9 items-center justify-center text-heritage-muted hover:bg-zinc-100"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={getValue("Plans.Addon.OrderTimeoutMinutes", "15")}
                    onChange={(e) =>
                      setKeyValue(
                        "Plans.Addon.OrderTimeoutMinutes",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    className="h-9 w-full text-center font-mono text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => stepValue("Plans.Addon.OrderTimeoutMinutes", 5)}
                    className="flex size-9 items-center justify-center text-heritage-muted hover:bg-zinc-100"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <span className="border-l border-zinc-200 px-3 text-xs text-heritage-muted">
                    phút
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* STICKY DIRTY BAR AT BOTTOM */}
      {diffList.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-heritage-gold bg-heritage-surface p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-heritage-primary">
                  {diffList.length} thay đổi cấu hình chưa áp dụng
                </p>
                <p className="text-xs text-heritage-muted">
                  Chỉ áp dụng cho đơn mới và việc mới, không hồi tố đơn đã chốt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={discardDraft}
                className="min-h-10 text-xs font-semibold"
              >
                Hủy thay đổi
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSaveError(null);
                  setConfirmOpen(true);
                }}
                className="min-h-10 bg-[#E0C486] text-xs font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
              >
                Xem thay đổi và lưu ({diffList.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION / DIFFS MODAL */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Lưu {diffList.length} thay đổi tham số hệ thống</DialogTitle>
            <DialogDescription>
              Kiểm tra bảng so sánh giá trị cũ và giá trị mới bên dưới trước khi xác nhận cập nhật.
            </DialogDescription>
          </DialogHeader>

          {hasSensitiveChanges && (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs font-medium text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-red-900 dark:text-red-100">
                  CẢNH BÁO AN NINH & VẬN HÀNH HỆ THỐNG
                </p>
                <p className="leading-relaxed text-red-800 dark:text-red-300">
                  Danh sách này bao gồm các tham số nhạy cảm (bảo mật, hạn mức lưu trữ, chế độ bảo
                  trì hoặc tài chính). Mọi thao tác thay đổi sẽ được ghi nhận vĩnh viễn vào{" "}
                  <strong>Nhật ký kiểm toán (Audit Log)</strong> kèm định danh tài khoản Quản trị
                  viên, địa chỉ IP và lý do bắt buộc.
                </p>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-xl border border-heritage-border bg-white">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-heritage-border bg-zinc-50 font-semibold text-heritage-muted">
                <tr>
                  <th className="p-3">Tham số</th>
                  <th className="p-3">Hiện tại</th>
                  <th className="p-3">Mới</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {diffList.map((d) => {
                  const sensitive = isSensitiveKey(d.key);
                  return (
                    <tr key={d.key} className={sensitive ? "bg-red-50/30" : ""}>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <b className="text-heritage-primary">{d.label}</b>
                          {sensitive && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-800 dark:bg-red-900/50 dark:text-red-200">
                              Nhạy cảm
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">{d.key}</span>
                      </td>
                      <td className="p-3 font-mono">
                        {d.oldValue === "true" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-green-700">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            true (bật)
                          </span>
                        ) : d.oldValue === "false" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            false (tắt)
                          </span>
                        ) : (
                          <span className="text-zinc-500">
                            {d.oldValue} {d.unit ?? ""}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {d.newValue === "true" ? (
                          <span className="inline-flex items-center gap-1 text-green-700">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            true (bật)
                          </span>
                        ) : d.newValue === "false" ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            false (tắt)
                          </span>
                        ) : (
                          <span className="text-green-700">
                            {d.newValue} {d.unit ?? ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-heritage-text">
              Lý do thay đổi (bắt buộc lưu vào Nhật ký kiểm toán Audit Log)
            </label>
            <Textarea
              rows={2}
              placeholder="Ví dụ: Điều chỉnh hạn mức chu kỳ điểm danh và cập nhật bảng giá XS Max theo chính sách mới..."
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              className="text-xs"
            />
          </div>

          {hasSensitiveChanges && (
            <label className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs font-semibold text-red-950 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200 cursor-pointer">
              <input
                type="checkbox"
                checked={securityAcknowledged}
                onChange={(e) => setSecurityAcknowledged(e.target.checked)}
                className="mt-0.5 size-4 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span>
                Tôi xác nhận là Quản trị viên có thẩm quyền, đã kiểm tra kỹ lưỡng các tham số nhạy
                cảm và chịu trách nhiệm về quyết định áp dụng này.
              </span>
            </label>
          )}

          {saveError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900"
            >
              Không lưu được: {saveError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={batchMutation.isPending}
            >
              Quay lại
            </Button>
            <Button
              onClick={handleApplyChanges}
              disabled={
                batchMutation.isPending ||
                !auditReason.trim() ||
                (hasSensitiveChanges && (!securityAcknowledged || auditReason.trim().length < 5))
              }
              className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
            >
              {batchMutation.isPending ? "Đang lưu..." : "Xác nhận và áp dụng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
