import { ROUTES } from "@/shared/config/routes.config";
import type { Tone } from "@/shared/ui/heritageKit";
import type { DeathCase, ExecutorVault } from "./deathCase.schema";
import type { HandoverProgress } from "./handoverProgress.schema";
import { countTurns } from "./executorTurns";

/**
 * Tổng quan Người thực thi: "Việc của bạn bây giờ" và "Kho đang ở đâu".
 * Hàm thuần, chỉ dựa vào dữ liệu Backend trả; không có hạn chót.
 */

export type CaseStatus = DeathCase["status"];

/** Trạng thái gọn của kho dưới tên Chủ kho (menu trái, trang Lời mời và kho của tôi). */
export interface VaultStage {
  label: string;
  tone: Tone;
}

/** Kho đang ở giai đoạn nào: kế hoạch đang chạy, đang báo tin, đang bàn giao hay đã hoàn tất. */
export function vaultStage(vault: ExecutorVault): VaultStage {
  if (vault.planStatus === "CLOSED") return { label: "Đã hoàn tất", tone: "success" };
  if (vault.planStatus === "HANDOVER_IN_PROGRESS") {
    return { label: "Đang bàn giao", tone: "warning" };
  }
  if (vault.openDeathCaseId || vault.planStatus === "DEATH_CASE_OPEN") {
    return { label: "Đang báo tin", tone: "warning" };
  }
  if (vault.planStatus === "AWAITING_CHECK") return { label: "Cần bạn kiểm tra", tone: "danger" };
  if (vault.planStatus === "CHECKIN_OVERDUE" || vault.checkInOverdue) {
    return { label: "Chủ kho trễ điểm danh", tone: "warning" };
  }
  return { label: "Kế hoạch đang chạy", tone: "success" };
}

export interface ExecutorTodoInput {
  vault: ExecutorVault;
  /** Trạng thái hồ sơ báo tin đang xem; null khi kho chưa có hồ sơ. */
  caseStatus: CaseStatus | null;
  /** Tiến độ bàn giao; null khi chưa tải xong hoặc hồ sơ chưa được duyệt. */
  progress: HandoverProgress | null;
  /** Kho có hồ sơ bị từ chối mà Người thực thi chưa bấm "Tiếp tục". */
  rejectedPending: boolean;
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
  if (!progress) {
    return {
      title: "Theo dõi bàn giao",
      text: "Hồ sơ đã được duyệt. Xem từng người nhận đang ở bước nào.",
      buttonLabel: "Mở Bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  if (!progress.handoverStarted || progress.turns.length === 0) {
    return {
      title: "Bàn giao đang được chuẩn bị",
      text: "Hồ sơ đã được duyệt. Danh sách người nhận sẽ hiện ở mục Bàn giao.",
      buttonLabel: "Mở Bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  const counts = countTurns(progress.turns);
  if (counts.action > 0) {
    return {
      title: `Đưa mã mở gói cho ${counts.action} người nhận đã đồng ý`,
      text: "Người xét duyệt đã duyệt biên bản. Người nhận cần mã mở gói do bạn giữ mới tải được tài sản.",
      buttonLabel: "Xem người cần mã",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  let notInvited = 0;
  for (const turn of progress.turns) {
    const waitingReply = turn.status === "INVITED" || turn.status === "INITIAL_RESPONSE_EXPIRED";
    if (waitingReply && !turn.invitationSentAt) notInvited += 1;
  }
  if (notInvited > 0) {
    return {
      title: `Có ${notInvited} người nhận chưa nhận được lời mời`,
      text: "Hệ thống chưa gửi được thư mời và sẽ tự thử lại. Bạn có thể liên hệ người nhận qua thông tin ở mục Bàn giao.",
      buttonLabel: "Xem người nhận",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  if (counts.waiting === 0) {
    return {
      title: "Bàn giao đã hoàn tất",
      text: "Mọi người nhận đã xong hoặc đã từ chối. Bạn không còn việc gì cần làm.",
      buttonLabel: "Xem bàn giao",
      to: ROUTES.EXECUTOR.PROGRESS,
    };
  }
  return {
    title: "Chưa có việc cần bạn làm",
    text: `Đang chờ ${counts.waiting} người nhận. Khi có người cần mã mở gói, việc sẽ hiện ở đây.`,
    buttonLabel: "Xem bàn giao",
    to: ROUTES.EXECUTOR.PROGRESS,
  };
}

/**
 * Việc quan trọng nhất của Người thực thi với một kho. Thứ tự ưu tiên:
 * hồ sơ bị từ chối chưa xem → kho chưa có hồ sơ (báo tin / kiểm tra Chủ kho) → theo trạng thái hồ sơ →
 * khi đang bàn giao: đưa mã mở gói → lời mời chưa gửi được → chờ → hoàn tất.
 * Người thực thi không gửi lời mời được (hệ thống tự gửi), nên lời mời chưa gửi chỉ là thông tin, không phải nút.
 */
export function executorTodo(input: ExecutorTodoInput): ExecutorTodo {
  const { vault, caseStatus, progress, rejectedPending } = input;
  if (rejectedPending) {
    return {
      title: "Xem lý do hồ sơ báo tin bị từ chối",
      text: "Người xét duyệt không chấp thuận hồ sơ. Chỉ báo tin lại khi chắc chắn và có giấy tờ phù hợp.",
      buttonLabel: "Xem hồ sơ",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (caseStatus === null) {
    // Kho có hồ sơ mở nhưng chưa đọc được trạng thái (đang tải): không được nói "chưa báo tin".
    if (vault.openDeathCaseId) {
      return {
        title: `Hồ sơ báo tin về ${vault.ownerFullName} đang được xử lý`,
        text: "Theo dõi tiến trình xét duyệt và bổ sung hồ sơ khi Người xét duyệt yêu cầu.",
        buttonLabel: "Xem hồ sơ",
        to: ROUTES.EXECUTOR.REPORT,
      };
    }
    if (vault.planStatus === "CLOSED") {
      return {
        title: "Bàn giao đã hoàn tất",
        text: "Kho này đã bàn giao xong. Bạn không còn việc gì cần làm.",
        buttonLabel: "Xem bàn giao",
        to: ROUTES.EXECUTOR.PROGRESS,
      };
    }
    if (vault.planStatus === "AWAITING_CHECK") {
      return {
        title: "Kiểm tra xem Chủ kho còn ổn không",
        text: "Chủ kho đã hết thời gian chờ điểm danh. Hãy liên hệ; nếu không liên lạc được thì mở hồ sơ báo tin.",
        buttonLabel: "Mở Báo tin",
        to: ROUTES.EXECUTOR.REPORT,
      };
    }
    if (vault.planStatus === "CHECKIN_OVERDUE" || vault.checkInOverdue) {
      return {
        title: "Để ý thêm, Chủ kho trễ điểm danh",
        text: "Chủ kho còn thời gian tự điểm danh. Nếu bạn đã liên lạc được và Chủ kho vẫn ổn, bạn có thể điểm danh hộ.",
        buttonLabel: null,
        to: null,
      };
    }
    return {
      title: "Báo tin khi Chủ kho qua đời",
      text: "Chưa có việc gì cần làm lúc này. Chỉ báo tin khi chắc chắn đã đến lúc.",
      buttonLabel: "Mở Báo tin",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (caseStatus === "DRAFT") {
    return {
      title: "Hoàn tất hồ sơ báo tin",
      text: "Hồ sơ đang là bản nháp. Điền thông tin, tải giấy chứng tử rồi gửi cho Người xét duyệt.",
      buttonLabel: "Mở Báo tin",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (caseStatus === "SUPPLEMENT_REQUIRED") {
    return {
      title: "Bổ sung hồ sơ báo tin",
      text: "Người xét duyệt cần thêm thông tin. Xem phần cần bổ sung rồi gửi lại hồ sơ.",
      buttonLabel: "Mở Báo tin",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (caseStatus === "UNDER_REVIEW") {
    return {
      title: "Chờ Người xét duyệt duyệt hồ sơ",
      text: "Hồ sơ đã gửi. Bạn chưa cần làm gì, khi có kết quả hệ thống sẽ báo.",
      buttonLabel: "Xem hồ sơ",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (caseStatus === "SUSPENDED") {
    return {
      title: "Hồ sơ báo tin đang tạm dừng",
      text: "Hệ thống sẽ xử lý tiếp khi đủ điều kiện. Bạn chưa cần làm gì.",
      buttonLabel: "Xem hồ sơ",
      to: ROUTES.EXECUTOR.REPORT,
    };
  }
  if (caseStatus === "REJECTED") {
    return {
      title: "Hồ sơ báo tin bị từ chối",
      text: "Xem lý do ở mục Báo tin. Chỉ báo tin lại khi chắc chắn và có giấy tờ phù hợp.",
      buttonLabel: "Xem lý do",
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
 * "Kho đang ở đâu": chỉ 3 bước của cả kho, không theo từng người nhận:
 * Báo tin → Người xét duyệt duyệt → Bàn giao cho người nhận (dòng phụ "x/y người đã nhận xong").
 */
export function vaultJourney(
  vault: ExecutorVault,
  caseStatus: CaseStatus | null,
  progress: HandoverProgress | null,
): JourneyStep[] {
  const closed = vault.planStatus === "CLOSED";
  const approved = caseStatus === "APPROVED_FOR_HANDOVER" || closed;
  const submitted = approved || caseStatus === "UNDER_REVIEW" || caseStatus === "SUSPENDED";

  let reportCaption = "Chưa báo tin";
  if (submitted) reportCaption = "Đã gửi hồ sơ";
  if (caseStatus === "SUPPLEMENT_REQUIRED") reportCaption = "Cần bổ sung hồ sơ";
  if (caseStatus === "REJECTED") reportCaption = "Hồ sơ bị từ chối";

  let reviewCaption = "Chưa tới";
  if (approved) reviewCaption = "Đã duyệt";
  if (caseStatus === "UNDER_REVIEW") reviewCaption = "Đang chờ duyệt";
  if (caseStatus === "SUSPENDED") reviewCaption = "Hồ sơ tạm dừng";

  let handoverCaption = "Chưa bắt đầu";
  let handoverDone = closed;
  if (progress && progress.handoverStarted && progress.turns.length > 0) {
    const counts = countTurns(progress.turns);
    handoverCaption = `${counts.done}/${counts.total} người đã nhận xong`;
    if (counts.action === 0 && counts.waiting === 0) handoverDone = true;
  }
  if (closed && handoverCaption === "Chưa bắt đầu") handoverCaption = "Đã hoàn tất";

  const reportState: JourneyState = submitted ? "done" : "current";
  let reviewState: JourneyState = "pending";
  if (approved) {
    reviewState = "done";
  } else if (submitted) {
    reviewState = "current";
  }
  let handoverState: JourneyState = "pending";
  if (handoverDone) {
    handoverState = "done";
  } else if (approved) {
    handoverState = "current";
  }

  return [
    { label: "Báo tin", state: reportState, caption: reportCaption },
    { label: "Người xét duyệt duyệt", state: reviewState, caption: reviewCaption },
    { label: "Bàn giao cho người nhận", state: handoverState, caption: handoverCaption },
  ];
}
