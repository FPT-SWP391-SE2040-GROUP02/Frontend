# Yêu cầu phân quyền tích hợp

Nguồn nghiệp vụ: [SRS 3.14.0](srs/LegacyVault-SRS-v3.14.0.md). Contract và API theo vai trò: [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md).

| Vai trò canonical cần chốt | Phạm vi cần kiểm tra ở BE |
| --- | --- |
| OWNER | Tài sản/kế hoạch/hồ sơ thuộc người dùng; điều kiện sửa theo trạng thái |
| EXECUTOR | Hồ sơ và nhiệm vụ được chỉ định; kiểm tra danh tính và điều kiện thao tác |
| BENEFICIARY | Claim/quyết định của chính mình; tải đúng tài sản trong grant còn hiệu lực |
| VERIFIER | Hồ sơ được phép xét duyệt; kiểm tra phân công và xung đột vai trò |
| ADMIN | Chức năng quản trị theo quyền; không suy ra quyền đọc nội dung tài sản từ vai trò Admin |

Đây là danh sách kiểm tra, chưa thay thế ma trận quyền chi tiết được BE duyệt. Người dùng có thể có nhiều vai trò; active role phải thuộc vai trò đã xác thực. Header `X-Active-Role` không tự cấp quyền.

Kiểm tra ownership, quan hệ hồ sơ, xung đột vai trò, trạng thái, grant và deadline ở server cho từng endpoint. FE RoleGuard chỉ điều khiển hiển thị. Mọi quyết định nhạy cảm cần audit; demo phải tách khỏi quyền production.

FE hiện còn nhãn NOTARY/STAFF/CUSTOMER; cần adapter/constants và guards đồng bộ sau khi chốt. Không tái dùng quyền chuyển giao 1:1 hoặc freeze hai năm trong ma trận 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo).
