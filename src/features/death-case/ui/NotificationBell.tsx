import { useState } from "react";
import { Bell } from "lucide-react";
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
import { deriveNotifications } from "../model/notifications";
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
  if (!selected) return null;
  const items = deriveNotifications(selected, record);
  if (items.length === 0) return null;
  const seen = readSeen(selected.vaultId);
  const unread = items.filter((item) => !seen.has(item.id)).length;
  const label = unread > 0 ? `Thông báo, ${unread} mới` : "Thông báo";
  const openList = () => {
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
            <ul className="divide-y divide-heritage-border">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                  {item.at && (
                    <time dateTime={item.at} className="text-xs text-heritage-muted">
                      {formatDateTime(item.at)}
                    </time>
                  )}
                  <span className="text-sm">{item.text}</span>
                </li>
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
