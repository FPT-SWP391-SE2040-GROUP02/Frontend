/**
 * @file vaultState.ts
 * @description Máy trạng thái kiểm soát vòng đời Két Di Sản (Vault Lifecycle State Machine).
 * Tuân thủ Quy tắc 9 (State Machine Pattern) và Quy tắc 17 (Type-Safety Tuyệt Đối) theo Hiến chương SWP391.
 */

/**
 * Danh sách các trạng thái trong vòng đời Két Di Sản Số
 */
export const VAULT_LIFECYCLE_STATES = {
  /** Bản nháp: Két đang được thiết lập tài sản và người thụ hưởng */
  DRAFT: "DRAFT",
  /** Hoạt động: Két đã kích hoạt, hệ sinh thái DMS Heartbeat đang giám sát */
  ACTIVE: "ACTIVE",
  /** Ân hạn: Quá hạn ping, hệ thống gửi cảnh báo khẩn cấp tới các kênh */
  GRACE_PERIOD: "GRACE_PERIOD",
  /** Chờ chứng từ: Hết hạn ân hạn, chuyển quyền nộp chứng từ cho Người Thi Hành */
  AWAITING_LEGAL_PROOF: "AWAITING_LEGAL_PROOF",
  /** Chờ thẩm định: Hồ sơ chứng tử đã nộp, chờ Công Chứng Viên đối soát */
  CLAIM_PENDING: "CLAIM_PENDING",
  /** Đã phê duyệt: Công chứng viên ký số duyệt mở thừa kế */
  APPROVED: "APPROVED",
  /** Đã đóng: Di sản bàn giao hoàn tất cho người thụ hưởng hoặc hủy hợp lệ */
  CLOSED: "CLOSED",
} as const;

/**
 * Kiểu dữ liệu trạng thái vòng đời két
 */
export type VaultLifecycleState =
  (typeof VAULT_LIFECYCLE_STATES)[keyof typeof VAULT_LIFECYCLE_STATES];

/**
 * Ma trận chuyển đổi trạng thái hợp lệ (Allowed State Transitions)
 * Mô hình hóa hữu hạn các đường chuyển trạng thái theo quy chuẩn ISTQB v4.0.
 */
export const VAULT_TRANSITIONS: Record<VaultLifecycleState, readonly VaultLifecycleState[]> = {
  [VAULT_LIFECYCLE_STATES.DRAFT]: [VAULT_LIFECYCLE_STATES.ACTIVE, VAULT_LIFECYCLE_STATES.CLOSED],
  [VAULT_LIFECYCLE_STATES.ACTIVE]: [
    VAULT_LIFECYCLE_STATES.GRACE_PERIOD,
    VAULT_LIFECYCLE_STATES.CLOSED,
  ],
  [VAULT_LIFECYCLE_STATES.GRACE_PERIOD]: [
    VAULT_LIFECYCLE_STATES.ACTIVE, // Chu trình hồi sinh khi người dùng ping alive
    VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF,
  ],
  [VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF]: [
    VAULT_LIFECYCLE_STATES.ACTIVE, // Chủ két kháng cáo và điểm danh thành công
    VAULT_LIFECYCLE_STATES.CLAIM_PENDING,
  ],
  [VAULT_LIFECYCLE_STATES.CLAIM_PENDING]: [
    VAULT_LIFECYCLE_STATES.APPROVED, // Công chứng viên duyệt hợp lệ
    VAULT_LIFECYCLE_STATES.AWAITING_LEGAL_PROOF, // Bị từ chối, yêu cầu nộp lại chứng từ
  ],
  [VAULT_LIFECYCLE_STATES.APPROVED]: [VAULT_LIFECYCLE_STATES.CLOSED],
  [VAULT_LIFECYCLE_STATES.CLOSED]: [], // Trạng thái kết thúc, không được phép chuyển tiếp
};

/**
 * @description Kiểm tra xem một bước chuyển trạng thái có hợp lệ hay không.
 * @param {VaultLifecycleState} fromState Trạng thái xuất phát
 * @param {VaultLifecycleState} toState Trạng thái đích muốn chuyển đến
 * @returns {boolean} True nếu bước chuyển được phép, ngược lại False
 */
export function canTransitionVault(
  fromState: VaultLifecycleState,
  toState: VaultLifecycleState
): boolean {
  if (fromState === toState) {
    return false; // Chuyển sang chính nó không được tính là transition hợp lệ
  }
  const allowedTransitions = VAULT_TRANSITIONS[fromState];
  if (!allowedTransitions || allowedTransitions.length === 0) {
    return false;
  }
  return allowedTransitions.includes(toState);
}

/**
 * @description Thực hiện chuyển đổi trạng thái két có kiểm tra điều kiện bảo vệ (State Guard).
 * @param {VaultLifecycleState} currentState Trạng thái hiện tại của két
 * @param {VaultLifecycleState} targetState Trạng thái mong muốn chuyển sang
 * @returns {VaultLifecycleState} Trạng thái mới sau khi chuyển đổi thành công
 * @throws {Error} Ném ra lỗi nghiệp vụ nếu bước chuyển vi phạm ma trận trạng thái
 */
export function transitionVault(
  currentState: VaultLifecycleState,
  targetState: VaultLifecycleState
): VaultLifecycleState {
  const isValid = canTransitionVault(currentState, targetState);
  if (!isValid) {
    throw new Error(
      `[LỖI MÁY TRẠNG THÁI]: Không được phép chuyển trạng thái két từ '${currentState}' sang '${targetState}'.`
    );
  }
  return targetState;
}
