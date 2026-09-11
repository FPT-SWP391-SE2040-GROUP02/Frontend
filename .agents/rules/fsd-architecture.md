# Rule: FSD Architecture & SOLID Principles for SWP391

## Scope
Apply to all frontend and backend code across the SWP391 project.

## Core Rules
1. **Layer Hierarchy (FSD)**:
   - Layers in strictly descending order: `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`.
   - Never import from higher layers into lower layers.
   - Never cross-import between features (`features/A` cannot import `features/B`).

2. **Shared UI & Components**:
   - All Shadcn UI components must reside in `@/shared/ui` (`src/shared/ui/`).
   - Never write redundant primitives; reuse components from `@/shared/ui`.

3. **API & Data Services**:
   - All CRUD services must use the factory `createBaseService` located in `@/shared/api/baseService`.
   - Always use standard DTOs: `PaginatedList<T>`, `PaginationParams`, `SelectOption` from `@/shared/types`.
   - Never call `axiosClient` or raw `fetch` directly inside React UI components.

4. **Form & Validation**:
   - Forms must be built using `react-hook-form` and `@hookform/resolvers/zod`.
   - All validation schemas must be defined in `*.schema.ts` using Zod.

5. **Server State (React Query v5)**:
   - Group queries using standard Query Key factories (`all`, `lists`, `list(params)`, `details`, `detail(id)`).
   - Invalidate query cache on `useMutation` onSuccess.

6. **UI/UX Standards**:
   - Design accessible interfaces following WCAG 2.1 AA.
   - Ensure all 4 states (`isLoading`, `isError`, `isEmpty`, `isSuccess`) are handled for async views.

7. **Zero Hardcoding (Constants & Schemas)**:
   - All HTTP status codes must come from `HTTP_STATUS` in `@/shared/constants`.
   - All entity business statuses must come from `STATUS` in `@/shared/constants` và validate qua `statusSchema`.
   - All system and validation messages must come from `APP_MESSAGES` in `@/shared/constants`.

8. **NO PRE-BAKED CODE (Bắt Buộc Tự Code & Đánh Dấu `// TODO`)**:
   - AI Assistant KHÔNG ĐƯỢC sinh sẵn trọn gói toàn bộ logic nghiệp vụ (business logic).
   - Chỉ cung cấp khung skeleton: interface, types, function signature, schema, component props.
   - Tất cả các khối xử lý logic nghiệp vụ phải để trống và bắt buộc đánh dấu bằng `// TODO: [Chi tiết yêu cầu, input/output, điều kiện biên]` để sinh viên/developer tự tay code hoàn thiện.

9. **MANDATORY JSDOC (Bắt Buộc Viết JSDoc Đầy Đủ)**:
   - 100% functions, methods, React components, custom hooks, API services, types/interfaces, và Zod schemas phải có khối chú thích JSDoc/TSDoc chi tiết.
   - Bao gồm đầy đủ `@description`, `@param`, `@returns`, `@example` và `@throws` (nếu có).

10. **GIT BRANCHING STRATEGY (Quy Tắc Chia Nhánh Làm Việc)**:
   - Không commit code chưa hoàn thiện hoặc chưa test trực tiếp lên nhánh `main`.
   - Mỗi task/tính năng bắt buộc checkout sang nhánh riêng: `feat/<feature-name>`, `fix/<bug-name>`, `refactor/<task-name>`.
   - Luôn chạy `npm run type-check` và `npm run test:run` pass 100% trước khi tạo PR vào `main`.

