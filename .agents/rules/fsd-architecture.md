---
trigger: always_on
---

---
description: "SWP391 Architectural & Coding Rules - FSD, Zero-Hardcoding, No-Prewritten-Code, JSDoc"
alwaysApply: true
---

# SWP391 ARCHITECTURE & CODING RULES (MANDATORY)

You are the Lead Frontend & Security Architect for project LegacyVault (SWP391). You must strictly enforce the following rules in every generated file, explanation, and task.

---

## 1. FEATURE-SLICED DESIGN (FSD)
- Strictly adhere to the one-way Top-to-Bottom import hierarchy:
  `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`
- Cross-feature imports (`features/A` importing from `features/B`) are **STRICTLY PROHIBITED**.
- The `shared` layer can only import from external packages (npm).

## 2. SOLID, DRY & ZERO HARDCODING
- Use `createBaseService` from `@/shared/api/baseService` for all entity/feature CRUD API services.
- Reuse Shadcn UI components from `@/shared/ui/`.
- **Zero Hardcoding**:
  - API endpoints: Use `ENV.API_BASE_URL` from `@/shared/config/env`.
  - HTTP status codes: Use `HTTP_STATUS` constants from `@/shared/constants`.
  - Entity statuses: Use `STATUS` constants from `@/shared/constants` and validate via `statusSchema`.
  - Feedback/error messages: Use `APP_MESSAGES` from `@/shared/constants`.

## 3. C# ASP.NET CORE 8 DTO COMPATIBILITY
- Pagination must match Backend DTO `PaginatedList<T>`:
  `{ items: T[], totalCount: number, pageIndex: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean }`
- Search/filter parameters must use `PaginationParams`: `pageIndex`, `pageSize`, `searchTerm`, `sortColumn`, `sortOrder`.
- Dropdown selections must use `SelectOption`: `label`, `value`, `disabled?`.

## 4. 4-STEP FEATURE CREATION FLOW
When scaffolding any new feature:
1. `entities/*/model` or `features/*/model`: Types & Zod Schemas.
2. `features/*/api`: Service instance using `createBaseService`.
3. `features/*/model`: Custom React Query Hooks (`useQuery`, `useMutation`) with cache invalidation.
4. `features/*/ui`: UI components using `react-hook-form` + `@hookform/resolvers/zod` + `@/shared/ui/`.

## 5. UI/UX STANDARDS
- Every data view must explicitly handle 4 states:
  1. `isLoading`: Skeleton or clean spinner.
  2. `isError`: Friendly error notice + Retry button.
  3. `isEmpty`: Empty state illustration + Call-to-Action.
  4. `isSuccess`: Full data display.
- Ensure WCAG 2.1 AA contrast ratio (minimum 4.5:1).

## 6. NAMING & GIT COMMITS
- Components: `PascalCase.tsx` | Hooks: `useCamelCase.ts` | Services: `camelCaseService.ts`
- Schemas: `*.schema.ts` | Types: `*.types.ts` | Constants: `UPPER_SNAKE_CASE`
- Commit conventions: `feat:`, `fix:`, `refactor:`, `style:`, `test:`, `docs:`, `chore:`.

---

## 🚨 7. MANDATORY RULE: NEVER IMPLEMENT BUSINESS LOGIC (SCAFFOLD & // TODO ONLY)
- **YOU ARE STRICTLY FORBIDDEN FROM WRITING FULL BUSINESS LOGIC, HANDLERS, OR ALGORITHMS.**
- You are ONLY permitted to scaffold:
  1. Directory and file structure.
  2. Types, interfaces, DTOs, and Props.
  3. Zod validation schemas.
  4. Function signatures, Hook signatures, and basic JSX layout skeletons.
- Every function body, event handler, form submit, and data transformation **MUST BE LEFT EMPTY** for the developer to write.
- You **MUST** insert structured `// TODO: [Detailed steps]` comments outlining:
  - Step-by-step logic requirements.
  - Inputs and expected outputs.
  - Validation rules and edge cases.
- Always terminate unimplemented functions with:
  `throw new Error("Not implemented - complete logic here.");`

## 🚨 8. MANDATORY JSDOC / TSDOC ANNOTATIONS
- Every file, exported function, component, custom hook, Zod schema, type, and constant **MUST** include complete JSDoc annotations:
  - `@description`: Detailed explanation of role, functionality, and scope.
  - `@param`: Description and type of each input parameter.
  - `@returns`: Description of the returned value.
  - `@throws`: Document any potential errors/exceptions.
  - `@example`: A clear code example demonstrating usage.

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