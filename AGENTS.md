# Quy Tắc Kiến Trúc & Phát Triển Chuẩn SWP391

Tài liệu này là kim chỉ nam tối thượng cho tất cả các thành viên phát triển và AI Assistant khi viết code cho dự án SWP391.

---

## 1. Kiến Trúc Tổng Thể: Feature-Sliced Design (FSD)

Cấu trúc thư mục `client/src/` được phân tầng rõ ràng theo chiều từ trên xuống dưới. **Quy tắc phụ thuộc 1 chiều: Tầng dưới TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP import từ các tầng trên nó.**

```
client/src/
├── app/        # Tầng cao nhất: Khởi tạo Global Providers (React Query, Router, Redux), ErrorBoundary, CSS gốc.
├── pages/      # Chứa các màn hình hoàn chỉnh (LoginPage, DashboardPage). Chỉ lắp ghép Widgets & Features.
├── widgets/    # Khối giao diện lớn độc lập (Header, Sidebar, UserTable).
├── features/   # Logic nghiệp vụ theo từng tính năng riêng biệt (auth, products, orders).
│   ├── api/    # Dịch vụ gọi API của feature (sử dụng createBaseService).
│   ├── model/  # Zod schema, types, Custom React Query Hooks (useQuery, useMutation).
│   └── ui/     # Giao diện nội bộ của feature (LoginForm, ProductFilter).
├── entities/   # Thực thể cốt lõi toàn cục (User, Product, Order).
└── shared/     # Tầng thấp nhất: Thành phần tái sử dụng toàn ứng dụng:
    ├── api/    # axiosClient, createBaseService, queryKeys helper.
    ├── config/ # env.ts, constants.
    ├── types/  # PaginatedList, PaginationParams, SelectOption, ApiResponse.
    └── ui/     # Toàn bộ Shadcn UI components (Button, Input, Card, Dialog...).
```

### Chiều Import Được Phép (Top-to-Bottom):
- `app` -> `pages`, `widgets`, `features`, `entities`, `shared`
- `pages` -> `widgets`, `features`, `entities`, `shared`
- `widgets` -> `features`, `entities`, `shared`
- `features` -> `entities`, `shared` *(TUYỆT ĐỐI KHÔNG import chéo giữa các feature)*
- `entities` -> `shared`
- `shared` -> chỉ import từ thư viện bên ngoài (external packages).

---

## 2. Nguyên Tắc Kỹ Thuật Cốt Lõi (SOLID & DRY)

### 🔹 DRY (Don't Repeat Yourself)
- Không lặp lại logic gọi API. Mọi entity/feature CRUD đều dùng **`createBaseService`** từ `shared/api/baseService.ts`.
- Tái sử dụng triệt để các UI components từ `@/shared/ui` thay vì tự viết lại thẻ HTML/CSS từ đầu.

### 🔹 Single Responsibility Principle (Trách Nhiệm Đơn Duy Nhất)
- **UI Components (`.tsx`)**: Chỉ phụ trách hiển thị dữ liệu và nhận tương tác, không chứa logic gọi API trực tiếp.
- **Zod Schema (`*.schema.ts`)**: Đảm nhận 100% việc validate dữ liệu, định nghĩa thông báo lỗi của form.
- **React Query Hooks (`useQuery`, `useMutation`)**: Đảm nhận việc giao tiếp với Server State, cache và invalidation.
- **Redux / Zustand**: Quản lý Client State (Auth token, user profile, theme, trạng thái sidebar).

### 🔹 Tuyệt Đối Không Hardcode (Zero Hardcoding Rule)
- **URL / Endpoint**: Đặt trong `.env` và truy xuất qua `shared/config/env.ts` (`ENV.API_BASE_URL`).
- **Mã HTTP Status**: Sử dụng hằng số `HTTP_STATUS` từ `@/shared/constants` (`HTTP_STATUS.OK`, `HTTP_STATUS.UNAUTHORIZED`, `HTTP_STATUS.NOT_FOUND`...).
- **Trạng thái Thực thể (Entity Status)**: Sử dụng hằng số `STATUS` từ `@/shared/constants` (`STATUS.ACTIVE`, `STATUS.PENDING`...) và validate bằng `statusSchema` từ `@/shared/schemas`.
- **Thông điệp hệ thống (Messages)**: Sử dụng `APP_MESSAGES` từ `@/shared/constants` (`APP_MESSAGES.SUCCESS.CREATE`, `APP_MESSAGES.ERROR.NETWORK`, `APP_MESSAGES.VALIDATION.REQUIRED("Tên")`...).
- **Cấm kỵ**: Tuyệt đối không gõ magic numbers `401`, `403` hay magic strings `"Thành công"`, `"Vui lòng nhập email"` trực tiếp trong component hoặc API calls.

---

## 3. Tương Thích Chuẩn C# ASP.NET Core Backend

Mọi API Service và Hook phải tuân theo cấu trúc DTO chuẩn từ Backend C#:
1. **Phân trang (`PaginatedList<T>`)**:
   ```ts
   export interface PaginatedList<T> {
     items: T[];
     totalCount: number;
     pageIndex: number;
     pageSize: number;
     totalPages: number;
     hasPreviousPage: boolean;
     hasNextPage: boolean;
   }
   ```
2. **Tham số tìm kiếm (`PaginationParams`)**: `pageIndex`, `pageSize`, `searchTerm`, `sortColumn`, `sortOrder`.
3. **Dropdown Options (`SelectOption`)**: `label`, `value`, `disabled?` kết hợp với endpoint `/select-options`.

---

## 4. Quy Chuẩn Luồng Dữ Liệu (4 Bước Khi Tạo Feature Mới)

Khi phát triển một tính năng mới (Ví dụ: `Product Management`), luôn tuân theo thứ tự:
1. **Bước 1 (Entities & Types)**: Định nghĩa Entity Types và Zod Schema trong `entities/product/model/` hoặc `features/products/model/`.
2. **Bước 2 (API Service)**: Tạo service bằng `createBaseService({ endpoint: "/products" })`.
3. **Bước 3 (React Query Hooks)**: Định nghĩa `productKeys` và các custom hooks (`useProducts`, `useProductDetail`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`) kèm cache invalidation.
4. **Bước 4 (Lắp ráp UI)**: Sử dụng `react-hook-form` + `@hookform/resolvers/zod` + `@/shared/ui/` components.

---

## 5. Tiêu Chuẩn Thiết Kế Giao Diện (UI/UX Pro Max)

- **Trải nghiệm người dùng**: Phối màu có độ tương phản tối thiểu đạt chuẩn WCAG 2.1 AA (4.5:1 cho text thông thường).
- **Trạng thái đầy đủ (State Coverage)**: Mọi màn hình tải dữ liệu đều phải xử lý đủ 4 trạng thái:
  1. `isLoading`: Hiển thị `Skeleton` hoặc Spinner thanh lịch.
  2. `isError`: Hiển thị thông báo lỗi thân thiện + nút "Thử lại".
  3. `isEmpty`: Hiển thị Empty State có icon và hướng dẫn hành động.
  4. `isSuccess`: Hiển thị dữ liệu hoàn chỉnh.
- **Micro-interactions**: Hover effects, smooth transitions với Tailwind CSS v4.

---

## 6. Quy Chuẩn Đặt Tên & Git Commit

### Đặt tên file:
- React Component: `PascalCase.tsx` (`ProductCard.tsx`, `LoginForm.tsx`)
- Hook: `useCamelCase.ts` (`useProducts.ts`, `useAuth.ts`)
- Service: `camelCaseService.ts` (`productService.ts`)
- Schema: `*.schema.ts` (`product.schema.ts`)
- Type/Interface: `*.types.ts` (`product.types.ts`)
- Hằng số: `UPPER_SNAKE_CASE` (`DEFAULT_PAGE_SIZE = 10`)

### Git Commit (Conventional Commits):
- `feat:` Thêm tính năng mới.
- `fix:` Sửa lỗi bug.
- `refactor:` Tái cấu trúc code (không đổi logic/tính năng).
- `style:` Chỉnh sửa format, CSS, khoảng trắng.
- `test:` Viết thêm kiểm thử.
- `docs:` Viết hoặc sửa tài liệu.
- `chore:` Cập nhật cấu hình build, dependencies.

### Quy Tắc Phân Nhánh Git (Gitflow Branching Strategy):
- **Tuyệt đối không commit trực tiếp code đang làm dở lên nhánh `main` hoặc `develop`**.
- **Nhánh `main`**: Luôn ở trạng thái ổn định tuyệt đối (Production-ready), build pass và test pass 100%. Chỉ nhận merge từ `develop` hoặc `hotfix/*`.
- **Nhánh `develop`**: Nhánh tích hợp trung tâm (Integration Branch). Mọi nhánh tính năng `feat/*` đều rẽ nhánh từ `develop` và merge trở lại vào `develop` qua Pull Request.
- **Cú pháp đặt tên nhánh**:
  - `feat/<feature-name>`: Nhánh phát triển tính năng mới rẽ từ `develop` (ví dụ: `feat/dms-pulse-heartbeat`, `feat/asset-management`, `feat/auth-rbac-guard`).
  - `fix/<bug-name>`: Nhánh sửa lỗi rẽ từ `develop` (ví dụ: `fix/login-validation-error`, `fix/sidebar-collapse`).
  - `hotfix/<bug-name>`: Nhánh sửa lỗi khẩn cấp rẽ trực tiếp từ `main`.
  - `refactor/<task-name>`: Nhánh tái cấu trúc mã nguồn (ví dụ: `refactor/api-services`).
- **Quy trình làm việc chuẩn cho từng tính năng**:
  1. Kéo code mới nhất từ nhánh `develop`: `git checkout develop && git pull origin develop`
  2. Tạo nhánh làm việc riêng: `git checkout -b feat/<ten-tinh-nang>`
  3. Lập trình và commit theo chuẩn Conventional Commits
  4. Kiểm tra chất lượng trước khi đẩy code: `npm run type-check` và `npm run test:run`
  5. Đẩy nhánh lên GitHub: `git push -u origin feat/<ten-tinh-nang>`
  6. Mở Pull Request (PR) merge vào nhánh `develop` để các thành viên khác review.
  7. Khi hoàn tất sprint/milestone, merge `develop` vào `main`.

---

## 7. QUY TẮC BẮT BUỘC: KHÔNG CODE SẴN - BẮT BUỘC TỰ CODE & ĐÁNH DẤU `// TODO`

Nhằm đảm bảo tính chủ động và nâng cao năng lực code thực tế của thành viên, **AI Assistant và Code Generator TUYỆT ĐỐI KHÔNG VIẾT SẴN TRỌN GÓI TOÀN BỘ LOGIC NGHIỆP VỤ**:

1. **Chỉ dựng khung cấu trúc (Scaffold / Skeleton)**:
   - Được phép tạo: Khung file, cấu trúc thư mục chuẩn FSD, định nghĩa kiểu dữ liệu (Types, Interfaces, DTOs), chữ ký hàm (Function Signatures), khai báo Zod Schema, Props của Component.
2. **Không làm sẵn logic nghiệp vụ cốt lõi**:
   - Thân hàm tính toán, thuật toán, xử lý form submit, handler logic, transform dữ liệu, logic phân quyền... **PHẢI để trống cho Developer tự viết**.
3. **Bắt buộc đánh dấu `// TODO:` rõ ràng và chi tiết**:
   - Tại mọi vị trí cần viết logic, bắt buộc đặt comment `// TODO: [Mô tả chi tiết]` hướng dẫn cụ thể:
     - Mục tiêu logic cần xử lý là gì.
     - Dữ liệu đầu vào (inputs) và kết quả kỳ vọng (outputs).
     - Các trường hợp đặc biệt / điều kiện biên (edge cases, validation rules).
   - **Ví dụ chuẩn**:
     ```ts
     /**
      * Xử lý đăng nhập tài khoản người dùng
      * @param credentials Thông tin đăng nhập gồm email và password
      * @returns Promise chứa thông tin auth session hoặc throw error
      */
     export async function handleLogin(credentials: LoginInput): Promise<AuthSession> {
       // TODO: 1. Validate dữ liệu đầu vào bằng loginSchema
       // TODO: 2. Gọi API đăng nhập qua authService.login(credentials)
       // TODO: 3. Lưu JWT token vào localStorage/Cookie an toàn
       // TODO: 4. Cập nhật state người dùng vào AuthContext/Redux store
       // TODO: 5. Điều hướng người dùng về trang Dashboard hoặc Redirect URL
       throw new Error("Chưa cài đặt handleLogin - Vui lòng tự hoàn thiện code logic tại đây.");
     }
     ```

---

## 8. QUY TẮC BẮT BUỘC: VIẾT JSDOC CHUẨN CHỈNH CHO TOÀN BỘ DỰ ÁN

Mọi đoạn mã trong dự án (functions, React components, custom hooks, API services, Zod schemas, type definitions, constants) **BẮT BUỘC PHẢI CÓ JSDoc / TSDoc ĐẦY ĐỦ**:

1. **Cấu trúc chuẩn của một khối JSDoc**:
   - `@description`: Mô tả rõ ràng chức năng, vai trò và phạm vi hoạt động của thành phần.
   - `@param {Type} paramName`: Mô tả ý nghĩa của từng tham số truyền vào (đối với function/hook/component props).
   - `@returns {Type}`: Mô tả chi tiết kiểu dữ liệu và ý nghĩa giá trị trả về.
   - `@throws {ErrorType}`: Khai báo rõ ràng các lỗi hoặc ngoại lệ có thể xảy ra (nếu có).
   - `@example`: Cung cấp ít nhất một ví dụ minh họa cách sử dụng thực tế.
2. **Áp dụng cho**:
   - **Functions / Methods**: Bắt buộc giải thích mục đích, tham số, giá trị trả về.
   - **Custom Hooks**: Giải thích logic hook, params nhận vào, state và các helpers trả ra.
   - **React Components**: Mô tả mục đích component, giải thích các props quan trọng.
   - **Zod Schemas**: Chú thích ý nghĩa validation của từng schema.
   - **Types & Interfaces**: Chú thích rõ ràng ý nghĩa của từng trường dữ liệu (fields).
   - **Constants**: Giải thích mục đích sử dụng hằng số.

---

## 9. DESIGN PATTERNS ÁP DỤNG TRONG DỰ ÁN (PRAGMATIC & LIGHTWEIGHT)

Nhằm đảm bảo code dễ mở rộng (Open/Closed Principle) và phục vụ phản biện đồ án, dự án thống nhất áp dụng 3 Design Patterns đơn giản sau:

### 🔹 Pattern 1: Strategy Pattern (Xử lý các loại tài sản số)
- **Vị trí**: `features/assets/model/strategies/`
- **Quy tắc**: Tuyệt đối không dùng `switch (assetType)` lồng nhau trong UI.
- **Cấu trúc**:
  - Định nghĩa interface `AssetStrategy`:
    `interface AssetStrategy { validate(data: unknown): boolean; preparePayload(data: unknown): EncryptedPayload; renderFormFields(): ReactNode; }`
  - Triển khai riêng biệt: `CryptoStrategy`, `CredentialStrategy`, `DocumentStrategy`.
  - Gọi qua Map/Registry: `assetStrategyMap[assetType]`.

### 🔹 Pattern 2: Adapter Pattern (Chuyển đổi Backend DTO <-> UI ViewModel)
- **Vị trí**: `entities/*/lib/adapters.ts` hoặc `features/*/lib/adapters.ts`
- **Quy tắc**: Component UI không nhận trực tiếp Raw DTO nếu DTO đó chưa được chuẩn hóa cho việc hiển thị.
- **Hàm quy chuẩn**:
  - `toViewModel(dto: EntityDto): EntityViewModel`
  - `toCreatePayload(form: EntityFormValues): CreateEntityRequest`

### 🔹 Pattern 3: State Machine / State Pattern (Vòng đời Kho lưu trữ)
- **Vị trí**: `entities/vault/model/vaultState.ts`
- **Quy tắc**: Quản lý vòng đời kho qua ma trận chuyển đổi hợp lệ `VAULT_TRANSITIONS`:
  - `ACTIVE` -> chỉ được sang `GRACE_PERIOD`
  - `GRACE_PERIOD` -> được sang `ACTIVE` (nếu ping lại) hoặc `AWAITING_LEGAL_PROOF`
  - `APPROVED` -> chỉ được sang `CLOSED`
- Hàm kiểm tra: `canTransition(currentStatus, targetStatus): boolean`.

---

## 10. QUY TẮC BẮT BUỘC: TUÂN THỦ 100% MASTER UI KIT & BỐ CỤC DESIGN SYSTEM

Mọi màn hình, widget, layout và component trong dự án **BẮT BUỘC PHẢI TUÂN THỦ CHÍNH XÁC 100% THEO MASTER UI KIT & DESIGN SYSTEM CỦA DỰ ÁN** (dựa trên bộ quy chuẩn giao diện LegacyVault):

### 🔹 1. Bảng màu chuẩn mực (Heritage Forest & Champagne Gold)
- **Nền & Bề mặt**: Canvas `--bg-canvas` (`#EFECE6`), Surface `--surface` (`#FAF9F5`).
- **Màu chủ đạo (Primary)**: `--primary` (`#0B291E`), Hover `--primary-hover` (`#133E2F`), Light `--primary-light` (`#E5EDE8`), Surface `--primary-surface` (`#10382B`).
- **Màu điểm xuyết (Accent Gold)**: `--gold` (`#B88E4C`), Hover `--gold-hover` (`#A07839`), Light `--gold-light` (`#FBF7EE`), Border `--gold-border` (`#E8DCC6`).
- **Chữ & Viền**: Text chính `--text-main` (`#14241C`), Text phụ `--text-muted` (`#66786E`), Viền `--border-ui` (`#DCD9D0`).
- **Đổ bóng xúc giác (Tactile Shadows)**: `--shadow-raised`, `--shadow-inset`, `--shadow-pressed`.

### 🔹 2. Typography & Radius Tokens
- **Font chữ**: `'Plus Jakarta Sans', -apple-system, sans-serif`.
- **Bo góc (Radius Scale)**: 4px (micro), 8px (inputs/tags), 12px (cards), 16px (sections), 20px (pill buttons), 24px (hero/modals).

### 🔹 3. Quy chuẩn Điều khiển & Tương tác (Controls)
- **Buttons**: Dạng bo tròn `rounded-[20px]`, font weight 550, shadow tinh tế. Trạng thái `btn-primary`, `btn-pressed` (active inset), `btn-disabled`.
- **Inputs**: Nền `#FAF9F5`, viền `#D5D0C3`, focus viền vàng `#B88E4C` kèm ring mờ, error viền đỏ `#D9534F`.
- **Checkbox & Radio**: Thiết kế tùy biến chuẩn UI Kit (Checkbox vuông viền `#A8A295`, check nền `#0B291E` icon trắng; Radio tròn điểm tâm `#0B291E`).
- **Navigation**: Tabs dạng viên thuốc (`pill-tabs`), Breadcrumb thẻ (`breadcrumb-pill`), Stepper tiến trình pháp lý 4 bước (`stepper-wrap`).

### 🔹 4. Bộ 5 Thành Phần Nghiệp Vụ Đặc Thù (Domain-Specific Protocol Components)
Khi phát triển các module tương ứng, **bắt buộc sử dụng đúng mẫu component từ UI Kit**:
1. **Masked Private Key & 12-Word Seed Phrase Grid**: Khung che dấu mật mã có nút Toggle/Copy + Lưới 12 từ khôi phục 3 cột.
2. **Live Dead Man's Switch Heartbeat Card**: Thẻ trạng thái DMS có điểm phát xung nhịp (`pulse-dot` animation xanh `#059669`), đồng hồ đếm ngược, nút `⚡ I'm Alive` + Thẻ niêm phong mật mã `Integrity Seal (ECDSA P-256)`.
3. **Death Certificate & Legal Dropzone**: Khung kéo thả Giấy chứng tử số có tem băm SHA-256 tự động.
4. **15s Video Affidavit Frame (Điều 630 BLDS)**: Khung webcam quay video tuyên thệ minh mẫn có nút REC đỏ và thanh trạng thái.
5. **Hộp Cảnh Báo Tuân Thủ Pháp Luật (Điều 644/612 BLDS)**: Callout màu hổ phách vàng `#FFFBEB` kèm checkbox cam đoan trách nhiệm pháp lý.

---

## 11. QUY CHUẨN THIẾT KẾ UI/UX TIÊU CHUẨN QUỐC TẾ

Mọi màn hình, giao diện và tương tác trong dự án **BẮT BUỘC PHẢI TUÂN THỦ 5 TRỤ CỘT THIẾT KẾ UI/UX CHUẨN QUỐC TẾ** (Nielsen Norman Group, WCAG 2.1 AA, Modern Design Systems & Laws of UX):

### 🔹 Trụ Cột 1: 10 Nguyên Tắc Vàng Về Khả Năng Sử Dụng (10 Usability Heuristics - NN/g)
1. **Hiển thị rõ trạng thái hệ thống (Visibility of System Status)**: Phản hồi tức thời qua Loading Skeleton, thanh tiến trình mã hóa E2EE, chấm nhịp tim DMS nhấp nháy xanh.
2. **Khớp giữa hệ thống và thế giới thực (Match between System and Real World)**: Sử dụng ngôn ngữ di sản quen thuộc ("Két số", "Người thừa kế", "Người thụ hưởng", "Niêm phong"), ẩn các thuật ngữ kỹ thuật khó hiểu (`Ciphertext`, `Blob`).
3. **Quyền kiểm soát và tự do của người dùng (User Control & Freedom)**: Mọi Modal, Stepper đều có nút "Hủy", "Quay lại", phím `Escape` (Emergency Exit).
4. **Tính nhất quán và tiêu chuẩn (Consistency & Standards)**: Đồng bộ 100% về vị trí nút, màu sắc, font chữ và bo góc trên toàn bộ các trang.
5. **Phòng ngừa lỗi hơn là sửa lỗi (Error Prevention)**: Disable nút khi dữ liệu chưa hợp lệ; hiện Modal xác nhận trước khi thực hiện hành động nhạy cảm (Xóa tài sản, Hủy di chúc).
6. **Nhận diện thay vì ghi nhớ (Recognition rather than Recall)**: Cung cấp sẵn Dropdown, Filter Chips, Placeholder chi tiết để người dùng không phải tự nhớ thông tin từ bước trước.
7. **Linh hoạt và hiệu quả sử dụng (Flexibility & Efficiency)**: Hỗ trợ phím tắt, tìm kiếm nhanh, nút Copy 1-click.
8. **Thiết kế tối giản và thẩm mỹ (Aesthetic & Minimalist Design)**: Khoảng trắng (whitespace) thoáng đãng, mỗi màn hình chỉ tập trung vào một hành động chính (Primary CTA).
9. **Nhận biết và khắc phục lỗi thân thiện (Help Users Recognize & Recover from Errors)**: Thông báo lỗi bằng tiếng Việt tự nhiên, chỉ rõ vị trí và cách sửa lỗi thay vì mã HTTP khô khan.
10. **Trợ giúp và tài liệu hướng dẫn (Help & Documentation)**: Tooltip và Callout giải thích các căn cứ pháp lý (Điều 612, 630, 644 BLDS) ngay tại ngữ cảnh thao tác.

### 🔹 Trụ Cột 2: Quy Tắc Thiết Kế Thị Giác Hiện Đại (Modern Design Systems)
- **Hệ thống khoảng cách 8-point Grid (8pt / 4pt Spacing)**: Mọi `padding`, `margin`, `gap` đều là bội số của 4px hoặc 8px (`4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px`).
- **Quy tắc phối màu 60 - 30 - 10**:
  - **60% Dominant Canvas**: Màu nền trung tính ấm (`#FAF9F5` hoặc `#EFECE6`).
  - **30% Secondary Surface**: Thẻ Card, Sidebar, Header (`#0B291E` - Heritage Forest Green).
  - **10% Accent CTA**: Nút bấm quan trọng, Badge, Focus Ring (`#B88E4C` - Champagne Gold, `#059669` - Active Green).
- **Phân cấp Typography rõ ràng**: Sử dụng font `Plus Jakarta Sans`, phân cấp bằng độ đậm (`font-bold`, `font-semibold`) và màu sắc (`text-main #14241C` vs `text-muted #66786E`).
- **Nổi khối xúc giác mềm (Soft Tactile / Tonal Elevation)**: Viền mỏng 1px (`border-[#DCD9D0]`) kết hợp bóng đổ mờ nhẹ (`shadow-[0_4px_16px_rgba(11,41,30,0.06)]`).

### 🔹 Trụ Cột 3: Tiêu Chuẩn Tiếp Cận Quốc Tế (WCAG 2.1 / 2.2 AA Accessibility)
- **Độ tương phản màu (Color Contrast Ratio)**: Tối thiểu **4.5:1** cho văn bản thường và **3:1** cho văn bản lớn/UI component.
- **Vùng chạm tối thiểu (Touch Target Size)**: Nút bấm và icon tương tác có kích thước tối thiểu **44 × 44px** (Apple HIG) / **48 × 48px** (Google Material).
- **Điều hướng bàn phím (Keyboard Accessibility & Focus Ring)**: Mọi nút bấm và ô nhập liệu đều có viền sáng rõ rệt khi nhấn `Tab` (`focus:ring-2 focus:ring-[#B88E4C] focus:outline-none`).

### 🔹 Trụ Cột 4: Quy Tắc 4 Trạng Thái Giao Diện (State-Driven UI)
Mọi màn hình nạp dữ liệu bắt buộc phải xử lý đủ 4 trạng thái:
1. **Loading State**: Sử dụng **Skeleton Loader** mô phỏng hình dáng khối dữ liệu sắp nạp.
2. **Error State**: Thông báo lỗi lịch sự, giải thích nguyên nhân kèm nút **"Thử lại"** (`refetch`).
3. **Empty State**: Không để màn hình trắng; hiển thị icon minh họa + lời dẫn hướng dẫn + nút kêu gọi hành động (Primary CTA).
4. **Success State**: Hiển thị dữ liệu trọn vẹn, hiệu ứng chuyển cảnh mềm mại (`transition-all`).

### 🔹 Trụ Cột 5: Các Định Luật Tâm Lý Học Trong UX (Laws of UX)
1. **Định luật Hick (Hick's Law)**: Giảm tải nhận thức bằng cách chia nhỏ quy trình dài thành Stepper 4 bước tuần tự.
2. **Định luật Miller (Miller's Law & Chunking)**: Phân mảnh thông tin phức tạp thành các cụm nhỏ (ví dụ: Lưới 12 từ Seed Phrase chia 3 cột đánh số 1-12; số CCCD/tài khoản ngân hàng ngắt đoạn).
3. **Ngưỡng Doherty (Doherty Threshold < 400ms)**: Áp dụng Optimistic UI để phản hồi tức thì (<400ms) khi người dùng bấm xác nhận nhịp sinh tồn "⚡ I'm Alive" hoặc chuyển Tab.

### 🔹 Trích Dẫn Mẫu Cho Báo Cáo Khóa Luận / SRS (Mục 4.2 Quality Attributes):
> *"The user interface of LegacyVault strictly conforms to international usability and accessibility benchmarks:
> 1. **Nielsen Norman Group (NN/g) 10 Usability Heuristics** for intuitive system feedback, error prevention, and streamlined estate management.
> 2. **WCAG 2.1 Level AA Accessibility Standards**, ensuring a minimum color contrast ratio of 4.5:1 and minimum interactive touch targets of 44x44px.
> 3. **Modern 8-point Grid Spacing & Tonal Elevation System**, providing consistent visual hierarchy and seamless responsive layout across devices.
> 4. **State-Driven UI Architecture**, guaranteeing comprehensive coverage of all four runtime states (Loading Skeleton, Error Fallback, Actionable Empty State, and Success Data View)."*



