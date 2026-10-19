import { ROUTES } from "@/shared/config/routes.config";
import {
  HandoverIcon,
  OverviewIcon,
  PlanIcon,
  VaultIcon,
  RecipientsIcon,
  TrustedIcon,
} from "@/shared/ui/LegacyVaultArtwork";
import { Activity, FileText } from "lucide-react";

/** Nội dung và dữ liệu giả để duyệt UI; không phải DTO hoặc trạng thái từ backend. */
export const OWNER_OVERVIEW = {
  brand: "LegacyVault",
  caption: "Gìn giữ hôm nay. An tâm ngày mai.",
  preview: "Bản xem trước UI · Dữ liệu minh họa",
  notice:
    "Các số liệu dưới đây là dữ liệu mẫu. Điểm danh và phản đối bàn giao chưa được thực thi trên màn hình này.",
  owner: "Anh Nam",
  role: "Chủ kho",
  greeting: "Chào anh Nam,",
  subtitle: "Một nơi để sắp xếp những điều quan trọng với anh.",
  add: "Thêm tài sản",
  navLabel: "Điều hướng Chủ kho",
  nav: [
    { label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT, icon: OverviewIcon, active: true },
    { label: "Kho của tôi", to: ROUTES.DASHBOARD.ASSETS, icon: VaultIcon, active: false },
    { label: "Kế hoạch bàn giao", to: ROUTES.WILLS.ROOT, icon: HandoverIcon, active: false },
    { label: "Điểm danh", to: ROUTES.DMS.ROOT, icon: Activity, active: false },
    { label: "Gói dịch vụ", to: ROUTES.BILLING.PLANS, icon: PlanIcon, active: false },
  ],
  logout: "Đăng xuất",
  status: "Chưa có yêu cầu bàn giao",
  statusHeading: "Mọi thứ đang ở đúng nơi.",
  statusDescription:
    "Anh có thể tiếp tục sắp xếp tài sản và cập nhật kế hoạch. Nếu phát sinh yêu cầu bàn giao, trạng thái và hướng xử lý sẽ xuất hiện tại đây.",
  statusTag: "Trạng thái mẫu",
  stats: [
    { label: "Tài sản trong kho", value: "12", detail: "Đã sắp xếp trong kho", icon: VaultIcon },
    {
      label: "Dung lượng đã dùng",
      value: "38 MB",
      detail: "Gói Free · dữ liệu mẫu",
      icon: FileText,
    },
    {
      label: "Người nhận",
      value: "4",
      detail: "Được chỉ định trong kế hoạch",
      icon: RecipientsIcon,
    },
    {
      label: "Người tin cậy",
      value: "0 / 2",
      detail: "Hai vai trò chưa hoàn tất lời mời",
      icon: TrustedIcon,
    },
  ],
  setupTitle: "Hoàn thiện kế hoạch",
  setupDescription: "Từng bước nhỏ để những điều anh giữ lại có hướng đi rõ ràng.",
  setupProgress: "3 trên 5 bước đã hoàn tất",
  completeLabel: "Đã hoàn tất",
  pendingLabel: "Chưa hoàn tất",
  setupPercent: 60,
  setup: [
    { title: "Tạo tài khoản", complete: true },
    { title: "Thêm tài sản đầu tiên", complete: true },
    { title: "Chỉ định người nhận", complete: true },
    { title: "Hoàn tất lời mời Người thực hiện", complete: false },
    { title: "Chỉ định Người xét duyệt", complete: false },
  ],
  setupAction: "Xem kế hoạch",
  heartbeatTitle: "Đừng quên giữ liên lạc",
  heartbeatDescription:
    "Điểm danh định kỳ giúp hệ thống biết anh vẫn đang sử dụng kho. Đây là thao tác riêng với phản đối một yêu cầu bàn giao.",
  heartbeatDate: "Kỳ tiếp theo · 28/10/2026",
  heartbeatLast: "Lần gần nhất · 28/09/2026",
  heartbeatAction: "Mở trang điểm danh",
  assetsTitle: "Tài sản gần đây",
  assetsDescription: "Những mục anh vừa sắp xếp hoặc cập nhật.",
  assetsAction: "Xem toàn bộ kho",
  columns: ["Tên tài sản", "Loại", "Người nhận", "Cập nhật"],
  assets: [
    { name: "Giấy tờ gia đình", type: "Tài liệu", recipient: "An và Bình", updated: "Hôm nay" },
    {
      name: "Thông tin tài khoản",
      type: "Thông tin truy cập",
      recipient: "An",
      updated: "Hôm qua",
    },
    {
      name: "Kỷ niệm gia đình",
      type: "Tài liệu",
      recipient: "An và Bình",
      updated: "3 ngày trước",
    },
  ],
  activityTitle: "Hoạt động gần đây",
  activity: [
    { title: "Cập nhật Giấy tờ gia đình", time: "Hôm nay" },
    { title: "Đã gửi lời mời Người thực hiện", time: "Hôm qua" },
    { title: "Thêm Kỷ niệm gia đình vào kho", time: "3 ngày trước" },
  ],
  footer:
    "LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa kế.",
  skip: "Đến nội dung chính",
} as const;
