import { ROUTES } from "@/shared/config/routes.config";

/** 8 bước của quy trình bàn giao nhìn từ Người thực thi (khớp PlanStatus có sẵn, không thêm trạng thái). */
export const PROCESS_STEP_NAMES = [
  "Lập kế hoạch",
  "Điểm danh",
  "Nhắc trễ",
  "Người thực thi vào cuộc",
  "Nộp giấy chứng tử",
  "Xét hồ sơ",
  "Bàn giao",
  "Kết thúc",
] as const;

export type HelpId = "checkin" | "proxy" | "report" | "review" | "supplement" | "close";

export interface HelpArticle {
  title: string;
  steps: Array<{ title: string; text: string }>;
}

/** Bài hướng dẫn ngắn, mỗi bài một việc. Chỉ nói những việc màn hình hiện làm được. */
export const HELP_ARTICLES: Record<HelpId, HelpArticle> = {
  checkin: {
    title: "Điểm danh và nhắc trễ",
    steps: [
      { title: "Chủ kho điểm danh", text: "Theo chu kỳ Chủ kho đã chọn." },
      { title: "Trễ hạn", text: "Hệ thống nhắc Chủ kho, rồi chờ thêm một khoảng." },
      { title: "Hết thời gian chờ", text: "Hệ thống báo bạn vào cuộc." },
    ],
  },
  proxy: {
    title: "Điểm danh thay",
    steps: [
      { title: "Liên lạc", text: "Gọi Chủ kho hoặc người nhà." },
      { title: "Chỉ điểm danh thay khi Chủ kho vẫn ổn", text: "Kế hoạch về lại bước Điểm danh." },
      { title: "Bấm Điểm danh thay", text: "Kỳ mới bắt đầu từ lúc bạn bấm." },
    ],
  },
  report: {
    title: "Nộp giấy chứng tử",
    steps: [
      { title: "Xin giấy", text: "Giấy chứng tử hoặc trích lục khai tử do UBND cấp." },
      { title: "Chụp hoặc quét rõ", text: "Đủ các trang, đọc được chữ." },
      { title: "Điền và gửi ở Báo tin", text: "Hồ sơ được gửi cho Người xét duyệt." },
    ],
  },
  review: {
    title: "Người xét duyệt xét hồ sơ",
    steps: [
      { title: "Đối chiếu giấy", text: "So thông tin trên giấy với Chủ kho." },
      { title: "Quyết định", text: "Duyệt, hoặc yêu cầu bổ sung kèm lý do." },
    ],
  },
  supplement: {
    title: "Nộp bản bổ sung",
    steps: [
      { title: "Đọc lý do", text: "Hiện ở đầu trang Báo tin." },
      { title: "Sửa hồ sơ", text: "Thêm hoặc đổi giấy tờ theo yêu cầu." },
      { title: "Nộp lại", text: "Hồ sơ quay về hàng chờ của Người xét duyệt." },
    ],
  },
  close: {
    title: "Khi nào kế hoạch đóng",
    steps: [
      { title: "Mọi người nhận xong", text: "Kế hoạch chuyển sang đã hoàn tất." },
      { title: "Hết thời gian lưu giữ", text: "Dữ liệu bị xóa hẳn." },
    ],
  },
};

export interface ProcessStepInfo {
  /** Ai làm ở bước này. */
  who: string;
  /** Việc cần làm của Người thực thi lúc đang ở bước này. */
  todo: string;
  summary: string;
  help: HelpId[];
  /** Màn làm việc của bước. */
  to: { path: string; label: string };
}

export const PROCESS_STEP_INFO: ProcessStepInfo[] = [
  {
    who: "Chủ kho",
    todo: "Bạn chưa cần làm gì",
    summary: "Chủ kho tạo kho, thêm người nhận và mời bạn làm Người thực thi.",
    help: [],
    to: { path: ROUTES.EXECUTOR.INVITATIONS, label: "Xem lời mời" },
  },
  {
    who: "Chủ kho",
    todo: "Bạn chưa cần làm gì",
    summary: "Chủ kho điểm danh theo chu kỳ đã chọn. Đã có giấy chứng tử thì bạn nộp được ngay.",
    help: ["checkin", "report"],
    to: { path: ROUTES.EXECUTOR.REPORT, label: "Mở Báo tin" },
  },
  {
    who: "Hệ thống",
    todo: "Bạn chưa cần làm gì",
    summary: "Chủ kho trễ điểm danh, hệ thống nhắc Chủ kho.",
    help: ["checkin"],
    to: { path: ROUTES.EXECUTOR.ROOT, label: "Mở Tổng quan" },
  },
  {
    who: "Bạn",
    todo: "Điểm danh thay hoặc nộp giấy chứng tử",
    summary: "Liên lạc với Chủ kho hoặc người nhà rồi chọn một trong hai việc.",
    help: ["proxy", "report"],
    to: { path: ROUTES.EXECUTOR.REPORT, label: "Mở Báo tin" },
  },
  {
    who: "Bạn",
    todo: "Hoàn tất và gửi hồ sơ chứng tử",
    summary: "Tải giấy chứng tử và gửi cho Người xét duyệt.",
    help: ["report"],
    to: { path: ROUTES.EXECUTOR.REPORT, label: "Mở Báo tin" },
  },
  {
    who: "Người xét duyệt",
    todo: "Chờ kết quả xét hồ sơ",
    summary: "Người xét duyệt đối chiếu giấy rồi duyệt hoặc yêu cầu bổ sung.",
    help: ["review", "supplement"],
    to: { path: ROUTES.EXECUTOR.REPORT, label: "Xem hồ sơ đã nộp" },
  },
  {
    who: "Bạn và người nhận",
    todo: "Theo dõi tiến độ bàn giao",
    summary: "Người nhận làm hồ sơ nhận tài sản, bạn theo dõi tiến độ.",
    help: [],
    to: { path: ROUTES.EXECUTOR.PROGRESS, label: "Mở Bàn giao" },
  },
  {
    who: "Hệ thống",
    todo: "Bạn không cần làm gì thêm",
    summary: "Mọi người nhận xong thì kế hoạch đóng, dữ liệu bị xóa sau thời gian lưu giữ.",
    help: ["close"],
    to: { path: ROUTES.EXECUTOR.PROGRESS, label: "Mở Bàn giao" },
  },
];
