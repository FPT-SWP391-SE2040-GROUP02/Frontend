# SWP391 - Frontend Client

Dự án Frontend xây dựng bằng **React 19 + TypeScript + Vite + Tailwind CSS v4 + Shadcn UI**, áp dụng kiến trúc chuẩn **Feature-Sliced Design (FSD)** kết hợp **SOLID & DRY**.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Shadcn UI (Base UI Nova preset) + Lucide Icons
- **State Management**:
  - **Server State**: TanStack React Query v5 + React Query Devtools
  - **Client State**: Redux Toolkit / React Context
- **Forms & Validation**: React Hook Form + Zod
- **HTTP Client**: Axios (với BaseService Factory Pattern)
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library + JSDOM
- **Code Quality**: ESLint + Prettier

---

## 🛠️ Hướng dẫn cài đặt cho thành viên mới (Getting Started)

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Cập nhật `VITE_API_BASE_URL` trỏ tới backend C# ASP.NET Core của bạn (mặc định: `http://localhost:5000/api`).

### 3. Kích hoạt bộ công cụ UI/UX Pro Max (Dành cho AI Assistant)

Chạy lệnh sau để khởi tạo đầy đủ bộ 7 skills UI/UX Pro Max khi làm việc với Antigravity / Gemini:

```bash
uipro init --ai antigravity
```

### 4. Khởi chạy Development Server

```bash
npm run dev
```

---

## 📜 Bộ lệnh chính (Available Scripts)

- `npm run dev`: Chạy server phát triển (HMR).
- `npm run build`: Kiểm tra kiểu dữ liệu TypeScript và build production bundle vào thư mục `dist/`.
- `npm run preview`: Xem trước bản build production tại local.
- `npm run lint`: Kiểm tra và tự động sửa lỗi ESLint.
- `npm run format`: Định dạng toàn bộ code với Prettier.
- `npm run test`: Chạy kiểm thử tự động với Vitest.

---

## 🏗️ Cấu trúc thư mục (Feature-Sliced Design)

```
src/
├── app/        # Global Providers, Router, Store, Styles gốc
├── pages/      # Các màn hình hoàn chỉnh ghép từ widgets/features
├── widgets/    # Các khối giao diện độc lập lớn (Header, Sidebar, Tables...)
├── features/   # Nghiệp vụ theo tính năng (auth, products...) với api/, model/, ui/
├── entities/   # Thực thể dữ liệu cốt lõi (User, Product...)
└── shared/     # Thành phần dùng chung:
    ├── api/    # axiosClient, createBaseService
    ├── config/ # env.ts
    ├── types/  # PaginatedList, SelectOption, ApiResponse
    └── ui/     # Toàn bộ components Shadcn UI (Button, Card, Input...)
```
