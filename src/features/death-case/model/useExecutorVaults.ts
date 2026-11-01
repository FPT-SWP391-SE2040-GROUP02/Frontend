import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { deathCaseService } from "../api/deathCaseService";
import type { ExecutorVault } from "./deathCase.schema";

/** Khóa cache chung; các mutation hồ sơ làm mới khóa này để danh sách kho cập nhật. */
export const executorVaultsKey = ["executor-vaults"] as const;

const STORAGE_KEY = "lv-executor-vault";

/**
 * Các kho mà tài khoản đang là Executor hiệu lực. Không retry để 401/403 không bị gọi lặp.
 * Hồ sơ do Verifier quyết định ở phiên khác nên cache mặc định (5 phút) sẽ cũ: luôn tải lại khi mở màn hình
 * hoặc quay lại tab, và hỏi lại định kỳ khi đang xem.
 */
export function useExecutorVaults(enabled = true) {
  return useQuery({
    queryKey: executorVaultsKey,
    queryFn: ({ signal }) => deathCaseService.vaults(signal),
    retry: false,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(vaultId: string | null) {
  try {
    if (vaultId) window.sessionStorage.setItem(STORAGE_KEY, vaultId);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Chỉ là tiện ích nhớ lựa chọn; không có cũng không ảnh hưởng chức năng.
  }
}

/**
 * Kho Executor đang làm việc. Thứ tự: ?vault= trên URL, lựa chọn đã nhớ trong phiên, rồi kho duy nhất.
 * Nhiều kho mà chưa chọn thì selected = null để màn hình hiện bước "Chọn kho".
 */
export function useSelectedExecutorVault() {
  const query = useExecutorVaults();
  const [params, setParams] = useSearchParams();
  const vaults: ExecutorVault[] = query.data ?? [];
  const fromUrl = params.get("vault");
  const stored = readStored();
  const selected =
    vaults.find((vault) => vault.vaultId === fromUrl) ??
    vaults.find((vault) => vault.vaultId === stored) ??
    (vaults.length === 1 ? vaults[0] : null);
  const select = (vaultId: string) => {
    writeStored(vaultId);
    const next = new URLSearchParams(params);
    next.set("vault", vaultId);
    next.delete("caseId");
    setParams(next);
  };
  /** Bỏ lựa chọn để màn hình quay về bước "Chọn kho" (chỉ có nghĩa khi có nhiều kho). */
  const clear = () => {
    writeStored(null);
    const next = new URLSearchParams(params);
    next.delete("vault");
    next.delete("caseId");
    setParams(next);
  };
  return { query, vaults, selected, select, clear };
}
