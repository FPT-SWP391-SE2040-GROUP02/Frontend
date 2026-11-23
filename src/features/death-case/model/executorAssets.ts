import type { Tone } from "@/shared/ui/heritageKit";
import type { ExecutorRecipient } from "./deathCase.schema";
import { deriveTurnProgress, type TurnGroup } from "./executorTurns";
import type { HandoverProgressTurn } from "./handoverProgress.schema";

/**
 * Trang "Tài sản và hướng dẫn": gom tài sản theo người nhận, trạng thái bàn giao của từng người và trạng thái tải của từng tài sản.
 * Người thực thi chỉ thấy tên, loại và trạng thái tải; hàm thuần, không đụng tới nội dung tài sản.
 */

export interface RecipientStatus {
  label: string;
  tone: Tone;
}

/** Các lượt bàn giao của một người nhận, nối theo mã hồ sơ người nhận; lượt chưa có mã thì không nối được. */
export function turnsOfRecipient(
  item: ExecutorRecipient,
  turns: HandoverProgressTurn[],
): HandoverProgressTurn[] {
  return turns.filter((turn) => turn.beneficiaryId === item.beneficiaryId);
}

const PENDING_ORDER: TurnGroup[] = ["action", "waiting"];

/**
 * Chip trạng thái bàn giao của một người nhận: chưa có lượt → "Chưa bàn giao"; mọi lượt xong → "Đã nhận xong";
 * mọi lượt từ chối hoặc kết thúc → "Từ chối nhận"; còn lại lấy lượt đang cần việc nhất
 * (cần bạn làm trước, rồi đang chờ người nhận).
 */
export function recipientStatus(turns: HandoverProgressTurn[]): RecipientStatus {
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

export type AssetDownloadState = "downloaded" | "partial" | "not-downloaded" | "not-handed-over";

/**
 * Tài sản đã tải chưa, nhìn qua các lượt của người nhận: mọi lượt đã từ chối hoặc kết thúc → "Không bàn giao";
 * mọi lượt còn lại đều đã tải tài sản đó → "Đã tải"; mới một số người tải → "Tải một phần";
 * chưa ai tải (kể cả chưa có lượt) → "Chưa tải".
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
  if (downloadedTurns > 0) return "partial";
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

/** Tên người nhận để hiện và để tìm: họ tên nếu có, không thì số CCCD. */
export function recipientLabel(item: ExecutorRecipient): string {
  return item.fullName ?? `CCCD ${item.citizenId}`;
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase("vi-VN");
}

/**
 * Lọc theo ô "Tìm tên tài sản hoặc người nhận". Khớp tên người nhận thì giữ cả người đó;
 * khớp tên tài sản thì chỉ giữ các tài sản khớp; không khớp gì thì bỏ. Ô trống giữ nguyên tất cả.
 */
export function filterRecipients(
  recipients: ExecutorRecipient[],
  query: string,
): ExecutorRecipient[] {
  const needle = normalize(query);
  if (needle === "") return recipients;
  const result: ExecutorRecipient[] = [];
  for (const item of recipients) {
    if (normalize(recipientLabel(item)).includes(needle)) {
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
