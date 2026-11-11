import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  deriveNotifications,
  type ExecutorNotification,
  type NotificationTone,
} from "../model/notifications";
import { useActiveCaseId, useDeathCase } from "../model/useDeathCase";
import { useSelectedExecutorVault } from "../model/useExecutorVaults";

const KEY_PREFIX = "lv-executor-bell:";

/** Dự phòng khi trình duyệt chặn Web Storage: vẫn nhớ trong phiên trang hiện tại. */
const seenInMemory = new Map<string, Set<string>>();

function readSeen(vaultId: string): Set<string> {
  const remembered = seenInMemory.get(vaultId);
  if (remembered) return new Set(remembered);
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + vaultId);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === "string"));
    }
  } catch {
    // Chỉ là tiện ích đánh dấu đã đọc; không đọc được thì coi như chưa đọc.
  }
  return new Set();
}

function writeSeen(vaultId: string, ids: Set<string>) {
  seenInMemory.set(vaultId, new Set(ids));
  try {
    window.localStorage.setItem(KEY_PREFIX + vaultId, JSON.stringify(Array.from(ids)));
  } catch {
    // Không lưu được thì lần sau chuông hiện lại chấm, không ảnh hưởng nghiệp vụ.
  }
}

const TONE_STYLE: Record<NotificationTone, { icon: LucideIcon; badge: string; card: string }> = {
  attention: {
    icon: AlertTriangle,
    badge: "bg-[#F1E6CC] text-[#7A5B25]",
    card: "border-[#E3CFA0] bg-[#FBF5E6]",
  },
  info: {
    icon: Info,
    badge: "bg-[#E6EEF0] text-[#2F5560]",
    card: "border-heritage-border bg-white",
  },
  success: {
    icon: CheckCircle2,
    badge: "bg-[#DDF1E7] text-[#1F7A55]",
    card: "border-heritage-border bg-white",
  },
  danger: {
    icon: XCircle,
    badge: "bg-[#F8E0DE] text-[#A32119]",
    card: "border-[#EBC3BF] bg-[#FDF3F2]",
  },
};

/** Một thông báo: biểu tượng theo mức chú ý, dòng đầu đậm, lý do bên dưới, giờ ở cuối, nhãn "Mới" nếu chưa đọc. */
function NotificationRow({ item, fresh }: { item: ExecutorNotification; fresh: boolean }) {
  const style = TONE_STYLE[item.tone];
  const Icon = style.icon;
  return (
    <li className={`flex gap-3 rounded-xl border p-3.5 ${style.card}`}>
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.badge}`}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-5 text-heritage-primary">{item.title}</p>
          {fresh && (
            <span className="shrink-0 rounded-full bg-[#A32119] px-2 py-0.5 text-[11px] font-semibold text-white">
              Mới
            </span>
          )}
        </div>
        {item.detail && <p className="text-sm leading-5 text-heritage-primary/80">{item.detail}</p>}
        {item.at && (
          <time dateTime={item.at} className="block text-xs text-heritage-muted">
            {formatDateTime(item.at)}
          </time>
        )}
      </div>
    </li>
  );
}

/**
 * Chuông thông báo ở đầu trang Người thực thi. Chỉ dựng từ dữ liệu Backend đã trả cho kho đang chọn;
 * chưa chọn kho (nhiều kho) hoặc chưa có thông báo nào thì không hiện chuông.
 */
export function NotificationBell() {
  const { selected } = useSelectedExecutorVault();
  const caseId = useActiveCaseId(selected);
  const record = useDeathCase(caseId).data;
  const [open, setOpen] = useState(false);
  const [, setVersion] = useState(0);
  /** Các thông báo chưa đọc lúc mở hộp thoại, để đánh nhãn "Mới" dù đã ghi nhận là đã đọc. */
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  if (!selected) return null;
  const items = deriveNotifications(selected, record);
  if (items.length === 0) return null;
  const seen = readSeen(selected.vaultId);
  const unread = items.filter((item) => !seen.has(item.id)).length;
  const label = unread > 0 ? `Thông báo, ${unread} mới` : "Thông báo";
  const openList = () => {
    setFreshIds(new Set(items.filter((item) => !seen.has(item.id)).map((item) => item.id)));
    writeSeen(selected.vaultId, new Set(items.map((item) => item.id)));
    setVersion((version) => version + 1);
    setOpen(true);
  };
  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={openList}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-heritage-border bg-heritage-surface hover:bg-heritage-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-[#A32119] px-1 text-xs font-bold text-white"
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <Dialog open onOpenChange={(next) => !next && setOpen(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Thông báo</DialogTitle>
              <DialogDescription>Kho của {selected.ownerFullName}</DialogDescription>
            </DialogHeader>
            <ul className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
              {items.map((item) => (
                <NotificationRow key={item.id} item={item} fresh={freshIds.has(item.id)} />
              ))}
            </ul>
            <DialogFooter>
              <button type="button" className={buttonStyles.outline} onClick={() => setOpen(false)}>
                Đóng
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
