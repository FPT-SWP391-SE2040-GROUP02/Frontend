import { ROUTES } from "@/shared/config/routes.config";
import type { Tone } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "./deathCase.schema";
import type { HandoverProgress } from "./handoverProgress.schema";
import { countTurns } from "./executorTurns";

/**
 * Tổng quan Người thực thi: "Việc của bạn bây giờ" và "Kho đang ở đâu".
 * Hàm thuần, chỉ dựa vào dữ liệu Backend trả; không có hạn chót.
 */

/** Bước của biên bản bàn giao (DRAFTING, SIGNING, COMPLETED; IDENTITY_CHECK chỉ còn ở biên bản cũ, xử lý như SIGNING); rỗng khi chưa có yêu cầu nhận tài sản. */
export type RecordStatus = string;

/** Trạng thái gọn của kho dưới tên Chủ kho (menu trái, trang Lời mời và các kho bạn đang làm việc). */
export interface VaultStage {
  label: string;
  tone: Tone;
}

/** Kho đang ở giai đoạn nào: chưa có yêu cầu nhận, luật sư đang lập biên bản, đang ký, đang giao hay đã xong. */
export function vaultStage(vault: ExecutorVault): VaultStage {
  if (vault.planStatus === "CLOSED") return { label: "Đã hoàn tất", tone: "success" };
  const status = vault.handoverRecordStatus;
  if (status === "COMPLETED") return { label: "Đang giao tài sản", tone: "warning" };
  if (status === "SIGNING" || status === "IDENTITY_CHECK") {
    return { label: "Đang ký biên bản", tone: "warning" };
  }
  if (status === "DRAFTING") return { label: "Luật sư đang lập biên bản", tone: "warning" };
  if (vault.planStatus === "DRAFT") return { label: "Kế hoạch chưa kích hoạt", tone: "neutral" };
  if (vault.planStatus === "BLOCKED") return { label: "Đang bị chặn", tone: "warning" };
  return { label: "Chưa có yêu cầu nhận", tone: "success" };
}

export interface ExecutorTodoInput {
  vault: ExecutorVault;
  /** Bước của biên bản; rỗng khi chưa có yêu cầu nhận tài sản. */
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
      text: "Xem từng người nhận đang ở bước nào.",
      buttonLabel: "Mở Bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  const counts = countTurns(progress.turns);
  if (counts.action > 0) {
    return {
      title: `Gửi mã nhận cho ${counts.action} người nhận`,
      text: "Những người này đã có đủ chữ ký trên biên bản. Họ cần mã nhận do bạn giữ mới mở được tài sản.",
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
 * Việc quan trọng nhất của Người thực thi với một kho. Thứ tự: chưa có yêu cầu nhận → luật sư đang lập biên bản →
 * ký ngay sau khi luật sư chốt → gửi mã nhận cho từng người đã được mở → hoàn tất.
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
      title: "Chưa có yêu cầu nhận tài sản",
      text: "Chưa có việc gì cần làm lúc này. Khi người nhận gửi yêu cầu kèm giấy tờ, hệ thống báo cho bạn.",
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
  if (recordStatus === "SIGNING" || recordStatus === "IDENTITY_CHECK") {
    if (canSign) {
      return {
        title: "Ký biên bản bàn giao",
        text: "Luật sư đã chốt biên bản. Đọc lại biên bản rồi ký ngay, không cần chờ người nhận.",
        buttonLabel: "Ký biên bản",
        to: ROUTES.EXECUTOR.REPORT,
      };
    }
    // Bạn đã ký: người nhận nào đã được mở quyền tải thì bạn gửi mã ngay, không chờ người khác.
    if (progress && progress.handoverStarted && countTurns(progress.turns).action > 0) {
      return handoverTodo(progress);
    }
    return {
      title: "Chờ người nhận hoàn tất phần của mình",
      text: "Bạn đã ký. Mỗi người nhận nộp căn cước và ký; khi lượt của họ được mở, bạn gửi mã nhận cho từng người.",
      buttonLabel: "Xem người nhận",
      to: ROUTES.EXECUTOR.PROGRESS,
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
 * Yêu cầu nhận → Biên bản (xét giấy tờ, lập, chốt, ký) → Bàn giao cho người nhận (từng người, có thể bắt đầu
 * khi biên bản còn đang ký).
 */
export function vaultJourney(
  vault: ExecutorVault,
  recordStatus: RecordStatus,
  progress: HandoverProgress | null,
): JourneyStep[] {
  const closed = vault.planStatus === "CLOSED";
  const opened = Boolean(recordStatus) || closed;
  const completed = recordStatus === "COMPLETED" || closed;
  const signing = recordStatus === "SIGNING" || recordStatus === "IDENTITY_CHECK";

  let recordCaption = "Chưa tới";
  if (recordStatus === "DRAFTING") recordCaption = "Luật sư đang lập";
  if (signing) recordCaption = "Đang ký, giao từng người";
  if (completed) recordCaption = "Đã đủ chữ ký";

  // Bàn giao đã bắt đầu khi biên bản đủ chữ ký, hoặc khi đã có người nhận được mở quyền tải dù biên bản còn đang ký.
  let deliveryStarted = completed;
  if (signing && progress && progress.handoverStarted) {
    for (const turn of progress.turns) {
      if (turn.status === "HANDOVER_COMMITTED") deliveryStarted = true;
    }
  }

  let handoverCaption = "Chưa bắt đầu";
  let handoverDone = closed;
  if (deliveryStarted && progress && progress.handoverStarted && progress.turns.length > 0) {
    const counts = countTurns(progress.turns);
    handoverCaption = `${counts.done}/${counts.total} người đã nhận xong`;
    if (completed && counts.action === 0 && counts.waiting === 0) handoverDone = true;
  }
  if (closed && handoverCaption === "Chưa bắt đầu") handoverCaption = "Đã hoàn tất";

  let recordState: JourneyState = "pending";
  if (completed) recordState = "done";
  else if (opened) recordState = "current";
  let handoverState: JourneyState = "pending";
  if (handoverDone) handoverState = "done";
  else if (deliveryStarted) handoverState = "current";

  return [
    {
      label: "Yêu cầu nhận",
      state: opened ? "done" : "current",
      caption: opened ? "Đã mở" : "Chưa mở",
    },
    { label: "Biên bản bàn giao", state: recordState, caption: recordCaption },
    { label: "Bàn giao cho người nhận", state: handoverState, caption: handoverCaption },
  ];
}
