import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import type { ExecutorVault } from "@/features/death-case/model/deathCase.schema";

function getStatusBadge(vault: ExecutorVault) {
  if (vault.checkInOverdue) {
    return {
      label: "Quá hạn điểm danh",
      tone: "danger" as const,
      className: "bg-[#fbe5e2] text-[#a32119] dark:bg-[#401a17] dark:text-[#ff9189]",
      icon: AlertCircle,
    };
  }
  if (vault.openDeathCaseId) {
    return {
      label: "Hồ sơ đang xử lý",
      tone: "warning" as const,
      className: "bg-[#fbefd2] text-[#8a5a0b] dark:bg-[#3a2d10] dark:text-[#efc56f]",
      icon: ShieldAlert,
    };
  }
  return {
    label: "Kho an toàn",
    tone: "success" as const,
    className: "bg-[#e1f2e9] text-[#1f7a55] dark:bg-[#10382a] dark:text-[#62d2a2]",
    icon: ShieldCheck,
  };
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "CK";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Bộ chuyển đổi nhanh giữa các Chủ kho dành cho Người thực thi (Executor).
 * Hỗ trợ chuyển đổi ngữ cảnh 1 cú click khi Executor được tin tưởng giao phó nhiều kho.
 */
export function ExecutorOwnerSwitcher() {
  const { vaults, selected, select } = useSelectedExecutorVault();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (vaults.length === 0) return null;

  // Trường hợp chỉ phụ trách 1 kho
  if (vaults.length === 1 && selected) {
    const status = getStatusBadge(selected);
    const StatusIcon = status.icon;
    return (
      <div className="mb-4 rounded-xl border border-heritage-border/70 bg-white/70 p-3 text-sm dark:bg-white/5">
        <p className="text-xs font-medium uppercase tracking-wider text-heritage-muted">Chủ kho phụ trách</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-heritage-primary text-xs font-bold text-white shadow-sm">
            {getInitials(selected.ownerFullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-heritage-primary">{selected.ownerFullName}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
              <StatusIcon className="size-3" aria-hidden="true" />
              {status.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const active = selected ?? vaults[0];
  const activeStatus = active ? getStatusBadge(active) : null;
  const ActiveIcon = activeStatus?.icon;

  return (
    <div ref={containerRef} className="relative mb-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-heritage-muted">Chủ kho đang làm việc</p>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Chọn chủ kho cần làm việc"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-heritage-border bg-white/80 p-3 text-left shadow-sm transition-all hover:border-heritage-primary/40 hover:bg-white dark:bg-white/5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-heritage-primary text-xs font-bold text-white shadow-sm">
            {active ? getInitials(active.ownerFullName) : "LV"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heritage-primary">
              {active?.ownerFullName ?? "Chọn chủ kho"}
            </p>
            {activeStatus && ActiveIcon && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${activeStatus.className}`}>
                <ActiveIcon className="size-3" aria-hidden="true" />
                {activeStatus.label}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-heritage-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Danh sách Chủ kho được phân công"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-heritage-border bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-[#0c2217]"
        >
          <div className="px-2 py-1.5 text-xs font-medium text-heritage-muted">
            Chuyển đổi nhanh ({vaults.length} chủ kho)
          </div>
          {vaults.map((vault) => {
            const isSelected = selected?.vaultId === vault.vaultId;
            const status = getStatusBadge(vault);
            const StatusIcon = status.icon;
            return (
              <button
                key={vault.vaultId}
                type="button"
                role="menuitem"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => {
                  select(vault.vaultId);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2.5 rounded-lg p-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-[#fbf3e0] text-[#7a5a22] font-semibold dark:bg-[#1d2c1d] dark:text-[#e2c17d]"
                    : "hover:bg-[#efece6] text-heritage-primary dark:hover:bg-white/10"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-heritage-primary/90 text-xs font-semibold text-white">
                    {getInitials(vault.ownerFullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{vault.ownerFullName}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${status.className}`}>
                      <StatusIcon className="size-2.5" aria-hidden="true" />
                      {status.label}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="size-4 shrink-0 text-[#b88e4c]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
