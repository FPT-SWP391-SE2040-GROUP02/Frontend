import { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from "axios";
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
type PinProblem = z.infer<typeof pinProblemSchema>;
export type VaultPinFailureResult = { handled: true; value: unknown } | { handled: false };

const PIN_CODES = new Set([
  "VAULT_PIN_REQUIRED",
  "INVALID_VAULT_PIN",
  "VAULT_PIN_NOT_SET",
  "VAULT_PIN_LOCKED",
]);

/** Hỏi người dùng theo mã lỗi PIN của Backend; trả PIN vừa nhập/đặt, hoặc null khi hủy, bị khóa hay mã khác. */
async function askForPin(
  active: VaultPinHandler,
  vaultId: string,
  problem: PinProblem,
): Promise<string | null> {
  const { code, attemptsRemaining, lockedUntil } = problem;
  if (code === "VAULT_PIN_REQUIRED" || code === "INVALID_VAULT_PIN") {
    return active.requestPin({
      vaultId,
      reason: code === "INVALID_VAULT_PIN" ? "invalid" : "required",
      attemptsRemaining,
    });
  }
  if (code === "VAULT_PIN_NOT_SET") return active.requestNewPin(vaultId);
  if (code === "VAULT_PIN_LOCKED") active.notifyLocked(lockedUntil);
  return null;
}

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

  const pin = await askForPin(active, vaultId, parsed.data);
  if (pin === null) return { handled: false };

  config.headers.set(VAULT_PIN_HEADER, pin);
  return { handled: true, value: await retry(config) };
}

/** Kết quả hỏi PIN trước một thao tác. `pin` trống khi kho chưa cần PIN (chưa có tài sản, chưa đặt PIN). */
export type VaultPinConfirmation = { confirmed: true; pin?: string } | { confirmed: false };

/**
 * Hỏi mã PIN trước một thao tác (không đợi Backend đòi), dùng chung hộp thoại PIN của app. `check` gửi PIN cho
 * Backend kiểm (lần đầu không kèm PIN): thiếu/sai thì hỏi lại kèm số lần còn lại, kho chưa có PIN thì mời đặt,
 * bị khóa thì báo khóa. Hủy hoặc bị khóa → confirmed=false. Lỗi không phải lỗi PIN, hoặc app chưa đăng ký hộp
 * thoại, thì ném lại cho caller hiện thông báo. PIN trả về chỉ giữ trong RAM, không ghi log hay storage.
 */
export async function confirmVaultPin(
  vaultId: string,
  check: (pin?: string) => Promise<void>,
): Promise<VaultPinConfirmation> {
  let pin: string | undefined = undefined;
  for (;;) {
    try {
      await check(pin);
      return { confirmed: true, pin };
    } catch (error) {
      const active = handler;
      const parsed = pinProblemSchema.safeParse(isAxiosError(error) ? error.response?.data : null);
      const code = parsed.success ? parsed.data.code : undefined;
      if (!active || !parsed.success || !code || !PIN_CODES.has(code)) throw error;
      const next = await askForPin(active, vaultId, parsed.data);
      if (next === null) return { confirmed: false };
      pin = next;
    }
  }
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
