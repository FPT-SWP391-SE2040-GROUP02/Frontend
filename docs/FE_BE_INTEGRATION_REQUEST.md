# LegacyVault — Yêu cầu Backend để tích hợp Frontend

**Ngày lập:** 08/10/2026 (Asia/Ho_Chi_Minh)

**Phiên bản:** 1.0 — bản bàn giao để FE/BE chốt hợp đồng

**Baseline nghiệp vụ:** SRS 3.14.0 ngày 07/10/2026

**Phạm vi:** tài khoản, Owner, eKYC, chứng tử, phản đối, người nhận, video, bàn giao, thanh toán và Admin.

## 1. BE cần nhận và làm gì

FE yêu cầu BE cung cấp API có xác thực, DTO và trạng thái nghiệp vụ thực để thay dữ liệu mẫu trên React. Có giao diện không có nghĩa tính năng đã tích hợp. Không dùng kết quả preview, tham số URL hoặc nút bấm FE làm bằng chứng đã xác minh/đã trả tiền/đã cấp quyền.

Thứ tự bàn giao đề nghị: **chốt contract → Auth/session → dữ liệu Owner → eKYC → chứng tử/claim/video/grant → SePay → Admin/jobs**. BE có thể triển khai các module độc lập song song sau khi contract chung được chốt.

Trong workspace hiện tại chưa tìm thấy project `.cs` hoặc solution Backend. Tài liệu này là yêu cầu triển khai và tích hợp; không xác nhận BE chưa làm các chức năng ở repository khác. BE cần trả lại danh sách API đã có, API còn thiếu và đường dẫn repository/test environment.

### Nguồn đối chiếu

- [SRS 3.14.0](srs/LegacyVault-SRS-v3.14.0.md): nguồn yêu cầu nghiệp vụ hiện tại.
- [Kế hoạch Auth & Session](plans/FE-AUTH-SESSION-V1.md): các thiếu hụt FE đã phát hiện.
- [Contract API](FRONTEND_BACKEND_API_CONTRACT.md), [BE guide](BE_INTEGRATION_GUIDE.md), [permission matrix](PERMISSION_MATRIX.md), [state machines](STATE_MACHINES.md), [error codes](ERROR_CODES.md), [database ERD](DATABASE_SCHEMA_ERD.md): đã cập nhật điều hướng và ranh giới tích hợp theo SRS 3.14; chưa phải OpenAPI/enum/ERD được BE phê duyệt. Nội dung baseline 3.11 nguyên bản nằm trong archive (archive cục bộ, không đóng gói trong repo).
- Prototype Claude và legacyvault-ui-kit (mẫu cục bộ, không đóng gói trong repo): tham khảo bố cục, icon, badge, trạng thái UI; không quyết định nghiệp vụ, giá, ngưỡng hoặc quyền.

### Quy ước trong tài liệu

| Nhãn | Ý nghĩa |
| --- | --- |
| `FE` | Có đường dẫn trong service/bootstrap FE; chưa chứng minh Backend hoạt động |
| `CŨ` | Có trong contract baseline 3.11; chỉ dùng sau khi đối soát SRS mới |
| `ĐỀ XUẤT` | Tên endpoint/DTO mới để BE và FE thống nhất; chưa phải hợp đồng đã duyệt |

Các endpoint trong bảng được viết **tương đối với `/api/v1`**. Tất cả DTO mới dưới đây là dữ liệu FE cần, không phải DTO C# đã tồn tại. BE phải cung cấp OpenAPI và DTO thực để FE ánh xạ 1:1.

## 2. Các khác biệt phải chốt trước khi code tích hợp

| Mã | Hiện trạng | Quyết định/yêu cầu |
| --- | --- | --- |
| D0-01 | AGENTS ghi ASP.NET Core 8; contract/guide 3.11 được lưu trong archive ghi Core 10 | BE xác nhận runtime/EF Core thực và cập nhật hợp đồng đã duyệt; không suy ra version từ bản mẫu |
| D0-02 | Axios gửi cookie, không gắn Bearer; contract cũ dùng access token RAM + refresh cookie | Chọn một cơ chế theo mục 4; FE sửa theo cơ chế đã chọn |
| D0-03 | Interceptor trả body; Auth/Billing lại đọc `.data`; BaseService trả body trực tiếp | Chốt envelope và cách unwrap duy nhất; FE phải sửa transport, không yêu cầu BE trả hai kiểu để chữa tạm |
| D0-04 | FE `User.role` đơn, có `NOTARY/STAFF/CUSTOMER`; contract dùng `roles[]` và `VERIFIER` | Canonical đề nghị: OWNER/EXECUTOR/BENEFICIARY/VERIFIER/ADMIN, hỗ trợ nhiều vai trò; sửa constants, guards và adapter FE |
| D0-05 | FE AuthSession yêu cầu `refreshToken` trong JSON | Refresh token không trả cho JavaScript khi dùng HttpOnly cookie; sửa DTO FE và Redux |
| D0-06 | Mock asset/notary còn Shamir, client ciphertext giả bằng Base64 | SRS 3.14 mục 12.1 dùng envelope encryption ở BE; không xây BE giải phóng mảnh Shamir để khớp mock |
| D0-07 | Will mock dùng `/wills`, chia tỷ lệ, video tuyên thệ/chữ ký mẫu | SRS mới là kế hoạch/chỉ định nguyên gói, không chia phần trăm hoặc chữ ký số công chứng; sửa FE/model trước tích hợp |
| D0-08 | Handover cũ có chuyển quyền, lịch chung, freeze 2 năm, chờ 100% đồng thuận, import PersonalVault | Ngoài phạm vi 3.14. Mỗi người có claim/lịch/quyết định/grant độc lập; không triển khai các API cũ này |
| D0-09 | Billing FE dùng `/billing/orders`; contract cũ dùng `/payment/orders`; FE còn gói Recipient | Chọn namespace thống nhất. Đề nghị giữ `/billing/orders` cho FE; bỏ Recipient Free/Plus theo PAY-10 |
| D0-10 | Prototype có thẻ/ví và điểm mặt 92%/41% | MVP thanh toán QR/chuyển khoản SePay. Không coi phương thức khác đã được hỗ trợ; không hardcode điểm/ngưỡng mẫu |
| D0-11 | `PaginationParams` FE dùng `sortBy/isAscending`; charter mẫu dùng `sortColumn/sortOrder` | Chọn tên query canonical trong OpenAPI; FE sửa đồng bộ, không để mỗi module một kiểu |
| D0-12 | Error/state/ERD 3.11 đã được lưu archive; hướng dẫn gốc hiện điều hướng 3.14, chưa có enum/ERD được duyệt | BE bàn giao enum, transition guards, mã lỗi và ERD chi tiết theo SRS 3.14 trước khi sinh migration; FE đồng bộ model cũ |

SRS 3.14 cũng đánh dấu nhiều giá trị vận hành là **đề xuất**. BE phải version hóa cấu hình và ghi người chốt; không tự biến giá trị prototype hoặc thời hạn đề xuất thành chính sách đã duyệt.

## 3. FE hiện có những gì

| Nhóm UI | Code cần tích hợp | Mức sẵn sàng hiện tại |
| --- | --- | --- |
| Đăng nhập/đăng ký/Google/email/2FA/đăng xuất | `features/auth`, `app/providers/AuthBootstrap.tsx` | Có service/hook và UI; session/envelope/luồng challenge còn cần chốt |
| Quên/đặt lại mật khẩu | `features/auth/ui/ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx` | Form và schema; chưa có API reset hoàn chỉnh; không thay mật khẩu thật |
| Owner tổng quan | `widgets/OwnerOverview`, `pages/dashboard` | Các số liệu/UI mẫu cần API tổng hợp |
| Tài sản/kế hoạch/điểm danh/chứng tử/xét duyệt | `features/assets`, `wills`, `dms`, `claims`, `notary` | Nhiều service trả mock; có model cũ cần thay |
| eKYC hai mặt/so mặt/camera/kết quả | `features/ekyc`, `pages/ekyc` | UI preview; file chỉ được chọn cục bộ; chưa OCR/camera/PAD/so mặt thực |
| Người nhận | `pages/beneficiary`, `widgets/RecipientLayout` | Overview/content/messages/handover và trạng thái mẫu; chưa cấp grant/đọc tài sản |
| Cài đặt | `pages/dashboard/AccountSettingsPage.tsx` | Hồ sơ, điểm danh, bảo mật, tài khoản/phiên; thao tác thực chưa kết nối |
| Admin | `pages/admin` | Dữ liệu mẫu, lọc danh sách và audit; chưa RBAC/monitoring thực |
| Thanh toán | `features/billing`, `pages/billing/CheckoutPage.tsx` | Có service Billing, QR/status UI scaffold; chưa tạo/xác nhận đơn thực |

Route `/preview/*` chỉ dành cho development. `state=paid`, `outcome=success` và các giá trị tương tự chỉ chọn trạng thái minh họa; BE không được nhận chúng làm trạng thái nghiệp vụ. Build production không đăng ký preview routes.

## 4. Hợp đồng chung bắt buộc

### 4.1. URL, JSON, envelope, phân trang

- FE hiện mặc định `VITE_API_BASE_URL=http://localhost:5000/api/v1`; service thêm `/auth/login`, `/billing/plans`... Không cấu hình base chỉ có host nếu không có proxy thêm `/api/v1`; không lặp `/api/v1/api/v1`.
- JSON camelCase; ID opaque dưới dạng string; số căn cước là string 12 số, giữ số 0 đầu, không làm ID URL.
- UTC ISO 8601 cho timestamp, `YYYY-MM-DD` cho ngày sinh; FE hiển thị múi giờ Việt Nam. Server time quyết định hạn.
- Tiền phải ghi rõ currency/đơn vị; dung lượng bằng byte; không trộn MB với MiB hoặc số tiền định dạng text với number.
- `200/201`: đề nghị thống nhất `ApiResponse<T>`: `success`, `message`, `data`, `correlationId`, `timestamp`. Không trả HTTP 200 để giấu lỗi 401/403/500.
- `204`: không có body; FE không gọi `.data` trên kết quả void. File/stream/QR binary dùng content type và response type riêng, không bọc binary vào envelope.
- Danh sách trả `ApiResponse<PaginatedList<T>>`, gồm `items`, `totalCount`, `pageIndex`, `pageSize`, `totalPages`, `hasPreviousPage`, `hasNextPage`; trang đầu 1, rỗng là `items: []`. BE giới hạn pageSize và allowlist trường sort.
- Trường nullable/optional phải ghi trong OpenAPI. ID, enum và deadline dùng cho quyết định không được bịa mặc định ở FE khi server thiếu dữ liệu.

Ví dụ success được đề nghị:

```json
{
  "success": true,
  "message": "OK",
  "data": { "sessionStatus": "AUTHENTICATED", "user": { "id": "demo-user", "email": "demo@example.invalid", "fullName": "Tài khoản kiểm thử", "roles": ["OWNER"], "status": "ACTIVE", "emailVerified": true } },
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "timestamp": "2026-10-08T00:00:00Z"
}
```

Đây là minh họa shape JSON, không phải phiên/credential hoạt động.

### 4.2. Auth, cookie, CSRF và CORS

**Cần chốt D0-02 trước bàn giao Auth.** Đề nghị cookie session phù hợp transport FE hiện tại: cookie auth HttpOnly, Secure theo môi trường HTTPS, path bao phủ API cần xác thực; `GET /auth/session` khôi phục user/capabilities. Không gửi token cho JavaScript nếu toàn bộ auth dùng cookie.

Nếu BE chọn mô hình Bearer theo contract cũ, FE phải giữ access token trong RAM, thêm Authorization interceptor, refresh rotation và xử lý refresh đồng thời. Refresh cookie chỉ có path `/api/v1/auth/refresh` không thể tự xác thực các API `/assets` hoặc `/auth/session`; cần luồng bootstrap/refresh phù hợp. Không giữ cơ chế nửa cookie/nửa Bearer như hiện tại.

BE cần tài liệu cấu hình CORS allowlist đúng origin FE, credentials, preflight và CSRF thực cho request dùng cookie. Cookie SameSite/path/domain phải phù hợp deployment đã chọn; thống nhất dùng localhost hoặc 127.0.0.1 thay vì đổi qua lại. Custom header đơn lẻ không thay toàn bộ kiểm tra CSRF/origin theo thiết kế đã chọn.

Các header FE hiện có: `X-Correlation-ID`, `X-Active-Role`. `X-Active-Role` chỉ là ngữ cảnh UI; BE kiểm tra vai trò và đối tượng bằng phiên thật. `X-Demo-Mode` hiện chưa được interceptor gắn; nếu cần phải sửa FE, và chỉ có hiệu lực khi server cho phép môi trường demo. Không dựa vào header này để bỏ xác thực/identity/payment.

### 4.3. Lỗi, concurrency và capabilities

Đề nghị lỗi dùng ProblemDetails: `type`, `title`, `status`, `detail`, `errorCode`, `correlationId`, `timestamp`; validation thêm `errors` là map tên trường → mảng thông báo. Thống nhất với FE vì `ApiResponse.errors` hiện chỉ là mảng string.

| HTTP | FE cần xử lý | BE cần trả |
| --- | --- | --- |
| 400/422 | Inline validation hoặc hướng dẫn sửa/chụp lại | Mã lỗi ổn định, field/reason codes có allowlist |
| 401 | Khôi phục phiên theo cơ chế đã chốt hoặc chuyển đăng nhập | Phân biệt chưa có phiên và session expired khi cần |
| 403 | Trang không có quyền, giữ ngữ cảnh quay lại an toàn | Không trả nội dung tài sản/PII kèm lỗi |
| 404 | Không có đối tượng hoặc không công khai đối tượng | Không hỗ trợ dò chỉ định/lời mời |
| 409 | Refetch và giải thích xung đột/hạn/hold | State hiện hành được phép xem, version và reason |
| 413/415 | File quá lớn/không hỗ trợ | Giới hạn và loại được phép theo contract |
| 429 | Disable retry đến mốc phù hợp | Retry-After và retryAt khi có |
| 500/503 | Toast/error state và retry an toàn | Correlation ID, lỗi kỹ thuật; không kết luận sai danh tính |

BE có thể trả `allowedActions` và `blockedReasons` theo role/state để FE bật/tắt nút, nhưng phải kiểm tra lại mỗi mutation. Request quyết định gửi sự kiện và version/ETag đã chốt; không cho FE PATCH trạng thái tự do. Dùng idempotency/unique constraints cho tạo đơn, đặt lịch, accept/grant và webhook; retry không tạo thêm side effect. Cách gửi idempotency key và phản hồi conflict cần được mô tả trong OpenAPI.

## 5. F1 — Auth, hồ sơ và cài đặt

| UC | Endpoint tương đối | Nhãn | Request / response FE cần |
| --- | --- | --- | --- |
| AUTH-LOGIN | POST `/auth/login` | FE | email/password/rememberMe; phiên hoàn chỉnh hoặc nextAction/challenge ID; lockout retryAt theo policy |
| AUTH-REGISTER | POST `/auth/register` | FE | fullName/email/password; thống nhất phoneNumber với `phone` cũ; trả bước xác minh email, không tự cấp staff role |
| AUTH-SESSION | GET `/auth/session` | FE | UserSessionDto theo phiên thật: user ID, roles, emailVerified, account status, capabilities, expiresAt |
| AUTH-LOGOUT | POST `/auth/logout` | FE | revokeAllDevices/reason; thu hồi server session thực, cookie hết hạn đúng path/domain |
| AUTH-REFRESH | POST `/auth/refresh` | CŨ | Chỉ triển khai khi thiết kế auth cần refresh; rotate/revoke theo thiết kế đã chốt |
| AUTH-GOOGLE | POST `/auth/google/login` | ĐỀ XUẤT | ID token hoặc auth-code flow đã chốt, nonce/state; trả session/challenge, kiểm tra Google ở BE |
| AUTH-LINK | POST `/auth/google/link-account` | FE | Reauthentication + challenge/token chứng minh sở hữu Google; payload email/currentPassword/googleAuthCode hiện tại chưa đủ contract hoàn chỉnh |
| AUTH-EMAIL | POST `/auth/email/resend-verification`; POST `/auth/email/verify` | FE / ĐỀ XUẤT | Gửi lại có rate limit; token xác minh dùng một lần, có expiresAt; response không lộ tài khoản |
| AUTH-FORGOT | POST `/auth/password/forgot`; POST `/auth/password/reset` | ĐỀ XUẤT | Forgot email trả thông báo chung; reset token/password, expiry/replay/revoke policy rõ; confirmPassword chỉ validation FE nếu BE không yêu cầu |
| AUTH-2FA | POST `/auth/2fa/verify-totp` | FE | challengeId/code/rememberDevice; không cấp phiên có quyền Admin trước khi hoàn thành challenge |
| AUTH-OTP | POST `/auth/otp/verify` | FE | Contract mục đích/nonce/hạn rõ; không dùng email + mã OTP để vượt rào phiên/challenge |
| AUTH-PASSKEY | POST `/auth/passkey/options`; POST `/auth/passkey/verify`; options/verify đăng ký theo namespace chốt | ĐỀ XUẤT / FE | WebAuthn challenge do BE tạo và kiểm tra; FE service verify hiện thiếu bước options; không gọi FaceID trực tiếp từ tên nút |
| ACCOUNT-PROFILE | GET/PATCH `/users/me` | ĐỀ XUẤT | fullName, phoneNumber, birthDate; email change có quy trình xác minh riêng; cấm tự sửa roles/status |
| ACCOUNT-SECURITY | GET `/users/me/security`; POST `/auth/password/change` | ĐỀ XUẤT | Trạng thái phương thức login/2FA, yêu cầu xác thực lại; tài khoản Google không bắt buộc có password app |
| ACCOUNT-SESSIONS | GET `/auth/sessions`; DELETE `/auth/sessions/{id}` | ĐỀ XUẤT | Metadata thiết bị/thời gian, current-session flag, chỉ thu hồi phiên được phép; không trả raw token |
| ACCOUNT-DATA | POST `/users/me/data-export`; POST `/users/me/deletion-requests` | ĐỀ XUẤT | Job/request ID và trạng thái; xét hold/tham chiếu/policy, không DELETE toàn bộ dữ liệu trực tiếp từ nút |

Yêu cầu nghiệp vụ: Google `sub` là liên kết ổn định; email trùng không tự gộp account; đăng ký thường không nhận `role=ADMIN/VERIFIER` do client gửi. Các bước login/Google/register/email verification phải giữ opaque invitation context và return URL an toàn; không tiết lộ Owner/tài sản trước đúng giai đoạn (AUTH-01–06, INVITE-03).

BE bàn giao fixture: app chưa xác minh email, app đã xác minh, Google không password, email Google trùng chưa liên kết, Admin cần 2FA, account LOCKED/DISABLED, session hết hạn và thiết bị bị thu hồi. Dùng thông tin giả, không dùng dữ liệu cá nhân thật.

## 6. F1/F2A — Owner, tài sản, kế hoạch và điểm danh

| UC | Endpoint đề nghị / đường dẫn hiện có | Nhãn | Công việc BE |
| --- | --- | --- | --- |
| OWNER-OVERVIEW | GET `/owner/overview` | ĐỀ XUẤT | Tổng hợp quota, dịch vụ, kế hoạch, heartbeat, số tài sản/người nhận, nhiệm vụ và allowedActions |
| ASSET-LIST | GET `/assets`, GET `/assets/{id}`, GET `/assets/stats` | FE TODO | Metadata có ownership, phân trang; không trả payload bí mật trong danh sách |
| ASSET-WRITE | POST `/assets/upload`, DELETE `/assets/{id}` | CŨ / FE TODO | Kiểm tra MIME/quota/checksum, envelope encryption, content version; không xóa phiên bản đang được snapshot/grant tham chiếu |
| PLAN | GET/POST `/estate-plans`, GET/PATCH `/estate-plans/{id}` | CŨ / ĐỀ XUẤT | Nháp/chỉnh metadata/gói/chỉ định theo trạng thái; không dùng DTO phân bổ % của Will mock |
| PLAN-ACTIVATE | POST `/estate-plans/{id}/activate` | ĐỀ XUẤT | Kiểm tra email, entitlement, Owner enrollment, Executor đã nhận, tài sản/chỉ định hợp lệ; trả blockedReasons |
| DESIGNATION | API con `/estate-plans/{id}/packages` và `/designations` | ĐỀ XUẤT | Version gói/chỉ định; số căn cước/họ tên/ngày sinh bắt buộc, contact chỉ để liên lạc; bảo vệ snapshot |
| ASSIGNMENT | API lời mời/accept Executor dưới `/assignments` | ĐỀ XUẤT | Chấp thuận có trạng thái/phạm vi/hạn; Owner mời không tự cấp quyền nội dung hoặc staff |
| MESSAGES | GET/POST/PATCH `/estate-plans/{id}/messages` | ĐỀ XUẤT | BE/FE chốt loại nội dung, người nhận, version và cách bảo vệ; chỉ trả nội dung khi đúng quyền/giai đoạn |
| DMS-READ | GET `/dms/status`, GET `/dms/history` | FE TODO | Trạng thái kế hoạch, lastCheckInAt/nextCheckInDue, thời gian chờ, serverTime, cấu hình version |
| DMS-CHECKIN | POST `/dms/checkin` | CŨ | Chốt tên canonical; FE TODO còn `/dms/pulse`. Điểm danh hợp lệ gia hạn kỳ, không tự duyệt alive report/chứng tử/grant |
| DMS-CONFIG | GET/PUT `/dms/config` | FE TODO / ĐỀ XUẤT | Chu kỳ/thời gian chờ/nhắc; thay đổi áp dụng kỳ tiếp theo, có policy version |
| OWNER-AUDIT | GET `/audit-events` | CŨ | Owner chỉ xem sự kiện thuộc phạm vi mình, không bí mật của người khác |
| PLAN-PDF | GET `/estate-plans/{id}/export` | ĐỀ XUẤT | Kiểm tra gói XS Max và trạng thái; PDF metadata an toàn, không secret/CCCD/chứng tử; không quảng bá ký số công chứng |

**Cần chốt upload:** AGENTS nhắc presigned R2 trong khi SRS 3.14 yêu cầu BE mã hóa và kiểm tra quyền giải mã. Phương án đề nghị là FE gửi file qua BE, BE mã hóa và lưu bản mã private. Nếu dùng presigned, BE phải thiết kế staging/private + finalize, kiểm tra owner/hash/quota và mã hóa trước khi coi asset đã tạo; không PUT plaintext thẳng vào kho tài sản cuối rồi báo hoàn tất. Không giữ lại Base64 mock như một thuật toán mã hóa.

BE trả quota theo byte và đúng số tài sản; checksum, contentVersionId và manifest/snapshot phải truy vết được. Tạo mới/chỉnh sửa không ghi đè phiên bản đã chốt. `.env` R2/KEK chỉ ở server; FE không cần access key R2.

## 7. eKYC dùng chung — BE phải cung cấp cả phiên và kết quả

Các màn đọc căn cước/so mặt/camera hiện chưa có service. Nhóm endpoint dưới đây đều là **ĐỀ XUẤT**; BE có thể đổi tên khi chốt OpenAPI nhưng phải đủ các thao tác.

| UC | Endpoint tương đối | Dữ liệu/hiệu ứng |
| --- | --- | --- |
| EKYC-CONSENT | GET `/ekyc/policies?purpose=...` | Nội dung thông báo, policyVersion, mục đích và giới hạn; consent ghi trước thu thập |
| EKYC-START | POST `/ekyc/sessions` | purpose + object ID hợp lệ + consent; server gắn user/object/reference version, sessionId/expiresAt |
| EKYC-DOCUMENT | POST `/ekyc/sessions/{id}/documents` | Ảnh FRONT/BACK multipart hoặc private evidence reference đã chốt; kiểm tra cùng phiên, size/MIME/chất lượng |
| EKYC-READ | POST `/ekyc/sessions/{id}/document-analysis` | Job QR/OCR, data source theo trường, quality/reason codes; không coi đọc QR là chứng minh thẻ thật |
| EKYC-CHALLENGE | POST `/ekyc/sessions/{id}/challenge` | Nonce, ordered randomized actions, expiresAt, yêu cầu evidence/capture cụ thể |
| EKYC-EVIDENCE | POST `/ekyc/sessions/{id}/challenge-evidence` | Evidence camera đúng nonce/phiên; chốt file/chunk/codec và limit trước FE capture |
| EKYC-SUBMIT | POST `/ekyc/sessions/{id}/submit` | Kiểm tra đủ evidence; chuyển processing/job; không nhận outcome/score do FE tự tính |
| EKYC-STATUS | GET `/ekyc/sessions/{id}` | sessionStatus + outcome riêng, currentStep, results, reasonCodes, allowedActions, serverTime |
| EKYC-CANCEL | POST `/ekyc/sessions/{id}/cancel` | Hủy đúng phiên; thử lại tạo session mới trong limit, không sửa kết quả đã hoàn tất |

### Dữ liệu response cần có

| Nhóm | Trường tối thiểu đề nghị |
| --- | --- |
| Phiên | sessionId, purpose, objectId, sessionStatus, outcome nullable, expiresAt, serverTime, nextAction |
| Consent | policyVersion, purpose, consentedAt; BE lưu user và bằng chứng chấp thuận |
| QR/OCR | Dữ liệu cần thiết được quyền xem: nationalIdNumber, fullName, birthDate, expiryDate nếu mẫu thẻ có; source/quality theo trường, conflicts và recapture reasons |
| Thử thách | challengeId, nonce theo giao thức, actions[], expiresAt, evidence requirements |
| Kết quả | quality/PAD/motion/face kết quả tách riêng; modelVersion, thresholdVersion, reasonCodes; chỉ trả mức chi tiết theo quyền/giai đoạn |
| UI | allowedActions, retryAt, attemptsRemaining khi phù hợp, currentStep, các lý do cần chụp lại/xem xét |

`OWNER_ENROLLMENT`, `BENEFICIARY_CLAIM`, `OWNER_ALIVE` là ba purpose riêng. SessionStatus: CREATED/CAPTURING/PROCESSING/COMPLETED/ERROR/EXPIRED/CANCELLED. Outcome chỉ PASSED/REVIEW_REQUIRED/FAILED khi có kết luận. Không map timeout/model error thành FAILED hoặc gian lận.

BE phải quản lý model/ngưỡng/version, tạo challenge và kiểm tra replay, một khuôn mặt liên tục, PAD + động tác + so mặt. Selfie tải từ thiết bị trong prototype chỉ phục vụ thử nghiệm phù hợp môi trường; kết luận PASSED nghiệp vụ phải dùng selfie challenge đạt của cùng phiên. Không cho FE sửa ngưỡng để đạt, đổi ảnh mẫu Owner hoặc gửi danh tính kỳ vọng để BE tin.

Theo SRS: ảnh JPEG/PNG/WEBP ≤8 MiB, ≤20 megapixel là giới hạn đề xuất cần chốt; server kiểm tra bytes/nội dung chứ không tin extension/MIME FE. Không thu địa chỉ hoặc dữ liệu QR dư chỉ vì đọc được (PRIV-02); trường địa chỉ trong UI hiện tại cần FE/BE rà lại phạm vi tối thiểu.

Nhánh PASSED cho Beneficiary chỉ mở đặt lịch video khi đối chiếu chỉ định đạt. Enrollment đạt chỉ hoàn tất một điều kiện kích hoạt. OWNER_ALIVE đạt chỉ tạo bằng chứng cho Verifier. **Không nhánh eKYC nào tự cấp grant.**

## 8. F2B/F2C — Chứng tử và Owner báo còn sống

| UC | Endpoint tương đối | Nhãn | Công việc BE |
| --- | --- | --- | --- |
| DEATH-CASE | POST/GET `/cases`, GET `/cases/{id}` | CŨ / ĐỀ XUẤT | Assignment/resource guards; một hồ sơ hoạt động cùng phạm vi; snapshot asset/package/designation/assignment |
| DEATH-SUBMIT | POST `/cases/{id}/submit`; POST `/cases/{id}/supplements` | CŨ / ĐỀ XUẤT | Tệp đủ trang, declaration của Executor, documentVersion; bổ sung tạo phiên bản và xác nhận mới |
| DEATH-REVIEW | POST `/cases/{id}/adjudicate` | CŨ, đổi enum theo 3.14 | Verifier được phân công; bổ sung/từ chối/APPROVED_FOR_HANDOVER, lý do + version đã xét |
| OWNER-ALIVE | POST `/cases/{id}/alive-reports`; GET `/cases/{id}/alive-reports/{reportId}` | ĐỀ XUẤT | Ghi lần đầu/hạn, hold phát hành mới ngay; eKYC OWNER_ALIVE, không dùng heartbeat thay selfie |
| ALIVE-CONCLUDE | POST `/cases/{id}/alive-reports/{reportId}/conclusion` | ĐỀ XUẤT | Chỉ Verifier hợp lệ; kết luận/căn cứ/version; bác phản đối không tự duyệt chứng tử |

FE TODO `/claims/submit`, `/claims/my-claims`, `/notary/claims/pending` và approve/reject mock cần migrate, không yêu cầu BE lập thêm ba nghiệp vụ song song chỉ vì tên cũ. Payload Share 2/notaryPinCode/chữ ký công chứng không phải contract mới.

Response cần: caseId, caseStatus, documentVersion, snapshotId, assignedExecutor/Verifier metadata được phép, notificationDeliveryStatus, objectionStartedAt/objectionDeadline, aliveReportStatus, holdSummary, allowedActions và blockedReasons.

Thông báo Owner phải có bằng chứng giao theo kênh đã chốt trước khi chạy cửa sổ phản đối. 72 giờ là đề xuất trong SRS, không được hardcode ở UI làm điều kiện duyệt. Chưa hết cửa sổ hoặc còn hold thì BE chặn duyệt. Báo sống và accept/grant đồng thời phải kiểm tra hold trong cùng giao dịch; báo lặp không reset hạn. Grant đã có xử lý theo phạm vi kết luận/sự cố, không hứa thu hồi được file đã tải.

## 9. F3 — Lời mời, người nhận, lịch/video, nhận và đọc nội dung

Toàn bộ API mới dưới đây là **ĐỀ XUẤT**. Phải phân biệt `claimId`, `designationId`, `handoverId`, `grantId`, `scheduleId`; không dùng email hoặc số căn cước làm khóa route.

| UC | Endpoint tương đối | Công việc BE / dữ liệu FE cần |
| --- | --- | --- |
| INVITE-CONTEXT | POST `/invitations/resolve` | Token opaque trong body, trạng thái và hướng login an toàn; trước xác thực không trả tên Owner/tài sản/chỉ định đầy đủ |
| CLAIM-START | POST `/beneficiary/claims` | Invitation context đã xác thực; không chặn eKYC vì email/phone khác chỉ định; chống tạo claim hoạt động trùng |
| CLAIM-READ | GET `/beneficiary/claims`; GET `/beneficiary/claims/{id}` | Phase, state, việc tiếp theo, deadlines/hold, metadata đúng giai đoạn, allowedActions |
| CLAIM-WITHDRAW | POST `/beneficiary/claims/{id}/withdraw` | Người chưa gắn danh tính chỉ rút claim; không ghi DECLINED thay Beneficiary thật |
| CLAIM-REVIEW | POST `/executor/claims/{id}/review` | Executor xem evidence được phân công, yêu cầu bổ sung/cho đi video; quyết định riêng, không sửa outcome model |
| VIDEO-SLOTS | GET `/beneficiary/claims/{id}/available-slots` | Slot/timezone/duration, Executor hợp lệ, nằm trong hạn claim |
| VIDEO-SCHEDULE | POST `/beneficiary/claims/{id}/schedules`; POST `/schedules/{id}/reschedule`; POST `/schedules/{id}/cancel` | Một lịch hiệu lực/claim, conflict 409, idempotency; vô hiệu room/token lịch cũ và thông báo hai bên |
| VIDEO-JOIN | POST `/schedules/{id}/join-token` | Provider/server URL, room/session ID, token ngắn hạn đúng participant/phân công; không room name công khai là quyền |
| VIDEO-CONCLUDE | POST `/executor/claims/{id}/identity-decisions` | observationSufficient và identityDecision riêng, lý do/evidence/version; video không đủ rõ là lỗi kỹ thuật, không sai người |
| RECIPIENT-PORTAL | GET `/beneficiary/overview`; GET `/beneficiary/handovers` | Tóm tắt lượt, claim, lịch, trạng thái, hạn và việc được phép; không payload bí mật trước grant |
| HANDOVER-DECIDE | POST `/beneficiary/handovers/{id}/decisions` | ACCEPT hoặc DECLINE canonical cần chốt; chỉ READY_TO_ACCEPT đúng tài khoản/hạn/hold; chấp thuận tạo commit + grant riêng nguyên tử |
| CONTENT-LIST | GET `/beneficiary/grants/{id}/assets` | Metadata đúng snapshot/version và grant còn hạn; không account payload/seed/password trong danh sách |
| CONTENT-READ | GET `/beneficiary/grants/{id}/assets/{assetId}/content`; GET `/beneficiary/grants/{id}/assets/{assetId}/download` | Kiểm tra grant/hold/version mỗi truy cập, kiểm tra integrity trước xuất plaintext, stream/content type/filename đúng |
| RECIPIENT-MESSAGES | GET `/beneficiary/grants/{id}/messages` | BE chốt lời nhắn là phần gói/grant hay quyền riêng; không đọc chỉ nhờ biết link/người nhận |

Kết luận đúng người của Executor chuyển READY_TO_ACCEPT, chưa mở payload. Nhận nguyên gói không chọn tỷ lệ. Mỗi người cùng gói được cấp grant riêng, không đợi người khác đồng thuận; người khác từ chối không hủy grant đã hợp lệ.

Response FE cần mốc riêng: invitationResponseDueAt, identityProcessingDueAt, scheduleStartAt, decisionDueAt, grantExpiresAt, retentionStartedAt/retentionDeadline và serverTime. Không gom thành một trường `remainingDays` để FE đoán. Mốc quyết định/tải bắt đầu theo sự kiện server, không từ lúc mở trang.

Không phản hồi 5 ngày, quyết định 7 ngày, xem/tải 7 ngày và lưu đủ điều kiện 30 ngày là các đồng hồ độc lập của SRS. Retry/login/link mới không reset. Cleanup kiểm tra mọi claim đủ điều kiện, grant, version references và holds; không xóa toàn kho từ việc một người từ chối.

Video trong app là yêu cầu tích hợp thật. Provider chưa chốt trong SRS; nếu nhóm chọn LiveKit, BE cấp participant token, FE dùng SDK sau khi được duyệt dependency. Không bắt buộc ghi toàn bộ cuộc gọi; không phát LiveKit API secret cho FE. Metadata cuộc gọi và kết luận phải đủ audit.

## 10. P — Gói Owner và SePay

| UC | Endpoint tương đối đề nghị | Hiện trạng / yêu cầu |
| --- | --- | --- |
| PLAN-CATALOG | GET `/billing/plans` | Có FE service; trả ba gói Owner đúng SRS và priceVersion/quota/currency, không Recipient Plus |
| SERVICE | GET `/billing/subscription` | ĐỀ XUẤT: vaultId, tier, quota, expiresAt, renewal eligibility và trạng thái dịch vụ |
| ORDER-CREATE | POST `/billing/orders` | Có FE service; chốt request planId/vaultId/purpose, BE tự lấy giá/chu kỳ; không tin giá/voucher/billingCycle do client |
| ORDER-STATUS | GET `/billing/orders/{id}` hoặc `/billing/orders/{id}/status` | FE hiện dùng suffix status; chọn một endpoint canonical, trả order state thay chỉ `isPaid` |
| ORDER-CANCEL | POST `/billing/orders/{id}/cancel` | ĐỀ XUẤT: cancel không phủ nhận tiền có thể đến sau; chỉ đúng owner/quyền |
| WEBHOOK | POST `/billing/webhooks/sepay` | ĐỀ XUẤT namespace; contract cũ dùng `/payment/webhook`; server-to-server, FE không gọi |
| INVOICE | GET `/billing/invoices`; GET `/billing/invoices/{id}/download` | FE có list; chứng từ private theo ownership, phân trang/download contract cần chốt |

PaymentOrderDto cần orderId/orderCode, vaultId, plan snapshot/version, amount/currency, status, createdAt/expiresAt/serverTime, qrCodeUrl hoặc QR payload theo contract, thông tin ngân hàng/nội dung chuyển khoản được phép hiển thị, paidAt nullable và reconciliation metadata phù hợp quyền.

State canonical SRS: PENDING/PAID/CANCELLED/EXPIRED/RECONCILIATION_REQUIRED. FE phải bổ sung trạng thái đối chiếu. Không dùng SUCCESS thay PAID tùy endpoint. Gói Free không tạo đơn 0 đồng; cùng mục đích/kho chỉ một đơn pending; retry trả lại đơn hợp lệ.

BE xác thực webhook, lưu receipt bền vững rồi xử lý đối chiếu: tiền vào, tài khoản nhận, mã đơn, số tiền, transaction ID và thời điểm giao dịch. Provider event lặp không cấp gói lần hai. Giao dịch sai/muộn/dư được lưu cần đối chiếu; không chỉ bỏ qua hoặc buộc người dùng thanh toán lại. Webhook nhận thành công khác đơn thanh toán thành công.

Entitlement cấp/gia hạn trong transaction cùng kết quả thanh toán; admin, ảnh chuyển khoản, query `paid=true` và nút “Tôi đã chuyển khoản” không được cấp gói. Không yêu cầu API người dùng tự simulate-success: SRS 3.14 PAY-01 đã loại chức năng này. Fixture/test provider trong môi trường riêng không cấp dịch vụ Live.

FE polling chỉ khi đơn PENDING và trang/modal đang theo dõi; dừng khi terminal hoặc rời trang. RECONCILIATION_REQUIRED hiển thị thông báo theo dõi, không tự tạo đơn mới. Thẻ và ví điện tử trong prototype chưa thuộc phương án SePay MVP nên không yêu cầu tích hợp các cổng này ở đợt đầu.

## 11. F4 — Admin, audit, sự cố và jobs

Các endpoint Admin mới là **ĐỀ XUẤT**; audit-events có trong contract cũ nhưng scope/DTO phải đối soát.

| UC | Endpoint tương đối | BE cần làm |
| --- | --- | --- |
| ADMIN-OVERVIEW | GET `/admin/overview` | Counts, hàng chờ, sự cố mở, health có measuredAt; không biến lỗi probe thành số 0/healthy |
| ADMIN-USERS | GET `/admin/users`, GET `/admin/users/{id}` | Tài khoản, trạng thái, roles, login methods và verified flags; pagination/filter; không secret/hash/token |
| ADMIN-ACCOUNT | POST `/admin/users/{id}/lock`, `/unlock`, `/revoke-sessions`; PUT `/admin/users/{id}/roles` | Reason + concurrency/version, step-up policy; không self-elevation hoặc vô hiệu Admin cuối cùng |
| ADMIN-CASES | GET `/admin/cases`, GET `/admin/cases/{id}` | Metadata tiến trình/phân công/hạn/hold, không payload; không endpoint Admin approve death/identity/grant |
| ADMIN-AUDIT | GET `/audit-events` | Filter time/actor/object/action/result/correlationId, pagination; read-only, redaction |
| ADMIN-INCIDENT | GET/POST `/admin/incidents`, GET `/admin/incidents/{id}`; POST các action assign/start/wait/resolve/close | Luồng OPEN → xử lý/chờ → RESOLVED → CLOSED có assignee/deadline/căn cứ; không PATCH status tự do |
| ADMIN-HEALTH | GET `/admin/integrations/health`, GET `/admin/jobs`, GET `/admin/notifications` | Metadata Google/mail/SMS/video/eKYC/SePay/storage/jobs/backup; không bí mật/evidence sinh trắc |
| ADMIN-CONFIG | GET/PUT `/admin/settings` | Cấu hình được allowlist/version/audit; mặc định điểm danh áp dụng mới/kỳ sau; không sửa điểm eKYC của một hồ sơ hoặc xem khóa |

Jobs BE phải chạy bền vững, không phụ thuộc FE mở trang: nhắc/hết hạn điểm danh, email/lời mời, claim/lịch/video, quyết định/grant, phản đối/báo sống, order/reconciliation, retention/cleanup, evidence deletion và cảnh báo quá SLA. API vẫn chặn ngay ở deadline dù job chậm; mỗi notification milestone chống gửi trùng và có retry/delivery evidence.

Audit ghi actor/role/action/object/version/time/result/reason/correlation; không ghi password/OTP/full token/full CCCD/ảnh/vector/DEK/KEK/seed/file payload. Admin không có quyền tải tài sản qua vai trò Admin; cũng không sửa/xóa lịch sử để hợp thức hóa quyết định.

## 12. Phần lưu trữ và hạ tầng BE cần chuẩn bị

### 12.1. Nhóm dữ liệu, không phải tên bảng đã chốt

BE thiết kế entities/migrations theo SRS 3.14 mục 11.6: account/auth identities/sessions/challenges; vault/plan/config versions; assets/content versions/packages/designations; assignments; death case/document versions/snapshots; eKYC consent/session/job/evidence/template versions; alive reports/holds; beneficiary claims/schedules/video metadata/identity decisions/handover commits/grants; orders/provider receipts/transactions/entitlements; notification delivery; incidents/retention/reference tracking/audit/tombstones.

SQL Auth bốn bảng tại `database/` và ERD 3.11 chưa đủ chứng minh schema hỗ trợ tất cả luồng mới. Mọi thay đổi BE qua EF Core migration. Commit/grant, payment/entitlement, giữ snapshot và cleanup phải có transaction/concurrency/unique constraints; không chỉ khóa nút FE.

### 12.2. Cấu hình bàn giao, không chứa giá trị bí mật

| Nhóm | BE quản lý | FE được nhận |
| --- | --- | --- |
| API | URL/HTTPS/CORS/cookie/CSRF/session policy | API base URL, cách lấy/gửi CSRF theo contract |
| Google | Audience/client settings, verification và callback policy; secret nếu flow cần | Public Google client ID, flow đã chốt |
| Storage/crypto | R2 private credentials, bucket policy, KEK/key rotation, file limits | DTO upload/download hợp lệ; không R2 secret/KEK |
| eKYC | Model/internal API credentials, queue, threshold/policy versions | Session/challenge/status/limits được phép xem |
| Mail/SMS | SMTP/provider credentials, queue/delivery adapter | Status/retryAt cần cho UI, không password provider |
| SePay | Webhook auth, Test/Live, tài khoản nhận, đối chiếu | Đơn và QR hợp lệ; không webhook secret |
| Video | Provider keys/secret và room admission | Public server URL và participant token giới hạn |

Không đưa các giá trị secret đã gửi trong chat vào tài liệu, fixture hoặc source; không tạo biến `VITE_*` cho secret server. Provider chưa được chốt không được coi là tích hợp xong chỉ vì có biến môi trường.

## 13. Phần FE chịu trách nhiệm sửa khi contract chốt

| Tệp/nhóm | MODIFY / CREATE | Micro-task |
| --- | --- | --- |
| `shared/api/axiosClient.ts`, `baseService.ts`, `shared/types/index.ts` | MODIFY | Unwrap envelope một lần, response binary/204, typed errors/field errors; test transport qua interceptor thật |
| `features/auth/model/auth.types.ts`, `entities/user/model/user.types.ts`, roles/guards/bootstrap | MODIFY | Canonical session/roles, cookie hoặc Bearer, email/challenge branch, bỏ refreshToken JSON nếu cookie |
| `features/auth/api/authService.ts`, auth hooks/forms | MODIFY | Google/forgot/reset/email/challenge/reauth contract, pending/error/invalid/expired; không báo success trước response |
| `features/assets`, `wills`, `dms`, `claims`, `notary`, `handover` | MODIFY | Bỏ mock nghiệp vụ cũ, DTO/schemas theo SRS mới; /wills → kế hoạch, NOTARY → VERIFIER; bỏ %/Shamir/freeze/import |
| `features/ekyc/model`, `api`, hooks | CREATE/MODIFY | DTO/schema → service → queryKeys/hooks → UI; purpose/consent/evidence/challenge/status; đọc `nextAction` thực |
| Beneficiary/Owner/Admin/settings/checkout pages | MODIFY | Dữ liệu thật qua hooks, allowedActions, field/status/error/empty/skeleton, deadline theo server |
| Billing DTO/service/QR UI | MODIFY | Namespace chốt, PAID/reconciliation, plan/vault purpose, polling và dừng an toàn, quota byte |
| `entities/*/lib/adapters.ts` | CREATE/MODIFY khi cần | DTO → ViewModel tập trung; không parse enum/date/shape phân tán trong UI |
| `shared/config/env.ts`, query keys và constants | MODIFY | API base, enum/error/message canonical, không lộ secret trong bundle |

Thứ tự FSD: app → pages → widgets → features → entities → shared. Feature mới theo Model/Zod → Service → Query hooks → UI. Logic nghiệp vụ, crypto, provider và submit handlers hoàn chỉnh do developer làm; UI scaffold/TODO không phải thực thi nghiệp vụ.

## 14. Thứ tự ưu tiên và gói bàn giao BE

| Đợt | BE bàn giao | FE tích hợp được | Điều kiện kết thúc |
| --- | --- | --- | --- |
| P0 | D0-01…12, OpenAPI, auth/envelope/error/cors/roles, môi trường và seed | Transport, login/session/logout | Không còn ambiguity DTO và auth; quyền server được kiểm thử |
| P1 | Auth đầy đủ, hồ sơ, Owner read API, plans/assets/DMS | Auth/settings/Owner dữ liệu thật | Login reload/logout/lockout, CRUD/quota/version, empty/error đúng |
| P2 | eKYC thực theo ba purpose + consent/challenge/queue | Hai mặt/camera/so mặt/kết quả | PASS/REVIEW/FAIL/ERROR/EXPIRED phân biệt; replay và cross-purpose bị chặn |
| P3 | Case/alive report/claim/video/identity/accept/grant/download | Luồng bàn giao end-to-end | Đúng người + chấp thuận mới đọc; deadline/hold/concurrency đúng |
| P4 | SePay Test QR/order/webhook/reconciliation + invoices/entitlement | Thanh toán thật môi trường Test | Provider receipt được đối chiếu, chống trùng; không FE tự paid |
| P5 | Admin/audit/incidents/jobs/cleanup/health | Quản trị và vận hành | Admin không vượt vai trò nghiệp vụ; jobs và cleanup kiểm tra mọi tham chiếu |

P4 có thể phát triển song song P2/P3 khi schema dịch vụ và Auth đã chốt. Các đợt là thứ tự phụ thuộc, không phải số Sprint hoặc cam kết deadline; nhóm gắn Jira key/người chịu trách nhiệm và ước lượng sau khi chia task ≤8 points theo charter.

### BE phải gửi cho FE ở mỗi đợt

1. OpenAPI JSON/Swagger URL của môi trường thật và commit/version tương ứng; request/response/error mẫu đã bỏ bí mật.
2. Danh sách endpoint: đã có/đang làm/chưa chốt, policy quyền và ownership, pagination/enums/nullability/limits.
3. Địa chỉ API, CORS origin, auth/cookie/CSRF instructions, cách chạy service + migrations + seed dữ liệu giả.
4. Postman collection hoặc bộ integration tests có Auth và các nhánh lỗi; fixture cho từng state, không chỉ happy path.
5. Provider Test setup, delivery/webhook callback configuration và tình trạng tích hợp thực; không gửi secret qua tài liệu.
6. Evidence kiểm thử server: idempotency/concurrency/deadline, owner isolation, role revoked, expired tokens, integrity và redaction.
7. Người phụ trách từng nhóm API, Jira key, ETA do nhóm xác nhận và contract changelog. Thay đổi breaking phải báo và đồng bộ FE; không âm thầm đổi tên trường.

## 15. Tiêu chí nghiệm thu tích hợp

### Automated commands

Trong `client/` chạy các script đang có:

```bash
npm run type-check
npm run check:architecture
npm run test:run
npm run build
```

Chạy ESLint cho các tệp thay đổi; `npm run lint` là kiểm tra toàn repo, phải tách lỗi có sẵn với regression. Thêm contract/integration test dùng server hoặc test host thật; mock service unit test không chứng minh envelope/cookie/provider đã tương thích.

Trong repository BE sau khi có solution: `dotnet build`, `dotnet test`; BE bàn giao lệnh migration/start theo tên project thực. Không có solution ở workspace này nên tài liệu không đưa lệnh giả chứa tên csproj chưa tồn tại và không tuyên bố BE tests đã chạy.

### Manual UI và acceptance scenarios

| AC | Thao tác | Kết quả cần có |
| --- | --- | --- |
| AC-01 | App login → reload → logout → mở URL được bảo vệ | Session hydrate đúng; logout server thực; phiên cũ không dùng được |
| AC-02 | Account LOCKED/email unverified/Admin challenge chưa hoàn tất | Đúng bước UI và giới hạn server, không có quyền sớm |
| AC-03 | Google email trùng account app; mở lời mời qua login/register | Link cần xác thực account; context phục hồi, không tự gộp quyền hoặc lộ tài sản |
| AC-04 | Forgot/reset với token sai/hết hạn/dùng lại | Thông báo phù hợp; không account enumeration; token không replay |
| AC-05 | Upload loại sai/quá quota; sửa asset đã snapshot | BE reject có lý do; asset cũ không mất hoặc bị ghi đè |
| AC-06 | eKYC ảnh mờ/QR-OCR conflict/timeout/sai nonce/sai purpose | Chụp lại/review/error phân biệt; không model error thành gian lận hoặc grant |
| AC-07 | Người nhận khác email chỉ định đăng nhập rồi eKYC | Vào eKYC được; identity vẫn đối chiếu số căn cước/name/DOB từ snapshot |
| AC-08 | eKYC PASSED nhưng chưa video; video lỗi hoặc người khác vào phòng | Chưa grant; lỗi kỹ thuật không sai người; room token/phân công được kiểm tra |
| AC-09 | Hai người đặt cùng slot; reschedule xong dùng token phòng cũ | Một booking thắng, bên kia 409/refetch; token cũ bị chặn |
| AC-10 | Executor xác nhận đúng người; Beneficiary accept hai lần | READY_TO_ACCEPT trước accept; một commit/grant/deadline, không cấp trùng |
| AC-11 | A/B cùng gói: A nhận, B chưa nhận/từ chối | A đọc theo grant riêng, không chờ B; B không có payload; không xóa version A đang dùng |
| AC-12 | Accept đồng thời Owner báo sống/expiry/cleanup | Giao dịch kiểm tra trạng thái và hold; không phát hành grant trái điều kiện |
| AC-13 | Đọc/download đúng lúc hết grant hoặc file sai tag/checksum | Server chặn ngay; không xuất plaintext sai; retry không reset hạn |
| AC-14 | Reload order, webhook lặp/sai tiền/muộn/provider processing lỗi | Không đơn/entitlement trùng; đối chiếu rõ; không FE tự ghi PAID |
| AC-15 | Admin thử read payload/approve identity/mark paid | BE từ chối; audit chỉ metadata; Admin không có quyền do route/header tự cấp |
| AC-16 | Danh sách rỗng/lỗi API/mất mạng | Loading/error/empty/success đầy đủ; retry không tạo side effect lặp |
| AC-17 | Để browser đóng qua deadline; job reminder/cleanup chạy | State server đúng và audit đầy đủ; mở link/claim không đủ bằng chứng không kéo dài lưu |

### Definition of Ready cho tích hợp một màn

DTO và endpoint được chốt; các quyết định D0 ảnh hưởng màn đã giải quyết; server có seed/test account phù hợp; có cả success/error/empty response và policy quyền; FE biết API version, deadline và nextAction. Màn có nút trong prototype nhưng chưa có contract không được đánh dấu ready.

### Definition of Done cho một màn

FE bỏ mock trên route thực, render đủ trạng thái, dùng DTO/query hook đúng contract và mutation theo response thật; BE có authorization/integration tests; manual AC liên quan đã qua; có evidence và correlation khi lỗi; preview vẫn được ghi nhãn và không được coi là quyền thật. Không thay provider hoặc kết luận nghiệp vụ bằng scaffold để đạt DoD.

## 16. Phiếu phản hồi dành cho BE

| Nội dung cần BE xác nhận | Kết quả / người phụ trách |
| --- | --- |
| Repository BE, runtime/EF Core, solution và commit hiện tại | Chưa cung cấp |
| Auth cookie hay Bearer; CSRF/CORS và session/challenge DTO | Chưa chốt |
| Envelope/ProblemDetails/enums/pagination canonical | Chưa chốt |
| Namespace plans/cases/billing và mapping các service FE cũ | Chưa chốt |
| Provider eKYC/video/SMS, môi trường Test/Live và policy versions | Chưa chốt |
| Danh sách API đã chạy được + Swagger/collection/fixtures | Chưa cung cấp |
| Jira/người phụ trách/ETA và các giá trị cần khách hàng xác nhận | Chưa cung cấp |

Tài liệu này không thay thế phê duyệt nghiệp vụ hoặc OpenAPI chính thức. Sau phản hồi BE, cập nhật contract/ERD/state/error/permission cùng phiên bản rồi FE mới ánh xạ DTO; không ép BE sao chép shape mock đang khác SRS.
