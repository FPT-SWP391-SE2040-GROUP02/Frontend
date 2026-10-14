# LegacyVault client

React 19, TypeScript, Vite, Tailwind CSS, Base UI, Redux Toolkit, TanStack Query, React Hook Form và Zod. Dùng dependency đã có trong package.json.

## Chạy local

```powershell
npm install
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
npm run dev
```

VITE_API_BASE_URL: http://localhost:5000/api/v1, trỏ tới repository Backend chính thức bên cạnh client. Biến VITE_* là cấu hình công khai trong bundle; khóa R2, SMTP và LiveKit secret thuộc backend.

Chạy API trong terminal riêng tại `../Backend`:

```powershell
dotnet restore LegacyVault.sln
dotnet run --project src/LegacyVault.Api --launch-profile http
```

Thiết lập SQL Server và cấu hình theo README/CONTRIBUTING của Backend trước khi chạy. File `.env` không được .NET tự động nạp. Backend phải cho phép CORS origin của Vite; dùng nhất quán `localhost` hoặc `127.0.0.1` khi kiểm tra cookie.

Frontend chạy/build không phụ thuộc thư mục `../test`; thư mục đó chỉ là bản mẫu lịch sử. Contract hiện hành lấy từ controller/DTO trong `../Backend`, không lấy từ bản mẫu hoặc các đề xuất API cũ.

Auth sử dụng access token trong RAM và refresh cookie HttpOnly, các POST auth thay cookie lấy CSRF proof. Kho/gói dùng raw DTO, `/vaults/{vaultId}/containers`, PUT kèm `etag` và DELETE lưu trữ gói. Màn tổng quan đọc kho, containers, metadata tài sản, hồ sơ người nhận và điểm danh từ Backend; số liệu mẫu chỉ hiện ở `/preview/owner` trong Development. Màn eKYC thật đọc `/ekyc/me`; query URL không cấp trạng thái PASSED. Services assets/beneficiaries/check-ins/eKYC có runtime validation; submit nghiệp vụ mới, Google acquisition và verify-email submit vẫn scaffold theo profile. Các màn preview cũ không được coi là dữ liệu thật.

## Cấu trúc

```text
src/
  app/          entry, providers, routes, store assembly, styles
  pages/        lắp ghép trang, lazy loading
  widgets/      Header, WillWizard và các khối ghép feature
  features/     api, model, ui theo tính năng
  entities/     dữ liệu user/claim, authSlice
  shared/       API, config, constants, UI, uiSlice
scripts/        kiểm tra đồ thị import FSD
../docs/        tài liệu dự án và bàn giao tích hợp, nằm ngoài client
legacy/         snapshot wizard cũ chỉ giữ local, không tham gia build
```

Chiều import: app → pages → widgets → features → entities → shared. Cấm import chéo feature. App lắp ghép store; tầng thấp không import app. Kiểm tra kiến trúc dùng TypeScript AST cho alias, relative và dynamic imports.

## Kiểm tra

```powershell
npm run check:architecture
npm run type-check
npm run lint
npm run test:run
npm run format:check
npm run build
```

lint chỉ kiểm tra; lint:fix sửa lỗi có thể tự sửa. format:check kiểm tra định dạng, format ghi lại định dạng, preview xem bản build.

[Tài liệu tích hợp](../docs/README.md) nằm tại thư mục docs của workspace, ngoài repository client. Khi bàn giao riêng source FE, gửi kèm tài liệu cần thiết từ thư mục đó. Một số feature còn mock/scaffold hoặc nghiệp vụ baseline cũ; build pass chưa chứng minh phù hợp toàn bộ SRS 3.14.0.

[Bàn giao API theo feature](../docs/BE-FEATURE-API-HANDOFF.md) là checklist mới cho nhóm BE; [Yêu cầu FE → BE](../docs/FE_BE_INTEGRATION_REQUEST.md) giữ các yêu cầu đối soát chi tiết trước đó. Bộ UI kit tham khảo, baseline cũ và `legacy/` không được đóng gói trong phần source hiện hành.
