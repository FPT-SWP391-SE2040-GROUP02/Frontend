# Quy Tắc Kiến Trúc & Phát Triển Chuẩn SWP391 (Frontend Client)

Tài liệu này là kim chỉ nam tối thượng cho tất cả các thành viên phát triển và AI Assistant khi viết code cho dự án `client`.

---

## 1. Kiến Trúc Tổng Thể: Feature-Sliced Design (FSD)

Cấu trúc thư mục `src/` được phân tầng rõ ràng theo chiều từ trên xuống dưới. **Quy tắc phụ thuộc 1 chiều: Tầng dưới TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP import từ các tầng trên nó.**

```
src/
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
- `features` -> `entities`, `shared` _(TUYỆT ĐỐI KHÔNG import chéo giữa các feature)_
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

1. **Bước 1 (Entities & Types)**:
   - Định nghĩa Entity Types và Zod Schema trong `entities/product/model/` hoặc `features/products/model/`.
2. **Bước 2 (API Service)**:
   - Tạo `productService` bằng `createBaseService<Product, CreateProductDto, UpdateProductDto, ProductFilterParams>({ endpoint: "/products" })`.
3. **Bước 3 (React Query Hooks)**:
   - Định nghĩa `productKeys` và các custom hooks (`useProducts`, `useProductDetail`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`).
   - Tự động gọi `queryClient.invalidateQueries({ queryKey: productKeys.all })` khi mutation thành công.
4. **Bước 4 (Lắp ráp UI)**:
   - Sử dụng `react-hook-form` + `@hookform/resolvers/zod` + `@/shared/ui/` components để xây dựng Form và Table.

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
