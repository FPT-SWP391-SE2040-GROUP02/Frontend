import { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { z } from "zod";

/** Header BE đọc mã PIN kho (docs/api-contract.md mục 6.20). Không bao giờ ghi vào log hay storage. */
export const VAULT_PIN_HEADER = "X-Vault-Pin";

export type VaultPinPromptReason = "required" | "invalid";

export interface VaultPinPromptRequest {
  vaultId: string;
  reason: VaultPinPromptReason;
  /** Còn mấy lần nhập sai trước khi bị khóa; chỉ có khi reason = "invalid". */
  attemptsRemaining?: number;
}

/**
 * Giao diện hỏi mã PIN do app đăng ký (shared transport không import feature/app, giống subscribeSessionFailure).
 * Mọi hàm trả null (hoặc không làm gì) khi người dùng hủy; transport khi đó giữ nguyên lỗi gốc của Backend.
 */
export interface VaultPinHandler {
  /** Hỏi PIN hiện tại; trả PIN người dùng nhập hoặc null khi hủy. */
  requestPin(request: VaultPinPromptRequest): Promise<string | null>;
  /** Kho chưa có PIN: mở hộp thoại đặt PIN. Trả PIN vừa đặt hoặc null khi hủy. */
  requestNewPin(vaultId: string): Promise<string | null>;
  /** PIN đang bị khóa tạm. */
  notifyLocked(lockedUntil: string | undefined): void;
  /** Vừa tạo tài sản thành công: nếu kho cần PIN mà chưa đặt thì mời đặt ngay. Không chặn request tạo tài sản. */
  afterAssetCreated(vaultId: string): void;
}

let handler: VaultPinHandler | null = null;

/** App gọi một lần khi mount; trả hàm gỡ đăng ký. */
export function registerVaultPinHandler(next: VaultPinHandler): () => void {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const VAULT_ID_IN_URL = new RegExp(`/vaults/(${UUID})(?:/|\\?|$)`, "i");
/** Chính API quản lý PIN tự xử lý lỗi của mình ngay trên form, không đi qua hộp thoại chung. */
const PIN_MANAGEMENT_URL = new RegExp(`/vaults/${UUID}/pin(?:/|\\?|$)`, "i");
const ASSET_CREATE_URL = new RegExp(`/vaults/(${UUID})/assets(?:/text)?/?(?:\\?.*)?$`, "i");

const pinProblemSchema = z.object({
  code: z.string().optional(),
  attemptsRemaining: z.number().optional(),
  lockedUntil: z.string().optional(),
});

type Retry = (config: InternalAxiosRequestConfig) => Promise<unknown>;
export type VaultPinFailureResult = { handled: true; value: unknown } | { handled: false };

/**
 * Khi Backend đòi PIN (thiếu, sai, chưa đặt) cho một thao tác của kho: hỏi người dùng qua handler đã đăng ký rồi
 * gửi lại đúng request đó kèm header PIN. Sai tiếp thì hỏi lại (request gửi lại đi qua đây lần nữa) cho tới khi
 * đúng, bị khóa hoặc người dùng hủy. Hủy/khóa/không có handler → handled=false để lỗi gốc đi tiếp.
 */
export async function resolveVaultPinFailure(
  error: AxiosError,
  retry: Retry,
): Promise<VaultPinFailureResult> {
  const config = error.config;
  const active = handler;
  if (!config || !active || !error.response) return { handled: false };
  const url = config.url ?? "";
  const vaultId = VAULT_ID_IN_URL.exec(url)?.[1];
  if (!vaultId || PIN_MANAGEMENT_URL.test(url)) return { handled: false };

  const parsed = pinProblemSchema.safeParse(error.response.data);
  if (!parsed.success) return { handled: false };
  const { code, attemptsRemaining, lockedUntil } = parsed.data;

  let pin: string | null = null;
  if (code === "VAULT_PIN_REQUIRED" || code === "INVALID_VAULT_PIN") {
    pin = await active.requestPin({
      vaultId,
      reason: code === "INVALID_VAULT_PIN" ? "invalid" : "required",
      attemptsRemaining,
    });
  } else if (code === "VAULT_PIN_NOT_SET") {
    pin = await active.requestNewPin(vaultId);
  } else if (code === "VAULT_PIN_LOCKED") {
    active.notifyLocked(lockedUntil);
  }
  if (pin === null) return { handled: false };

  config.headers.set(VAULT_PIN_HEADER, pin);
  return { handled: true, value: await retry(config) };
}

/** Sau khi tạo tài sản (201) báo handler để mời đặt PIN nếu kho cần mà chưa có. Lỗi của handler không ảnh hưởng request. */
export function notifyAssetCreated(config: InternalAxiosRequestConfig, status: number): void {
  if (!handler || status !== 201 || config.method?.toLowerCase() !== "post") return;
  const vaultId = ASSET_CREATE_URL.exec(config.url ?? "")?.[1];
  if (!vaultId) return;
  try {
    handler.afterAssetCreated(vaultId);
  } catch {
    // Mời đặt PIN là phụ; lần tạo tài sản kế tiếp Backend vẫn chặn nếu chưa có PIN.
  }
}
