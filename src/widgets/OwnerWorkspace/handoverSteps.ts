export interface HandoverStep {
  title: string;
  detail: string;
}

/** Năm bước bàn giao theo thiết kế; nội dung cố định theo SRS, không lấy từ máy chủ. */
export const HANDOVER_STEPS: HandoverStep[] = [
  { title: "Báo tin", detail: "Người thực hiện báo tin." },
  { title: "Xét duyệt", detail: "Người xét duyệt kiểm tra." },
  { title: "Xác minh người nhận", detail: "Người nhận xác nhận danh tính." },
  { title: "Phản đối 72 giờ", detail: "Bạn có 72 giờ để dừng lại." },
  { title: "Tải nội dung 7 ngày", detail: "Người nhận tải về trong 7 ngày." },
];
