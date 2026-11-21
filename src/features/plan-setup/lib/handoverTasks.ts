/** Bốn việc của trang Bàn giao; file phân chia bấm vào chỗ trống sẽ đưa người dùng về đúng thẻ. */
export type HandoverTaskId = "ekyc" | "executor" | "packages" | "plan";

/** id của thẻ việc trong DOM, để cuộn tới và nháy sáng sau khi đóng khung xem trước. */
export function handoverTaskElementId(task: HandoverTaskId): string {
  return `handover-task-${task}`;
}
