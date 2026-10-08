# Hiện trạng schema và yêu cầu đối soát

**Chưa có ERD/migration toàn hệ thống đã được đối soát SRS 3.14 trong workspace.** Không dùng ERD 25 thực thể baseline 3.11 như schema đã được duyệt cho bản mới.

- SQL Auth (workspace database riêng, không đóng gói trong repo Frontend): bốn bảng và smoke test, chưa được chạy xác nhận trên SQL Server.
- [SRS 3.14](srs/LegacyVault-SRS-v3.14.0.md): nguồn nghiệp vụ.
- [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md): API/DTO, trạng thái và dữ liệu cần bàn giao.
- ERD 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo): tài liệu lịch sử.

BE cần lập ERD mới cho tài khoản/phiên/role, tài sản/chỉ định/phiên bản, death case/snapshot/evidence, eKYC/consent, claim/lịch/video, quyết định/grant, đơn/webhook, retention/audit/incident.

Các tên nhóm trên là yêu cầu dữ liệu, chưa phải tên bảng hoặc DTO đã chốt. Cần xác nhận PK/FK, uniqueness, concurrency, index, nullability, quan hệ snapshot và chính sách retention trước migration.

Không mang bảng PersonalVault, chuyển quyền, freeze hai năm hoặc gói Recipient cũ sang schema mới nếu không có yêu cầu SRS. Thay đổi database qua EF Core Migration; thao tác nhiều bảng có transaction và test rollback/concurrency.
