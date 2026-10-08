# Đối soát cấu trúc dự án và DB Auth

Ngày: 08/10/2026. Nguồn: SRS 3.14.0, code, AGENTS.md, script SQL và prototype được cung cấp. Prototype chỉ tham khảo có chọn lọc; không thay thế SRS hoặc contract.

## 1. Use case và endpoint

| Use case | Hiện có | Cần chốt |
| --- | --- | --- |
| AUTH-01 Google | usp_login_google | Backend kiểm tra token/nonce/state trước SQL; endpoint Google |
| AUTH-02 link | UI/service scaffold | POST /api/v1/auth/google/link-account hiện có phía FE; cần reauth |
| AUTH-03 phương thức | auth_methods và guard phương thức cuối | Endpoint thêm/xóa, xác thực lại |
| AUTH-04–06 | UI/DTO phía FE | Email không cấp quyền thụ hưởng; contract lời mời/redirect nội bộ |
| Phiên/logout | usp_validate_session, usp_logout, usp_logout_all | POST /api/v1/auth/logout hiện có phía FE; giới hạn MFA pending |

Chưa có C# DTO để chứng minh ánh xạ 1:1. Cần đối soát response/envelope interceptor Axios và các service trước khi tích hợp backend thật.

## 2. Phân tầng

Đã khảo sát cấu trúc workspace và đồ thị source frontend. Entry/styles thuộc app; app lắp ghép Redux, authSlice thuộc entities/user và uiSlice thuộc shared/model. Claim DTO dùng chung nằm trong entities/claim. WillWizard ghép asset feature ở widgets. ESLint và check:architecture kiểm tra alias/relative/dynamic import theo chiều FSD.

Prototype Auth gom vào docs/mockups/auth, ZIP vào docs/mockups/archives. Ba bước wizard cũ không có caller lưu nguyên snapshot dạng .txt trong client/legacy. Feature còn chạy chưa bị tự động xóa vì khác SRS.

## 3. Ma trận tệp

| Hành động | Tệp/nhóm | Mục đích |
| --- | --- | --- |
| MOVE/MODIFY | app/main.tsx, app/App.tsx, app/styles/index.css, index.html | Entry thống nhất |
| MOVE/MODIFY | entities/user/model/authSlice.ts, shared/model/uiSlice.ts, app/store và callers | Xóa import ngược tầng |
| MOVE/MODIFY | entities/claim/model/claim.types.ts và claims/notary callers | Xóa import chéo feature |
| MOVE/CREATE | widgets/WillWizard | Ghép feature đúng tầng |
| MOVE/MODIFY | legacy/wills, features/wills/index.ts | Lưu bước cũ không sử dụng |
| CREATE/MODIFY | scripts/check-architecture.mjs, eslint.config.js, package.json | Chặn vi phạm FSD |
| MODIFY | AppRoutes, bảng asset/will, SepayQrModal, imports | Lazy routes, memo deps, expiresAt, dọn mã không dùng |
| CREATE | database/sql/google-auth.sql, database/tests/google-auth.smoke.sql | SQL được đối soát, smoke test |
| CREATE/MODIFY | README, docs/plans, .env.example | Điều hướng và cấu hình mẫu |

Giữ thay đổi có sẵn của người dùng; không commit/push hoặc áp SQL lên DB thật.

## 4. Micro-tasks

- Đã làm: chuyển source/callers, kiểm tra import AST, dọn unused imports/biến mà giữ hợp đồng hàm, lazy routes, sửa fixture cam kết pháp lý và thêm ca từ chối false.
- SQL: native ROWVERSION; FK phiên đúng auth method/user; idle policy thành cột; thống nhất thứ tự khóa; chống đổi identity/ownership; chặn thu hồi LOGIN cuối; cờ MFA pending; transaction deployment qua batch.
- Tiếp tục types/schema → service → Query hooks/queryKeys → UI: chốt DTO/response, Google/link/reauth/MFA, lỗi API và session/invitation context. Model FE chưa phải DTO backend đã phê duyệt.
- Khi có backend: ánh xạ ROWVERSION byte[] và FK trong EF; tạo Migration cho DB hiện hữu; tích hợp audit/rate limiter. CREATE TABLE không thay thế migration cập nhật.
- Đối soát feature notary/crypto/affidavit/handover với SRS mới; không tự viết logic nghiệp vụ hoặc tạo schema 32 bảng thiếu nguồn.

## 5. Điều kiện biên

Smoke test dùng dữ liệu giả và rollback: login lặp, FK phiên, rowversion, logout-all lặp, MFA pending Admin, phương thức cuối. Cần kiểm tra SQL thực thi, role permissions, timeout, token trùng/FK sai, lỗi deploy và concurrency/deadlock bằng hai kết nối trên DB thử nghiệm.

MFA pending không phải phiên Admin đầy đủ. Google email trùng yêu cầu link flow có reauth. NFR-06 đề xuất idle 30/15 phút và phiên tối đa 12 giờ; backend cần thống nhất cookie/token lifetime. Secret backend không đưa vào VITE_*. Lockout/cooldown prototype chỉ là tham khảo tới khi backend chốt chính sách.

## 6. DoD

```powershell
cd client
npm run check:architecture
npm run type-check
npm run lint
npm run test:run
npm run build
```

Architecture: 177 source files pass. TypeScript/build pass. Unit tests: 62 ca/11 tệp pass. Lint còn bốn cảnh báo React Compiler với RHF watch, không tắt rule. ScriptDom phân tích deployment và smoke test không có lỗi cú pháp. SQL chưa chạy trên SQL Server; UI chưa nghiệm thu qua browser/backend.

Manual còn cần: mở/reload từng route; login sai/mạng lỗi; link cần reauth; MFA pending giới hạn challenge; logout lỗi không báo thành công; hết phiên giữ redirect nội bộ; lời mời trước login không lộ Owner; deadline thanh toán đúng sau mở lại modal. Đích dashboard/admin mặc định cần đối chiếu vì trang tương ứng chưa đầy đủ.

Hoàn thành nhịp cấu trúc và SQL để review; chưa hoàn thành toàn bộ nghiệp vụ SRS 3.14.0.

## 7. Cập nhật tài liệu và dọn tham khảo — 08/10/2026

- Tạo [yêu cầu FE → BE](../FE_BE_INTEGRATION_REQUEST.md), cập nhật mục lục và các đường dẫn hướng dẫn theo SRS 3.14. Các trang hướng dẫn hiện là bản điều hướng, chưa thay thế OpenAPI/ERD/enum được BE duyệt.
- Chuyển 11 tài liệu baseline 3.11 nguyên bản vào archive (archive cục bộ, không đóng gói trong repo); các đường dẫn hướng dẫn trong charter vẫn tồn tại.
- Gom hai UI kit về `docs/legacyvault-ui-kit/` (41 file). Bộ cũ 29 file được nén, kiểm tra SHA-256 từng file trong ZIP rồi mới xóa thư mục trùng.
- Xóa báo cáo tự sinh `scratch/lint-current.json`; giữ thử nghiệm riêng, mockup gốc và `client/legacy/`.
- Nhịp này không sửa logic ứng dụng, không áp SQL, không commit/push. Các con số kiểm thử ở mục 6 là kết quả của nhịp đối soát trước, không phải chứng nhận tích hợp BE hiện tại.
