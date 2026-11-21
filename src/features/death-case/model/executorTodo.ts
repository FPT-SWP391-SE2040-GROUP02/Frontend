import { ROUTES } from "@/shared/config/routes.config";
import type { Tone } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "./deathCase.schema";
import type { HandoverProgress } from "./handoverProgress.schema";
import { countTurns } from "./executorTurns";

/**
 * Tổng quan Người thực thi: "Việc của bạn bây giờ" và "Kho đang ở đâu".
 * Hàm thuần, chỉ dựa vào dữ liệu Backend trả; không có hạn chót.
 */

/** Bước của biên bản bàn giao (DRAFTING, IDENTITY_CHECK, SIGNING, COMPLETED); rỗng khi chưa mở bàn giao. */
export type RecordStatus = string;

/** Trạng thái gọn của kho dưới tên Chủ kho (menu trái, trang Lời mời và các kho bạn đang làm việc). */
export interface VaultStage {
  label: string;
  tone: Tone;
}

/** Kho đang ở giai đoạn nào: chưa mở bàn giao, luật sư đang lập biên bản, đang ký, đang giao hay đã xong. */
export function vaultStage(vault: ExecutorVault): VaultStage {
  if (vault.planStatus === "CLOSED") return { label: "Đã hoàn tất", tone: "success" };
  const status = vault.handoverRecordStatus;
  if (status === "COMPLETED") return { label: "Đang giao tài sản", tone: "warning" };
  if (status === "SIGNING") return { label: "Đang ký biên bản", tone: "warning" };
  if (status === "IDENTITY_CHECK") return { label: "Đang kiểm danh tính", tone: "warning" };
  if (status === "DRAFTING") return { label: "Luật sư đang lập biên bản", tone: "warning" };
  if (vault.planStatus === "DRAFT") return { label: "Kế hoạch chưa kích hoạt", tone: "neutral" };
  if (vault.planStatus === "BLOCKED") return { label: "Đang tạm giữ", tone: "warning" };
  return { label: "Chưa mở bàn giao", tone: "success" };
}

export interface ExecutorTodoInput {
  vault: ExecutorVault;
  /** Bước của biên bản; rỗng khi chưa mở bàn giao. */
  recordStatus: RecordStatus;
  /** Biên bản đang chờ chữ ký của bạn. */
  canSign: boolean;
  /** Tiến độ bàn giao; null khi chưa tải xong hoặc biên bản chưa chốt. */
  progress: HandoverProgress | null;
}

export interface ExecutorTodo {
  /** Câu việc quan trọng nhất ngay lúc này. */
  title: string;
  /** Một câu giải thích. */
  text: string;
  /** Nút dẫn tới trang liên quan; null khi không cần làm gì. */
  buttonLabel: string | null;
  to: string | null;
}

function handoverTodo(progress: HandoverProgress | null): ExecutorTodo {
  if (!progress || !progress.handoverStarted || progress.turns.length === 0) {
    return {
      title: "Theo dõi bàn giao",
      text: "Biên bản đã đủ chữ ký. Xem từng người nhận đang ở bước nào.",
      buttonLabel: "Mở Bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  const counts = countTurns(progress.turns);
  if (counts.action > 0) {
    return {
      title: `Gửi mã nhận cho ${counts.action} người nhận`,
      text: "Biên bản đã đủ chữ ký ba bên. Người nhận cần mã nhận do bạn giữ mới mở được tài sản.",
      buttonLabel: "Xem người cần mã",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  if (counts.waiting === 0) {
    return {
      title: "Bàn giao đã hoàn tất",
      text: "Mọi người nhận đã nhận xong. Bạn không còn việc gì cần làm.",
      buttonLabel: "Xem bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  return {
    title: "Chưa có việc cần bạn làm",
    text: `Đang chờ ${counts.waiting} người nhận nhập mã và tải tài sản.`,
    buttonLabel: "Xem bàn giao",
    to: ROUTES.EXECUTOR.PROGRESS,
  };
}

/**
 * Việc quan trọng nhất của Người thực thi với một kho. Thứ tự: chưa mở bàn giao → luật sư đang lập biên bản →
 * danh tính người nhận → đến lượt bạn ký → gửi mã nhận → hoàn tất.
 */
export function executorTodo(input: ExecutorTodoInput): ExecutorTodo {
  const { vault, recordStatus, canSign, progress } = input;
  if (vault.planStatus === "CLOSED") {
    return {
      title: "Bàn giao đã hoàn tất",
      text: "Kho này đã bàn giao xong. Bạn không còn việc gì cần làm.",
      buttonLabel: "Xem bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  if (!recordStatus) {
    return {
      title: "Mở bàn giao khi Chủ kho qua đời",
      text: "Chưa có việc gì cần làm lúc này. Chỉ mở bàn giao khi chắc chắn đã đến lúc; không cần nộp giấy tờ.",
      buttonLabel: "Mở Biên bản bàn giao",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (recordStatus === "DRAFTING") {
    return {
      title: "Luật sư đang lập biên bản",
      text: "Luật sư đang ghi ai nhận tài sản nào. Bạn chưa cần làm gì.",
      buttonLabel: "Xem biên bản",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (recordStatus === "IDENTITY_CHECK") {
    return {
      title: "Người nhận đang xác minh danh tính",
      text: "Biên bản đã chốt. Người nhận nộp căn cước để luật sư kiểm. Bạn có thể nhắc họ ở mục Bàn giao.",
      buttonLabel: "Xem người nhận",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  if (recordStatus === "SIGNING") {
    if (canSign) {
      return {
        title: "Ký biên bản bàn giao",
        text: "Mọi người nhận đã được xác nhận danh tính. Đọc lại biên bản rồi ký.",
        buttonLabel: "Ký biên bản",
        to: ROUTES.EXECUTOR.REPORT,
      };
    }
    return {
      title: "Chờ các bên còn lại ký",
      text: "Bạn đã ký. Khi luật sư và người nhận ký xong, bạn gửi mã nhận cho từng người.",
      buttonLabel: "Xem biên bản",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  return handoverTodo(progress);
}

export type JourneyState = "done" | "current" | "pending";

export interface JourneyStep {
  label: string;
  state: JourneyState;
  /** Dòng phụ dưới tên bước. */
  caption: string;
}

/**
 * "Kho đang ở đâu": 3 bước của cả kho, không theo từng người nhận:
 * Mở bàn giao → Biên bản (lập, kiểm danh tính, ký ba bên) → Bàn giao cho người nhận.
 */
export function vaultJourney(
  vault: ExecutorVault,
  recordStatus: RecordStatus,
  progress: HandoverProgress | null,
): JourneyStep[] {
  const closed = vault.planStatus === "CLOSED";
  const opened = Boolean(recordStatus) || closed;
  const completed = recordStatus === "COMPLETED" || closed;

  let recordCaption = "Chưa tới";
  if (recordStatus === "DRAFTING") recordCaption = "Luật sư đang lập";
  if (recordStatus === "IDENTITY_CHECK") recordCaption = "Đang kiểm danh tính";
  if (recordStatus === "SIGNING") recordCaption = "Đang ký ba bên";
  if (completed) recordCaption = "Đã đủ chữ ký";

  let handoverCaption = "Chưa bắt đầu";
  let handoverDone = closed;
  if (completed && progress && progress.handoverStarted && progress.turns.length > 0) {
    const counts = countTurns(progress.turns);
    handoverCaption = `${counts.done}/${counts.total} người đã nhận xong`;
    if (counts.action === 0 && counts.waiting === 0) handoverDone = true;
  }
  if (closed && handoverCaption === "Chưa bắt đầu") handoverCaption = "Đã hoàn tất";

  let recordState: JourneyState = "pending";
  if (completed) recordState = "done";
  else if (opened) recordState = "current";
  let handoverState: JourneyState = "pending";
  if (handoverDone) handoverState = "done";
  else if (completed) handoverState = "current";

  return [
    {
      label: "Mở bàn giao",
      state: opened ? "done" : "current",
      caption: opened ? "Đã mở" : "Chưa mở",
    },
    { label: "Biên bản bàn giao", state: recordState, caption: recordCaption },
    { label: "Bàn giao cho người nhận", state: handoverState, caption: handoverCaption },
  ];
}
