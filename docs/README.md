# Tài liệu bàn giao Frontend LegacyVault

Baseline nghiệp vụ: **SRS 3.14.0**. Bản tài liệu được chọn từ workspace ngày 08/10/2026 để người nhận có thể đọc cùng source sau khi clone repo Frontend.

| Tài liệu | Mục đích |
| --- | --- |
| [SRS 3.14](srs/LegacyVault-SRS-v3.14.0.md) | Nguồn yêu cầu nghiệp vụ |
| [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md) | API/DTO cần bàn giao, quyết định D0 và nghiệm thu |
| [Contract](FRONTEND_BACKEND_API_CONTRACT.md) | Quy ước tích hợp chưa được duyệt thành OpenAPI |
| [BE guide](BE_INTEGRATION_GUIDE.md) / [FE guide](FE_INTEGRATION_GUIDE.md) | Thứ tự triển khai và thay mock |
| [State](STATE_MACHINES.md) / [Permission](PERMISSION_MATRIX.md) / [Error](ERROR_CODES.md) | Ranh giới cần chốt giữa hai nhóm |
| [Dữ liệu](DATABASE_SCHEMA_ERD.md) / [Kiến trúc](SYSTEM_ARCHITECTURE_DOCUMENT.md) | Hiện trạng và yêu cầu đối soát |
| [UI kit](DESIGN_SYSTEM_UI_KIT.md) | Quy tắc chọn lọc mẫu UI |
| [Kế hoạch Auth](plans/FE-AUTH-SESSION-V1.md) / [Đối soát cấu trúc](plans/PROJECT-STRUCTURE-DB-REVIEW.md) | Kết quả kiểm tra và công việc còn lại |

Repo chứa source, font dùng trong ứng dụng, tests, scripts và cấu hình mẫu công khai. Archive 3.11, ZIP/HTML kit, mockup, SQL Auth ngoài workspace, snapshot legacy, scratch, secret, node_modules và dist không nằm trong gói bàn giao này.

Nội dung SRS được giữ nguyên. Liên kết tới tham khảo cục bộ không đóng gói đã chuyển thành ghi chú; tài liệu gốc được giữ ở workspace. Khi cập nhật contract, cập nhật bản trong repo cùng thay đổi source.

Các UI preview/scaffold chưa đại diện cho OCR, xác minh danh tính, thanh toán hoặc cấp quyền thật. BE phải chốt OpenAPI và FE thay model/transport cũ trước tích hợp. [README client](../README.md) chứa lệnh kiểm tra.
