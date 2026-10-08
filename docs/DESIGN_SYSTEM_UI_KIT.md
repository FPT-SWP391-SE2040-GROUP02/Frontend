# UI kit và nguồn tham khảo React

Bộ mẫu mới nằm tại legacyvault-ui-kit (mẫu cục bộ, không đóng gói trong repo). Hai thư mục kit đã được gom về một đường dẫn; bộ cũ được lưu trong archive (archive cục bộ, không đóng gói trong repo).

Kit JSX/CSS là nguồn tham khảo có chọn lọc. Dự án dùng React 19/TypeScript/Base UI và FSD; tái sử dụng `shared/ui`, đưa nội dung/DTO vào tầng phù hợp, không chép nguyên toàn bộ `src/` vào ứng dụng.

- Dùng font đã đóng gói và kiểm tra ký tự tiếng Việt ở mọi weight.
- Tuân thủ palette Heritage của charter; đối chiếu token mẫu trước khi đưa vào CSS toàn cục.
- Giữ keyboard/focus/aria, kích thước tương tác và đủ trạng thái loading/error/empty/success.
- Nội dung thời hạn, giá, điểm AI, stepper và vai trò trong kit chỉ là mẫu; dùng [SRS 3.14](srs/LegacyVault-SRS-v3.14.0.md) và contract đã chốt.
- Modal cần focus trap/Escape; tránh primitive trùng và dependency mới không cần thiết.

Mẫu Auth ở `mockups/auth/`; ZIP gốc ở `mockups/archives/`. Design system 3.11 (archive cục bộ, không đóng gói trong repo) và HTML kit cũ (archive cục bộ, không đóng gói trong repo) lưu để tra cứu, không phải UI nghiệp vụ hiện hành.
