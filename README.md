# LegacyVault client

React 19, TypeScript, Vite, Tailwind CSS, Base UI, Redux Toolkit, TanStack Query, React Hook Form và Zod. Dùng dependency đã có trong package.json.

## Chạy local

```powershell
npm install
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
npm run dev
```

VITE_API_BASE_URL mặc định mẫu: http://localhost:5000/api/v1. Biến VITE_* là cấu hình công khai trong bundle; khóa R2, SMTP, FPT và LiveKit secret thuộc backend. Workspace chưa có backend C#.

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
docs/           tài liệu tích hợp được chọn để bàn giao cùng source
legacy/         snapshot wizard cũ chỉ giữ local, không tham gia build
```

Chiều import: app → pages → widgets → features → entities → shared. Cấm import chéo feature. App lắp ghép store; tầng thấp không import app. Kiểm tra kiến trúc dùng TypeScript AST cho alias, relative và dynamic imports.

## Kiểm tra

```powershell
npm run check:architecture
npm run type-check
npm run lint
npm run test:run
npm run build
```

lint chỉ kiểm tra; lint:fix sửa lỗi có thể tự sửa. format:check kiểm tra định dạng, format ghi lại định dạng, preview xem bản build.

[Tài liệu tích hợp](docs/README.md) được đóng gói cùng repository. SQL Auth, archive và prototype gốc thuộc workspace ngoài repo Frontend. Một số feature còn mock/scaffold hoặc nghiệp vụ baseline cũ; build pass chưa chứng minh phù hợp toàn bộ SRS 3.14.0.

[Yêu cầu FE → BE](docs/FE_BE_INTEGRATION_REQUEST.md) là tài liệu bàn giao tích hợp. Bộ UI kit tham khảo, baseline cũ và `legacy/` không được đóng gói trong phần source hiện hành.
