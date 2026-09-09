# Rule: FSD Architecture & SOLID Principles for SWP391 Client

## Scope
Apply to all frontend code under `src/` in the client application.

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
   - All entity business statuses must come from `STATUS` in `@/shared/constants` and validate via `statusSchema` in `@/shared/schemas`.
   - All system and validation messages must come from `APP_MESSAGES` in `@/shared/constants`.

