# LegacyVault Frontend

Ứng dụng frontend của **LegacyVault**, thuộc dự án **SWP391**. Giao diện hỗ trợ quản lý kho di sản số, gói bàn giao, tài sản, người nhận và các luồng xác thực liên quan.

Dự án sử dụng React và TypeScript, tổ chức theo **Feature-Sliced Design (FSD)**. Các module tách riêng giao diện, dữ liệu và thao tác API; ưu tiên tái sử dụng thành phần có sẵn và giữ chiều phụ thuộc rõ ràng.

## Công nghệ

| Thành phần      | Công nghệ                                            |
| --------------- | ---------------------------------------------------- |
| Giao diện       | React 19, TypeScript, Vite                           |
| Styling         | Tailwind CSS v4, shadcn/ui với Base UI Nova preset   |
| Biểu tượng      | Lucide React                                         |
| Server state    | TanStack Query v5, React Query Devtools              |
| Client state    | Redux Toolkit                                        |
| Biểu mẫu        | React Hook Form, Zod                                 |
| HTTP            | Axios; `createBaseService` cho CRUD phù hợp contract |
| Điều hướng      | React Router v7                                      |
| Kiểm thử        | Vitest, React Testing Library, JSDOM                 |
| Chất lượng code | ESLint, Prettier, kiểm tra kiến trúc FSD             |
| Git hooks       | Husky, lint-staged                                   |

Danh sách dependency và scripts được quản lý trong [package.json](package.json); phiên bản cài đặt được khóa bằng [package-lock.json](package-lock.json).

## Yêu cầu môi trường

- **Node.js 22.12 trở lên**; CI hiện sử dụng Node.js 22.
- **npm** và **Git**.
- Để chạy tích hợp: Backend ASP.NET Core, .NET SDK theo `Backend/global.json`, SQL Server development và migrations tương ứng.

Frontend nằm trong thư mục `client`; [Backend chính thức](https://github.com/FPT-SWP391-SE2040-GROUP02/Backend) được đặt cạnh frontend khi làm việc trong workspace:

```text
SWP391/
├── client/     # Repository frontend
├── Backend/    # Repository backend chính thức
└── docs/       # Hướng dẫn, profile và kế hoạch của workspace
```

Frontend không phụ thuộc thư mục backend mẫu `test` để chạy hoặc build.

## Cài đặt và chạy local

Các lệnh dưới đây sử dụng **PowerShell**.

### 1. Cài dependencies

Mở terminal tại thư mục `client`:

```powershell
npm ci
```

`npm ci` cài theo lockfile. Repository đã cấu hình npm trong [.npmrc](.npmrc); giữ file này và lockfile khi bàn giao source.

### 2. Cấu hình môi trường

Tạo `.env` nếu chưa có:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item .env.example .env
}
```

Cấu hình API:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Giá trị mặc định phải bao gồm **`/api/v1`**. Service sử dụng route tương đối, ví dụ `/auth/login` hoặc `/vaults/me`.

Mọi biến `VITE_*` là cấu hình công khai và có thể xuất hiện trong bundle. Credentials R2, SMTP, LiveKit API secret và JWT signing key thuộc Backend; không đưa vào frontend hoặc commit `.env`. Khởi động lại Vite sau khi đổi cấu hình môi trường.

### 3. Khởi chạy Backend

Chuẩn bị SQL Server, cấu hình development và áp dụng migrations theo hướng dẫn Backend. API không tự migrate khi khởi động; .NET cũng không tự nạp file `.env`.

Trong terminal riêng tại `Backend`:

```powershell
dotnet restore LegacyVault.sln
dotnet run --project src/LegacyVault.Api --launch-profile http
```

Backend cần cho phép CORS origin của Vite. Dùng nhất quán `localhost` hoặc `127.0.0.1` khi kiểm tra luồng refresh cookie.

### 4. Khởi chạy Frontend

Tại `client`:

```powershell
npm run dev
```

Mở URL Vite hiển thị trong terminal, thông thường là `http://localhost:5173`. Nếu cổng thay đổi, cập nhật CORS phía Backend tương ứng.

## Cấu trúc và quy ước kiến trúc

```text
src/
├── app/          # Entry point, providers, routes, store và styles
├── pages/        # Lắp ghép các màn hình, lazy loading
├── widgets/      # Các khối giao diện kết hợp nhiều features
├── features/     # Chức năng: api/, model/, ui/, lib/ khi cần
├── entities/     # DTO, schemas, adapters và state của thực thể
└── shared/
    ├── api/      # Axios, transport và createBaseService
    ├── config/   # Cấu hình môi trường, routes và preview
    ├── constants/
    ├── lib/
    ├── types/
    └── ui/       # Thành phần giao diện dùng chung

scripts/          # Kiểm tra đồ thị import FSD
.github/workflows/ # Quality gates trên CI
.husky/           # Git hooks
```

Chiều import được kiểm soát:

```text
app → pages → widgets → features → entities → shared
```

- Tầng thấp không import tầng cao; không import chéo giữa các feature.
- Pages và widgets lắp ghép luồng; feature sở hữu form, actions và API của chức năng.
- DTO giữ nguyên tên trường trên wire; runtime validation tại service boundary. Mapping DTO sang ViewModel đặt cùng thực thể tương ứng.
- Server state dùng TanStack Query; form state dùng React Hook Form/Zod; filters và pagination dùng URL; state dùng chung phía client dùng Redux.
- Axios trả nguyên HTTP body. Service xử lý đúng response của từng endpoint; không giả định mọi API đều có envelope `data`.
- `createBaseService` dành cho CRUD khớp contract; auth, multipart và endpoint đặc thù dùng service riêng.

Lệnh kiểm tra FSD phân tích imports alias, relative và dynamic bằng TypeScript AST.

## Trạng thái tích hợp

| Phạm vi                        | Trạng thái hiện tại                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Auth cốt lõi                   | Login, restore sau reload, logout và logout mọi thiết bị đã nối Backend                          |
| Xác minh email                 | Submit thủ công, xử lý token lỗi, gỡ token URL sau thành công và xin liên kết mới                |
| Kho và gói                     | Màn tổng quan đọc dữ liệu thật; service dùng containers, PUT kèm `etag` và DELETE lưu trữ        |
| Tài sản, người nhận, điểm danh | Có schema/service và các khối đọc dữ liệu thật trên tổng quan; submit nghiệp vụ còn scaffold     |
| eKYC                           | Màn thật đọc trạng thái Backend; contract gửi document/selfie đã có, submit UI còn scaffold      |
| Google                         | Service/schema và form link-confirm đã có; bước lấy ID token và nối luồng đăng nhập còn scaffold |
| Các module khác                | Billing, claims, verifier và handover cần tiếp tục đối soát contract và triển khai               |

Access token chỉ giữ trong **RAM**; refresh token nằm trong cookie **HttpOnly**. Các POST auth thay đổi refresh cookie sử dụng CSRF proof. Response xác minh email không tự tạo phiên đăng nhập.

Các route `/preview/*` chỉ được đăng ký trong Development và dùng dữ liệu minh họa. Kết quả build hoặc tests không tự chứng minh các luồng scaffold đã hoạt động đầy đủ với Backend.

## Scripts

| Lệnh                         | Mục đích                                        |
| ---------------------------- | ----------------------------------------------- |
| `npm run dev`                | Chạy Vite với HMR                               |
| `npm run type-check`         | Kiểm tra TypeScript                             |
| `npm run lint`               | Kiểm tra ESLint                                 |
| `npm run lint:fix`           | Sửa lỗi ESLint có thể tự động sửa               |
| `npm run check:architecture` | Kiểm tra chiều import FSD                       |
| `npm run format:check`       | Kiểm tra định dạng Prettier                     |
| `npm run format`             | Định dạng lại code và tài liệu                  |
| `npm run test`               | Chạy Vitest ở chế độ watch                      |
| `npm run test:run`           | Chạy tests một lần                              |
| `npm run build`              | Kiểm tra TypeScript và tạo bundle trong `dist/` |
| `npm run preview`            | Phục vụ bản build để kiểm tra local             |

Chạy quality gates trước khi bàn giao thay đổi code:

```powershell
npm run type-check
npm run lint
npm run check:architecture
npm run format:check
npm run test:run
npm run build
```

Pre-commit chạy type-check và lint-staged. [CI](.github/workflows/ci.yml) chạy bộ gates đầy đủ trên pull requests và các push tới `develop`/`main`; hooks local không thay thế CI.

## Hướng dẫn đóng góp và tài liệu

Đọc [AGENTS.md](AGENTS.md) trước khi thay đổi code. Khi sửa API integration, đối chiếu controller/DTO trong Backend và quyết định contract của nhóm; cập nhật service, schema, tests và tài liệu liên quan cùng thay đổi.

Tài liệu dưới đây nằm **ngoài repository frontend**, trong workspace. Khi bàn giao riêng `client`, gửi kèm các tài liệu cần thiết:

- [Profile LegacyVault](../docs/LEGACYVAULT_PROFILE.md): kiến trúc, bảo mật, vai trò AI và quality gates.
- [Chỉ mục tài liệu](../docs/README.md): yêu cầu và hướng dẫn tích hợp.
- [Đồng bộ FE với Backend](../docs/plans/FE-OFFICIAL-BACKEND.md): phạm vi, bảng trước/sau và kết quả kiểm tra.
- [Luồng xác minh email](../docs/plans/FE-EMAIL-VERIFICATION.md): contract, các trường hợp lỗi và bằng chứng kiểm thử.

Không đưa `.env`, `node_modules/`, `dist/`, cache, screenshots kiểm thử hoặc snapshots legacy vào commit.
