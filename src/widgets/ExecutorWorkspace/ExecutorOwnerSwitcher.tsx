import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import type { ExecutorVault } from "@/features/death-case/model/deathCase.schema";
import {
  ownerInitials,
  sortVaultsByUrgency,
  vaultTask,
  type VaultUrgency,
} from "@/features/death-case/model/executorVaultTask";
import { Chip } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";

/** Màu chữ trạng thái trên nền sidebar tối. */
const SIDEBAR_STATUS_COLOR: Record<VaultUrgency, string> = {
  overdue: "text-[#F0A39B]",
  "death-case": "text-[#E6C98B]",
  safe: "text-[#8FD1B0]",
};

function OwnerBadge({ vault }: { vault: ExecutorVault }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-xs font-bold text-[#0A281E]"
    >
      {ownerInitials(vault.ownerFullName)}
    </span>
  );
}

/**
 * Ô "Đang làm việc với kho của" ở đầu sidebar Người thực hiện. Một kho: nhãn tĩnh, không bấm được.
 * Nhiều kho: bấm để đổi kho (kho cần xử lý lên trên) hoặc "Xem tất cả kho" để về danh sách kho.
 */
export function ExecutorOwnerSwitcher() {
  const { vaults, selected, select, clear } = useSelectedExecutorVault();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
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

  const heading = (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/60">
      Đang làm việc với kho của
    </p>
  );

  // Một kho: nhãn tĩnh, vào thẳng Tổng quan kho đó.
  if (vaults.length === 1) {
    const only = vaults[0];
    const task = vaultTask(only);
    return (
      <div className="mb-4">
        {heading}
        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3">
          <OwnerBadge vault={only} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{only.ownerFullName}</p>
            <p className={`text-xs ${SIDEBAR_STATUS_COLOR[task.urgency]}`}>{task.label}</p>
          </div>
        </div>
      </div>
    );
  }

  const sorted = sortVaultsByUrgency(vaults);
  let buttonBody;
  if (selected) {
    const task = vaultTask(selected);
    buttonBody = (
      <>
        <OwnerBadge vault={selected} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {selected.ownerFullName}
          </span>
          <span className={`block text-xs ${SIDEBAR_STATUS_COLOR[task.urgency]}`}>
            {task.label}
          </span>
        </span>
      </>
    );
  } else {
    buttonBody = (
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">Tất cả kho</span>
        <span className="block text-xs text-white/60">{vaults.length} kho bạn phụ trách</span>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative mb-4">
      {heading}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Đổi kho đang làm việc"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl border border-[#C9A45C] bg-white/5 p-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
      >
        {buttonBody}
        <ChevronDown
          className={`size-4 shrink-0 text-white/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Các kho bạn phụ trách"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-heritage-border bg-white p-2 text-heritage-primary shadow-xl"
        >
          <p className="px-2 py-1.5 text-xs font-semibold text-heritage-muted">
            {vaults.length} kho bạn phụ trách
          </p>
          {sorted.map((vault) => {
            const isSelected = selected?.vaultId === vault.vaultId;
            const task = vaultTask(vault);
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
                className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${isSelected ? "bg-[#FBF3E0]" : "hover:bg-[#F4F1E6]"}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0A281E] text-[11px] font-semibold text-white"
                >
                  {ownerInitials(vault.ownerFullName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{vault.ownerFullName}</span>
                  <Chip tone={task.tone} className="mt-1 px-2 py-0.5 text-[11px]">
                    {task.label}
                  </Chip>
                </span>
                {isSelected && (
                  <Check className="size-4 shrink-0 text-[#B88E4C]" aria-hidden="true" />
                )}
              </button>
            );
          })}
          <div className="mt-1 border-t border-heritage-border pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                clear();
                setOpen(false);
                navigate(ROUTES.EXECUTOR.ROOT);
              }}
              className="flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-sm font-medium hover:bg-[#F4F1E6]"
            >
              Xem tất cả kho
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
