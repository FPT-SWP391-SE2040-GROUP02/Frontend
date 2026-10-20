import type { DeathCase } from "./deathCase.schema";
import { caseStatusInfo } from "../ui/executorLabels";
import type { Tone } from "@/shared/ui/heritageKit";

export interface ReportHeading {
  title: string;
  description: string;
  badge: { label: string; tone: Tone } | null;
}

/** Tiêu đề, mô tả và nhãn của trang Báo tin theo trạng thái hồ sơ. */
export function reportHeading(record: DeathCase | null | undefined): ReportHeading {
  if (!record) {
    return {
      title: "Báo tin",
      description:
        "Khai báo ngắn gọn. Chủ kho có 72 giờ để phản đối, rồi hồ sơ sang Người xét duyệt.",
      badge: null,
    };
  }
  const badge = caseStatusInfo[record.status] ?? null;
  if (record.status === "DRAFT") {
    return {
      title: "Soạn hồ sơ báo tin",
      description: "Lưu nháp bất cứ lúc nào. Hồ sơ chỉ được gửi khi bạn bấm “Gửi hồ sơ”.",
      badge,
    };
  }
  if (record.status === "SUPPLEMENT_REQUIRED") {
    return {
      title: "Nộp bản bổ sung",
      description: "Người xét duyệt cần thêm thông tin. Nộp bản bổ sung để hồ sơ được xem lại.",
      badge,
    };
  }
  return {
    title: "Hồ sơ báo tin",
    description: "Theo dõi hồ sơ đã gửi. Tiến trình xử lý nằm ở mục Tiến trình.",
    badge,
  };
}
