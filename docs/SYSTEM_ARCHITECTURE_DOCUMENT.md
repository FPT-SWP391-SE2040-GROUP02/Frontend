# Hiện trạng kiến trúc LegacyVault

## Thành phần trong workspace

- `client/`: React 19/TypeScript, FSD, shared API, Query/Redux và UI preview/scaffold.
- `database/`: SQL Auth và smoke test; chưa phải database toàn hệ thống.
- `docs/`: SRS 3.14, yêu cầu tích hợp, kế hoạch, mockup/UI kit và archive.
- Chưa tìm thấy project Backend C# trong workspace; không suy ra hiện trạng ở repository BE khác.

[Contract](FRONTEND_BACKEND_API_CONTRACT.md) và [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md) ghi những quyết định còn chờ chốt. Backend cần xác nhận runtime/EF Core thay vì chọn theo bản mẫu.

## Các ranh giới tích hợp

FE hiển thị trạng thái và gọi API; BE xác thực quyền, áp dụng nghiệp vụ/deadline, lưu dữ liệu, mã hóa envelope, cấp grant và xử lý SePay/jobs. Upload/media/eKYC và secret thuộc tích hợp BE; preview không thay thế dịch vụ thực.

Không coi các thành phần hạ tầng mô tả trong tài liệu cũ là đã triển khai. Bàn giao cần repository, OpenAPI, environment, cấu hình mẫu không secret, migrations và bằng chứng test.

Kiến trúc 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo) giữ để tra cứu; [SRS 3.14](srs/LegacyVault-SRS-v3.14.0.md) là nguồn nghiệp vụ hiện tại.
