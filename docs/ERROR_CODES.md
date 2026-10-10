# Quy ước lỗi cần chốt với Backend

Chi tiết bàn giao: [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md). Danh mục dưới đây là nhóm tình huống tích hợp; **mã lỗi nghiệp vụ cuối cùng phải có trong OpenAPI**, chưa được xác nhận là enum C#.

| HTTP | Tình huống FE phải xử lý |
| --- | --- |
| 400 / 422 | Dữ liệu đầu vào sai; ánh xạ lỗi theo trường khi có |
| 401 | Hết/thiếu phiên; cơ chế refresh/đăng nhập theo contract |
| 403 | Không đủ quyền hoặc grant; không retry vô hạn |
| 404 | Đối tượng không tồn tại hoặc không được phép biết |
| 409 | Xung đột trạng thái, request lặp hoặc phiên bản thay đổi |
| 413 / 415 | File quá lớn hoặc sai loại |
| 429 | Rate limit; dùng thời điểm/Retry-After từ BE |
| 500 / 503 | Lỗi server/dịch vụ phụ thuộc; hiển thị correlation ID và retry phù hợp |

Phải phân biệt eKYC hết hạn/thất bại/cần review, lời mời hết hạn, identity chưa xác minh, quyết định đã ghi nhận, grant bị chặn/thu hồi/hết hạn, đơn chưa thanh toán và retention hold. Không tự tạo mã canonical khi BE chưa chốt.

Chốt một cấu trúc lỗi với field errors, mã ổn định, thông báo an toàn và correlation ID. Không trả stack trace, secret hoặc chi tiết giúp dò tài khoản. FE dùng constants và phân tầng inline/toast/ErrorBoundary.

Danh mục 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo) giữ để tra cứu; các mã của nghiệp vụ bị loại khỏi SRS mới không tự động còn hiệu lực.
