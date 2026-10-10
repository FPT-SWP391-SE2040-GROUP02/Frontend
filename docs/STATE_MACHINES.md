# Đồng bộ trạng thái nghiệp vụ

Nguồn hiện tại: mục 11 của [SRS 3.14.0](srs/LegacyVault-SRS-v3.14.0.md). Danh sách trạng thái và dữ liệu FE cần: [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md).

BE/FE cần chốt enum và transition guards cho account, estate plan, death case, eKYC, alive objection, recipient claim, handover, access grant, retention, order và incident. Trạng thái UI preview không phải giá trị đã được server xác nhận.

## Ranh giới cần giữ

- eKYC đạt chỉ cho phép tiếp tục bước xác minh/video; không tự cấp quyền tải.
- Claim, lịch, quyết định và grant của mỗi người độc lập.
- Xác minh danh tính không đồng nghĩa đã chấp nhận bàn giao; BE kiểm tra điều kiện trước commit/grant.
- Phân biệt thời hạn phản hồi lời mời, quyết định, grant tải và retention. Server trả thời điểm UTC; FE hiển thị countdown.
- Trạng thái thanh toán đến từ BE xử lý webhook/đối soát.
- Job retention phải kiểm tra tham chiếu snapshot và điều kiện giữ dữ liệu trước xóa.

Các giá trị vận hành được SRS đánh dấu đề xuất cần được hai nhóm chốt và version hóa. Không đưa freeze hai năm/chờ toàn bộ người nhận đồng thuận từ bản cũ vào máy trạng thái mới.

Bản 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo) lưu để tra cứu, không dùng sinh enum hiện hành.
