# Hướng dẫn tích hợp Frontend

React 19/TypeScript hiện có cấu trúc FSD: app → pages → widgets → features → entities → shared. [README client](../README.md) chứa lệnh chạy và kiểm tra.

## Công việc trước khi thay mock bằng API

- Chốt D0 trong [Yêu cầu FE → BE](FE_BE_INTEGRATION_REQUEST.md): session, unwrap response, roles, enums và pagination.
- Định nghĩa DTO/schema từ OpenAPI thực → service qua shared API → Query hooks/queryKeys → UI.
- Đặt chuyển DTO sang ViewModel ở adapter; không parse rải trong UI.
- Dùng TanStack Query cho server state, RHF/Zod cho form, Redux cho client state chung, URL cho lọc/tab.
- Xử lý loading/error/empty/success; inline validation, toast lỗi API và ErrorBoundary cho lỗi runtime.
- Invalidate cache sau mutation. Thao tác pháp lý, điểm danh, bàn giao và thanh toán chờ kết quả BE.
- Preview chỉ phục vụ UI. Cần thay model/luồng cũ Shamir, chia tỷ lệ, chuyển quyền và freeze trước tích hợp.

Theo Hướng 1 của dự án, AI dựng contract/scaffold và TODO blueprint; developer hoàn thiện logic nghiệp vụ. Không tuyên bố đã OCR, PAD, cấp grant hoặc thanh toán thật dựa trên mock.

Guide 3.11 nguyên bản (archive cục bộ, không đóng gói trong repo) chỉ là lịch sử. [SRS 3.14](srs/LegacyVault-SRS-v3.14.0.md) quyết định nghiệp vụ.
