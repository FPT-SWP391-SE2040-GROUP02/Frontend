# Kế hoạch Auth & Session — FE-AUTH-SESSION-V1

Ngày đối soát: 08/10/2026. Nguồn nghiệp vụ mới: [SRS 3.14.0](../srs/LegacyVault-SRS-v3.14.0.md), ngày 07/10/2026, do người dùng cung cấp.

**Trạng thái: có scaffold giao diện; chưa đạt DoD.** Type-check pass không chứng minh luồng xác thực hoạt động. Các phát hiện dưới đây dựa trên đọc code và chạy checks; chưa chạy UI/browser hay backend thật. Jira key chưa được cung cấp; mã phân hệ không phải Jira key.

## 1. Use case, yêu cầu và endpoint

SRS 3.14.0 không định nghĩa đầy đủ HTTP DTO/endpoints. Contract 3.11 nguyên bản đã chuyển vào archive; bản đó ghi ASP.NET Core 10, trong khi AGENTS.md ghi Core 8. [Yêu cầu FE → BE](../FE_BE_INTEGRATION_REQUEST.md) tập hợp quyết định cần chốt; các hướng dẫn hiện tại chưa phải OpenAPI được duyệt. Không tự suy diễn DTO C# hoặc runtime Backend.

| Mockup / UC | Yêu cầu liên quan | Endpoint | Hiện trạng |
| --- | --- | --- | --- |
| 1 / UC-AUTH-01: đăng nhập | AUTH-01, AUTH-04 | POST /api/v1/auth/login | Service/hook/form có; Google handler chỉ TODO; chưa có phân nhánh xác minh email/2FA |
| 2 / UC-AUTH-02: sai thông tin | Chính sách khóa cần contract | POST /api/v1/auth/login | Mỗi lỗi đều giảm lượt, kể cả mạng/500; không lấy attemptsRemaining server |
| 3 / UC-AUTH-03: khóa | Chính sách 5 lần/15 phút từ mockup | /api/v1/auth/lockout-status: method cần chốt | Chỉ có state URL/local timer; chưa có service/query khóa |
| 4 / UC-AUTH-04: lời mời | AUTH-06, INVITE-03, CLAIM-01, MATCH-07 | GET /api/v1/invitations/{token}/context: đề xuất, chưa chốt | LoginPage lấy pkg/from từ URL; không tải ngữ cảnh server; không bảo toàn lời mời qua mọi nhánh |
| 5 / UC-AUTH-05: link Google | AUTH-01, AUTH-02 | POST /api/v1/auth/google/link-account: service hiện có | Form có; chưa tích hợp Google token/challenge được backend kiểm tra; thiếu lỗi API |
| 6 / UC-AUTH-06: email | AUTH-04 | POST /api/v1/auth/email/resend-verification: service hiện có | Có cooldown; chưa có lỗi API/thông báo thành công đầy đủ |
| 7 / UC-AUTH-07: 2FA Admin | Chính sách TOTP từ mockup, chưa chốt contract | POST /api/v1/auth/2fa/verify-totp: service hiện có | Có 6 ô và focus/paste; dùng useState, chưa dùng twoFactorSchema/RHF |
| 8 / UC-AUTH-08: logout | ROLE-04, cảnh báo DMS từ mockup | POST /api/v1/auth/logout: service hiện có | Chuyển sang logged-out trong onSettled dù API thất bại; ngày DMS hardcode |
| 9 / UC-AUTH-09: đã logout | Local UI | Không có | Card có; không được coi việc mở URL là bằng chứng hủy phiên |
| 10 / UC-AUTH-10: hết phiên | Chính sách session cần contract | POST /api/v1/auth/refresh theo contract hiện tại | Chưa có refresh service/redirect hết phiên; kế hoạch cũ ghi refresh-token khác contract |

Không coi 15 phút access-token TTL, 15 phút idle Admin và 30 phút idle người dùng là cùng một chính sách. NFR-06 trong SRS 3.14.0 đề xuất idle người dùng 30 phút, Admin 15 phút và thời hạn phiên tối đa 12 giờ; cần chốt contract và cấu hình thực thi với backend.

## 2. Phân tầng và cấu trúc thư mục

Giữ chiều `app → pages → widgets → features → entities → shared`. Không tạo lại 23 file đã tồn tại.

| Vị trí | Trách nhiệm |
| --- | --- |
| docs/srs/ | SRS mới được cung cấp; bản 3.14.0 giữ nguyên nội dung nguồn |
| docs/plans/ | Kế hoạch triển khai và kết quả đối soát theo module |
| docs/ | Hợp đồng/hướng dẫn hiện có; đang cần đối soát baseline mới |
| client/src/app/ | Providers, routing, kết nối Redux với các tầng thấp |
| client/src/pages/auth/ | Lắp ghép trang và truyền props/callback |
| client/src/features/auth/api/ | Service contract Auth |
| client/src/features/auth/model/ | Types, schemas, hooks và query keys |
| client/src/features/auth/ui/ | Layout, form, cards; không import app store |
| client/src/entities/user/ | Dữ liệu User và adapter DTO khi contract được chốt |
| client/src/shared/ | HTTP client, UI primitives, config và constants |
| scratch/ | Giữ script/artefact thử nghiệm có nội dung; đã bỏ lint-current.json tự sinh ngày 08/10/2026 |

Các import ngược tầng được phát hiện ban đầu đã được sửa: authSlice chuyển xuống `entities/user/model/`, uiSlice xuống `shared/model/`; hooks dùng React Redux trực tiếp, app chỉ lắp ghép store. `LogoutConfirmationModal` được đổi thành `LogoutConfirmationCard` đúng vai trò UI. Kết quả cấu trúc và kiểm tra mới nằm trong [đối soát toàn dự án](PROJECT-STRUCTURE-DB-REVIEW.md); bảng nghiệp vụ phía trên vẫn là backlog, chưa phải kết quả chạy backend.

`LogoutConfirmationModal` hiện render card trên một trang, không phải dialog. Chọn rõ card và đổi tên/import, hoặc dùng Dialog sẵn có với focus trap/Escape nếu dùng overlay. Không dựng thêm modal framework.

Mockup Auth hiện ở `docs/mockups/auth/`, ZIP gốc ở `docs/mockups/archives/`; giữ liên kết tương đối và nội dung tham khảo. UI kit mới thống nhất tại `docs/legacyvault-ui-kit/`, kit cũ lưu ZIP trong archive sau kiểm tra hash. Không xóa artefact scratch riêng chưa xác định nguồn sử dụng.

## 3. Ma trận tệp và nhịp thay đổi

### Dọn cấu trúc đã thực hiện sau đối soát

Theo yêu cầu tiếp theo của người dùng, bỏ qua yêu cầu Jira/checkpoint commit cho công việc dọn hiện tại:

- Đổi `ui/LogoutConfirmationModal.tsx` thành `ui/LogoutConfirmationCard.tsx`, đổi tên component/props và cập nhật page cùng public export. Component vẫn hiển thị dạng card trong trang.
- Dọn import không dùng trong LoginForm, LinkGoogleAccountCard, OtpVerificationModal, PasskeyEnrollModal, RegisterForm và RegisterPage; bỏ biến catch không dùng và tham số scaffold không dùng trong ForgotPasswordForm.
- Các thay đổi này không sửa luồng API, khóa, session hoặc quyết định nghiệp vụ. Các phát hiện phía dưới vẫn là backlog.
- Kết quả lint 14 lỗi là baseline trước dọn, không phải trạng thái sau dọn.

Nhịp tài liệu hiện tại thay đổi đúng ba tệp:

| Hành động | Tệp | Kết quả |
| --- | --- | --- |
| CREATE | docs/srs/LegacyVault-SRS-v3.14.0.md | Lưu nguyên văn nguồn mới |
| CREATE | docs/plans/FE-AUTH-SESSION-V1.md | Kế hoạch thay bản tuyên bố hoàn tất chưa đủ bằng chứng |
| MODIFY | docs/README.md | Điều hướng SRS/kế hoạch, phân biệt baseline cũ |

Các nhịp tiếp theo là dự kiến, chưa áp dụng. Mỗi hàng tối đa ba tệp; phải dừng checkpoint trước hàng tiếp theo.

| Nhịp | CREATE / MODIFY | Micro-task |
| --- | --- | --- |
| 1: constants/model | MODIFY shared/constants/index.ts, auth.types.ts, auth.schema.ts | Chốt DTO, thông số/policy, schema; ghi blueprint đủ năm mục |
| 2: HTTP | MODIFY shared/api/axiosClient.ts, shared/api/baseService.ts, shared/api/__tests__/baseService.test.ts | Thống nhất một cách trả AxiosResponse/envelope, kiểm tra callers toàn repo |
| 3: API/hooks | MODIFY authService.ts, useAuth.ts; CREATE model/__tests__/authService.test.ts | Contracts missing, authKeys, queries, invalidation; không viết thay business logic |
| 4: FSD session | MODIFY useAuth.ts, app/providers/AuthBootstrap.tsx, LogoutConfirmationModal.tsx | Bỏ import tầng trên; chốt nơi kết nối session và props |
| 5: login/invitation | MODIFY LoginForm.tsx, pages/auth/LoginPage.tsx, model/__tests__/auth.schema.test.ts | Tách preview/server state; giữ lời mời qua login; validate redirect nội bộ |
| 6: Google/email/2FA | MODIFY LinkGoogleAccountCard.tsx, VerifyEmailNotice.tsx, AdminTwoFactorCard.tsx | RHF/Zod, API errors, pending; không tự cấp quyền qua email/profile |
| 7: logout card | MOVE ui/LogoutConfirmationModal.tsx → ui/LogoutConfirmationCard.tsx; MODIFY pages/auth/LogoutConfirmationPage.tsx, features/auth/index.ts | Chỉ khi chọn giữ giao diện card; cập nhật mọi caller đã tìm kiếm |
| 8: routes | MODIFY app/routes/AppRoutes.tsx, pages/index.ts; CREATE tests route Auth | Lazy/Suspense, đích dashboard/admin, phân nhánh an toàn |
| 9: layout | MODIFY HeritageAuthLayout.tsx, LoggedOutCard.tsx, SessionExpiredCard.tsx | Token màu, a11y, reduced motion và return context |
| 10: UI tests | CREATE tests login, 2FA, logout trong feature | Kiểm tra lỗi mạng/khóa, paste/backspace, API logout thất bại |

Đường dẫn code trong bảng tính từ `client/src/features/auth/` trừ các đường dẫn ghi rõ app/pages/shared. Các bài kiểm tra mới là đề xuất, chưa tồn tại.

## 4. Phát hiện và micro-tasks ưu tiên

### P1: contract phản hồi và session

`shared/api/axiosClient.ts` trả body qua interceptor; `authService.ts` lại đọc `response.data` với generic `AuthSession`. Body raw AuthSession sẽ thành undefined; body ApiResponse sẽ hoạt động khác nhưng generic vẫn sai. BaseService cũng phụ thuộc convention này. Cần thống nhất envelope theo contract và kiểm tra transport thật; tests mock không chứng minh interceptor tương thích.

`AuthSession` yêu cầu userId/refreshToken trong JSON, User có role đơn, trong khi contract baseline ghi accessToken/expiresIn/user.roles và refresh token HttpOnly. Redux hiện chỉ giữ User; interceptor chưa gửi Bearer. Không thể tuyên bố mapping 1:1 khi chưa có DTO C# và chưa chốt chính sách cookie/Bearer.

### P1: logout báo thành công sai

`LogoutConfirmationModal.handleLogout` điều hướng trong onSettled. Nếu logout lỗi, Redux chưa clear nhưng người dùng thấy đã kết thúc phiên. Developer phải chuyển thành công/lỗi theo kết quả server; giữ người dùng ở màn xác nhận với lỗi khi thất bại. Không thay server logout bằng chỉ clear local state.

### P1: lời mời theo SRS 3.14.0

AUTH-06 yêu cầu khôi phục token/lượt qua app login/Google/register/email verification. INVITE-03 cấm công khai tên Owner/tài sản trước xác thực; bỏ yêu cầu banner công khai tên gói/người mời trong kế hoạch cũ. Context trước login chỉ trả thông tin an toàn do backend quyết định. `pkg`/`from` do URL cung cấp không phải dữ liệu được xác minh.

CLAIM-01/MATCH-07: sau xác thực tài khoản, cho vào eKYC dù email/số điện thoại khác chỉ định. Đạt eKYC chưa tạo grant; còn đối chiếu danh tính, video Executor và đồng ý nhận. AUTH-06 yêu cầu return URL an toàn: không tin redirect tùy ý và không bỏ token khi về dashboard.

### P2: khóa, form và lỗi

LoginForm giảm lượt cho mọi lỗi; local state reset khi reload. Backend là nguồn khóa/lượt/thời điểm; timer chỉ hiển thị từ deadline. Không cho rằng Google bypass là bảo đảm nếu server khóa cả tài khoản. AdminTwoFactorCard chưa dùng schema/RHF; paste ngắn có thể giữ chữ số cũ ở các ô còn lại. Login chưa điều hướng theo challenge/email pending. LinkGoogle/VerifyEmail/Logout thiếu phản hồi lỗi API đầy đủ. Passkey từ LoginPage mở modal enrollment, không phải authentication.

### P2: routing và UI

Đích mặc định `/dashboard` và `/admin` chưa được đăng ký trong AppRoutes; wildcard đưa sang 404. AppRoutes import eager qua pages barrel, chưa lazy/Suspense. DMS date và tài khoản fallback là dữ liệu mẫu; không được hiển thị như dữ liệu thật. Chưa đủ bằng chứng UI khớp mockup 100% hoặc WCAG; màu #0A281E/#FAFAF6 khác token AGENTS #0B291E/#FAF9F5. Một số labels thiếu htmlFor/id; cần kiểm tra focus và vùng chạm.

### P2: quy chuẩn scaffold

Có TODO blueprint nhưng một số submit handlers đã gọi mutation và điều hướng thực tế. Không gọi đây là scaffold thuần. Không tự xóa business logic hiện có; Developer phân định phần cần giữ/viết, AI phụ trách cấu trúc/contracts/tests theo Quy tắc 7 và 14. JSDoc hiện chưa đủ trường/param/returns/example theo client/AGENTS.md. package.json chưa có Husky/lint-staged; không thêm dependency khi chưa được phê duyệt.

## 5. Điều kiện biên và ngoại lệ

- Phân biệt 401 sai mật khẩu, challenge và hết phiên; không redirect tất cả 401 hoặc refresh lặp vô hạn.
- Refresh thất bại phải kết thúc ngữ cảnh phiên phù hợp; không lưu password/token/private key/seed vào storage. Nếu giữ return path, chỉ lưu URL nội bộ đã kiểm tra và không chứa dữ liệu nhạy cảm.
- Deadline khóa dựa server; reload/background tab không đổi chính sách; lỗi mạng/500 không giảm lượt tự đặt.
- Lời mời hết hạn/không hợp lệ có lỗi và đường quay lại; mở link không ghi phản hồi, không gia hạn lưu hoặc tạo grant.
- Email chưa xác minh theo AUTH-04 có bước tài khoản riêng; không yêu cầu liên hệ trùng chỉ định.
- OTP giữ số 0 đầu, loại input không hợp lệ, hỗ trợ paste/backspace và inline errors; pending ngăn nộp lại.
- Logout mọi thiết bị chỉ báo hoàn tất sau server xác nhận; lỗi giữ khả năng thử lại. DMS cần loading/error/empty/success nếu tải lịch thật.
- AUTH-03: thêm/bỏ phương thức phải reauthenticate, không bỏ phương thức cuối. AUTH-05: Google profile/recovery không đổi designation/hold/grant/danh tính.

## 6. DoD và bằng chứng

Chạy từ `client/`:

```powershell
npm run type-check
npm run lint
npm run test:run
npm run build
```

Không dùng `npm run build -- --noEmit`: script build chạy cả tsc và vite, không phải lệnh noEmit chuyên dụng. Dùng type-check theo package.json hiện có; tsc -b có thể tạo metadata build.

Kết quả ngày 08/10/2026 trước sửa tài liệu:

| Check | Kết quả |
| --- | --- |
| npm run type-check | PASS, exit 0 |
| npm run lint | FAIL: 116 errors, 5 warnings |
| Lint auth + pages/auth + AppRoutes + axiosClient | FAIL: 14 errors, 0 warnings; chủ yếu unused imports/variables |
| npm run test:run ngoài sandbox sau retry ENOENT | 9 suites pass, 2 fail; 58 tests pass, 2 fail |
| Tests fail | claim.schema.test.ts: valid executor claim; notary.schema.test.ts: valid approve |
| Build production / manual UI / backend | Chưa chạy |

Auth schema suite hiện chỉ test login/register/otp; chưa test linkGoogleSchema/twoFactorSchema, service/interceptor, logout hoặc lời mời. Không suy ra tính đúng của luồng mới từ tests hiện có.

Manual scenarios phải kiểm tra và lưu bằng chứng riêng:

1. Login thành công tới route có thật; invalid credentials hiển thị lượt từ server; network/500 không giảm lượt.
2. Khóa theo server sau reload; deadline hết thì UI cập nhật theo trạng thái server; Google theo chính sách đã chốt.
3. AC-02/AC-03: token Google sai/hết hạn bị từ chối; email trùng chưa link phải xác thực tài khoản app.
4. AC-12: token lời mời được giữ qua app/Google/register; chưa login không lộ Owner/tài sản; click không ghi nhận phản hồi.
5. AC-13/AC-14: account contact khác chỉ định vẫn vào eKYC sau xác minh tài khoản cần thiết; chưa có grant.
6. OTP có số 0 đầu, paste ngắn/đủ, backspace, error và pending; chưa có challenge thì không cấp session Admin.
7. Logout thành công, thất bại và revoke-all; lỗi không xuất hiện thông báo phiên đã kết thúc; cảnh báo DMS không dùng ngày mẫu.
8. Refresh thành công/thất bại; sai mật khẩu 401 không bị coi là session expired; return URL ngoài bị chặn.
9. Tab/Shift+Tab/Escape theo dạng card/dialog, labels, mobile layout, reduced motion; screenshot đối chiếu mockup.
10. AC-86: thêm/bỏ phương thức và recovery không cấp quyền nghiệp vụ hoặc bỏ phương thức cuối.

Git hiện nằm ở `client/.git`; docs cấp workspace nằm ngoài repository đó. Người dùng đã yêu cầu bỏ qua việc Jira/checkpoint để tiếp tục dọn cấu trúc; chưa commit/push. Không init repo mới, không force-add bản docs thứ hai vào client, không stage các thay đổi sẵn có. Jira key chưa có, không dùng mã ví dụ LV-102 làm mã thật.
