# Quy ước hợp đồng Frontend / Backend

**Trạng thái: bản điều hướng tích hợp theo SRS 3.14.0, chưa phải OpenAPI được duyệt.**

[Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md) là danh sách bàn giao chi tiết: mục 2 chứa quyết định D0, mục 4 chứa quy ước chung, các mục tiếp theo liệt kê API/DTO và nghiệm thu.

- API có tiền tố `/api/v1`; JSON DTO camelCase, ánh xạ 1:1 DTO C# thực.
- Chốt cookie hoặc Bearer, refresh và CSRF trước khi sửa Auth.
- Chốt một response envelope và một nơi unwrap; không trả hai cấu trúc để bù lỗi transport FE.
- Thống nhất pagination, enums, lỗi, correlation ID, idempotency và deadline do server tính.
- Header vai trò/demo là ngữ cảnh request; BE vẫn xác thực quyền và phạm vi đối tượng. Demo không được mở quyền production.
- Endpoint đề xuất chưa chứng minh có controller tương ứng. BE phải bàn giao OpenAPI, mẫu JSON, test environment và danh sách đã triển khai.

Không dùng API chuyển quyền, freeze hai năm, PersonalVault hoặc chia tỷ lệ của baseline cũ cho phạm vi mới.

Contract 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo) chỉ dùng tra cứu. [SRS hiện tại](srs/LegacyVault-SRS-v3.14.0.md) là nguồn nghiệp vụ.
