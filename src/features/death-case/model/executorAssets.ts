import type { Tone } from "@/shared/ui/heritageKit";
import type { ExecutorPackage } from "./deathCase.schema";
import { deriveTurnProgress, type TurnGroup } from "./executorTurns";
import type { HandoverProgressTurn } from "./handoverProgress.schema";

/**
 * Trang "Tài sản và hướng dẫn": gom tài sản theo gói, trạng thái bàn giao của gói và trạng thái tải của từng tài sản.
 * Người thực thi chỉ thấy tên, loại và trạng thái tải; hàm thuần, không đụng tới nội dung tài sản.
 */

export interface PackageStatus {
  label: string;
  tone: Tone;
}

/** Các lượt bàn giao của một gói. Nối theo mã gói; Backend cũ chưa gửi mã gói thì không nối được (coi như chưa có lượt). */
export function turnsOfPackage(
  item: ExecutorPackage,
  turns: HandoverProgressTurn[],
): HandoverProgressTurn[] {
  return turns.filter((turn) => turn.containerId === item.containerId);
}

const PENDING_ORDER: TurnGroup[] = ["action", "waiting"];

/**
 * Chip trạng thái bàn giao của gói: chưa có lượt → "Chưa bàn giao"; mọi lượt xong → "Đã nhận xong";
 * mọi lượt từ chối hoặc kết thúc → "Từ chối nhận"; còn lại lấy lượt đang cần việc nhất
 * (cần bạn làm trước, rồi đang chờ người nhận).
 */
export function packageStatus(turns: HandoverProgressTurn[]): PackageStatus {
  if (turns.length === 0) return { label: "Chưa bàn giao", tone: "neutral" };
  const progresses = turns.map((turn) => deriveTurnProgress(turn));
  let allDone = true;
  let allStopped = true;
  for (const progress of progresses) {
    if (progress.group !== "done") allDone = false;
    if (progress.group !== "declined" && progress.group !== "ended") allStopped = false;
  }
  if (allDone) return { label: "Đã nhận xong", tone: "success" };
  if (allStopped) return { label: "Từ chối nhận", tone: "neutral" };
  for (const group of PENDING_ORDER) {
    for (const progress of progresses) {
      if (progress.group === group) return { label: progress.chip, tone: "warning" };
    }
  }
  // Có người xong và người từ chối nhưng không ai còn chờ: coi như đã nhận xong.
  return { label: "Đã nhận xong", tone: "success" };
}

export type AssetDownloadState = "downloaded" | "not-downloaded" | "not-handed-over";

/**
 * Tài sản đã tải chưa, nhìn qua các lượt của gói: mọi lượt đã từ chối hoặc kết thúc → "Không bàn giao";
 * mọi lượt còn lại đều đã tải tài sản đó → "Đã tải"; ngược lại (kể cả chưa có lượt) → "Chưa tải".
 */
export function assetDownloadState(
  assetId: string,
  turns: HandoverProgressTurn[],
): AssetDownloadState {
  let activeTurns = 0;
  let downloadedTurns = 0;
  for (const turn of turns) {
    const group = deriveTurnProgress(turn).group;
    if (group === "declined" || group === "ended") continue;
    activeTurns += 1;
    for (const item of turn.items) {
      if (item.assetId === assetId && item.downloaded) {
        downloadedTurns += 1;
        break;
      }
    }
  }
  if (turns.length > 0 && activeTurns === 0) return "not-handed-over";
  if (activeTurns > 0 && downloadedTurns === activeTurns) return "downloaded";
  return "not-downloaded";
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp"];

/** Chữ trong ô nhỏ chỉ loại tài sản: TXT cho văn bản, còn tệp thì theo đuôi tên (PDF, ẢNH, DOC…); không rõ thì "TỆP". */
export function assetBadge(name: string, kind: "FILE" | "TEXT"): string {
  if (kind === "TEXT") return "TXT";
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "TỆP";
  const extension = name.slice(dot + 1).toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "txt") return "TXT";
  if (IMAGE_EXTENSIONS.includes(extension)) return "ẢNH";
  if (extension === "doc" || extension === "docx") return "DOC";
  if (extension === "xls" || extension === "xlsx") return "XLS";
  return "TỆP";
}

/** Tên người nhận của gói để hiện và để tìm: họ tên nếu có, không thì 4 số cuối CCCD che. */
export function recipientLabels(item: ExecutorPackage): string[] {
  return item.recipients.map(
    (recipient) => recipient.fullName ?? `CCCD ***${recipient.citizenIdLast4}`,
  );
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase("vi-VN");
}

/**
 * Lọc theo ô "Tìm tên tài sản hoặc người nhận". Khớp tên người nhận thì giữ cả gói;
 * khớp tên tài sản thì chỉ giữ các tài sản khớp; không khớp gì thì bỏ gói. Ô trống giữ nguyên tất cả.
 */
export function filterPackages(packages: ExecutorPackage[], query: string): ExecutorPackage[] {
  const needle = normalize(query);
  if (needle === "") return packages;
  const result: ExecutorPackage[] = [];
  for (const item of packages) {
    let recipientMatches = false;
    for (const label of recipientLabels(item)) {
      if (normalize(label).includes(needle)) recipientMatches = true;
    }
    if (recipientMatches) {
      result.push(item);
      continue;
    }
    const matchingAssets = item.assets.filter((asset) => normalize(asset.name).includes(needle));
    if (matchingAssets.length > 0) {
      result.push({ ...item, assets: matchingAssets });
    }
  }
  return result;
}
