# Hướng dẫn bàn giao Backend cho Frontend

Baseline: [SRS 3.14.0](srs/LegacyVault-SRS-v3.14.0.md). Danh sách API, DTO, lỗi và kịch bản nghiệm thu: [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md).

## Thứ tự triển khai

1. Xác nhận runtime/EF Core, repository BE và OpenAPI; giải quyết D0 trong tài liệu bàn giao.
2. Auth/session, quyền theo đối tượng, hồ sơ và dữ liệu Owner.
3. eKYC, hồ sơ chứng tử, phản đối, xác minh người nhận và video.
4. Quyết định bàn giao/grant độc lập cho từng người; SePay, Admin và background jobs.
5. Bàn giao dữ liệu thử nghiệm, ví dụ request/response và kết quả integration test.

BE chịu trách nhiệm trạng thái, thời hạn, audit, quyền tải, xác nhận thanh toán và mã hóa envelope phía server. Không tin preview/query URL, điểm AI mẫu hoặc header vai trò như bằng chứng quyền.

Mọi thay đổi database đi qua EF Core Migration; ghi nhiều bảng dùng transaction. Upload R2, xử lý media, khóa mã hóa và secret ở phía BE; cấu hình công khai Vite không chứa secret. API nhạy cảm cần rate limiting và xử lý request lặp.

Workspace này chưa có project C# để xác nhận tính năng đã triển khai. Bản SQL Auth bốn bảng là tài liệu riêng, chưa thay thế migration/schema toàn hệ thống.

Guide 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo) giữ để tra cứu; runtime trong đó chưa phải quyết định đã chốt.
