import { useState } from "react";

const KEY_PREFIX = "lv-rejected-ack:";

/** Dự phòng khi trình duyệt chặn Web Storage: vẫn nhớ trong phiên trang hiện tại. */
const acknowledgedInMemory = new Set<string>();

function readAck(caseId: string): boolean {
  if (acknowledgedInMemory.has(caseId)) return true;
  try {
    return window.localStorage.getItem(KEY_PREFIX + caseId) === "1";
  } catch {
    return false;
  }
}

function writeAck(caseId: string) {
  acknowledgedInMemory.add(caseId);
  try {
    window.localStorage.setItem(KEY_PREFIX + caseId, "1");
  } catch {
    // Chỉ là tiện ích ẩn banner; không lưu được thì lần sau banner hiện lại, không ảnh hưởng nghiệp vụ.
  }
}

/**
 * Executor đã xem thông báo "hồ sơ bị từ chối" chưa. Hồ sơ bị từ chối là đã xử lý xong, nên sau khi bấm
 * "Tiếp tục" banner đỏ không hiện lại cho hồ sơ đó (hồ sơ bị từ chối mới sẽ có id khác nên vẫn hiện).
 */
export function useRejectedAck(caseId: string | null | undefined) {
  const [, setVersion] = useState(0);
  let acknowledged = false;
  if (caseId) {
    acknowledged = readAck(caseId);
  }
  const acknowledge = () => {
    if (!caseId) return;
    writeAck(caseId);
    setVersion((version) => version + 1);
  };
  return { acknowledged, acknowledge };
}
