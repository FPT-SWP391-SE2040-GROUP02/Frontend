# 🏛️ LegacyVault Master UI Kit & Complete Design System Specification

Tài liệu này tổng hợp toàn bộ quy chuẩn thiết kế, bảng mã màu, hiệu ứng thị giác và danh mục các thành phần giao diện (UI Components) trích xuất trực tiếp từ **Master UI Kit** của dự án **LegacyVault (SWP391)**.

---

## 1. 🎨 BẢNG MÃ MÀU & THIẾT KẾ NỀN TẢNG (DESIGN TOKENS)

### 🌿 A. Nhóm Màu Chủ Đạo (Primary - Heritage Forest)
| Tên Biến Token | Mã Màu Hex | Vai Trò & Vị Trí Ứng Dụng |
| :--- | :--- | :--- |
| `--primary` | `#0B291E` | Màu thương hiệu chính: Header, Nút chính, Tiêu đề chính, Icon active |
| `--primary-hover` | `#133E2F` | Trạng thái Hover của Button/Link |
| `--primary-light` | `#E5EDE8` | Nền nhạt cho Icon container, badge trạng thái |
| `--primary-surface`| `#10382B` | Bề mặt tối sâu, trạng thái nút Pressed / Active |
| `--bg-canvas` | `#EFECE6` | Nền canvas gốc của ứng dụng (ấm áp, xúc giác tự nhiên) |
| `--surface` | `#FAF9F5` | Bề mặt Card, Form, Modal, Dropdown (sáng ngà quý phái) |

### ⚜️ B. Nhóm Màu Điểm Xuyết (Accent - Champagne Gold)
| Tên Biến Token | Mã Màu Hex | Vai Trò & Vị Trí Ứng Dụng |
| :--- | :--- | :--- |
| `--gold` | `#B88E4C` | Màu nhấn sang trọng: Logo, Viền Focus Input, Link quan trọng |
| `--gold-hover` | `#A07839` | Hover các thành phần mạ vàng |
| `--gold-light` | `#FBF7EE` | Nền thẻ chứng thực số, tem niêm phong Crypto Seal |
| `--gold-border` | `#E8DCC6` | Viền các khối chứng thực và huy hiệu cao cấp |

### 🔘 C. Nhóm Màu Trung Tính & Trạng Thái (Neutrals & Feedback)
| Tên Biến Token | Mã Màu Hex | Vai Trò & Vị Trí Ứng Dụng |
| :--- | :--- | :--- |
| `--text-main` | `#14241C` | Văn bản chính, độ tương phản cao, dễ đọc |
| `--text-muted` | `#66786E` | Văn bản phụ, chú thích, helper text |
| `--text-subtle` | `#8E9F96` | Placeholder, viền phụ, nhãn phụ |
| `--border-ui` | `#DCD9D0` | Đường kẻ phân cách, viền card |
| `DMS Active (Green)`| `#059669` | Nhịp sinh tồn DMS Pulse đang hoạt động tốt |
| `Legal Warning (Amber)`| `#D97706` / `#FFFBEB` | Cảnh báo thừa kế Điều 644 BLDS 2015 |
| `Destructive / Error`| `#D9534F` / `#991B1B` | Nút Hủy bỏ, Lỗi Form, Quay video REC |

### 🌫️ D. Hệ Thống 4 Lớp Đổ Bóng Xúc Giác (Tactile Shadows & Depth Layers)
1. **Flat Base Layer**: `#EFECE6` viền `#DED9CD` (Bề mặt phẳng gốc).
2. **Raised Layer**: `#FAF9F5` kèm `box-shadow: 0 4px 12px rgba(11, 41, 30, 0.05), 0 1px 3px rgba(11, 41, 30, 0.03)` (Card nổi, Modal).
3. **Inset Layer**: `box-shadow: inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.8)` (Vùng lõm, Khung Dropzone).
4. **Pressed Layer**: `box-shadow: inset 3px 3px 6px rgba(11, 41, 30, 0.12), inset -2px -2px 4px rgba(255,255,255,0.7)` (Nút đang nhấn).

### 📐 E. Thang Bo Góc (Radius Scale) & Độ Dày Viền (Border Scale)
* **Radius Tokens**: `4px` (Micro/Checkboxes) · `8px` (Inputs/Breadcrumbs) · `12px` (Cards/Modals) · `16px` (Banners) · `20px` (Buttons) · `24px` (Pills/Hero).
* **Border Thickness**: `1px` (Thin - Viền chuẩn) · `2px` (Regular - Viền Focus/Active) · `4px` (Thick - Thanh báo hiệu Status).

---

## 2. 🎛️ QUY CHUẨN CÁC THÀNH PHẦN ĐIỀU KHIỂN (CONTROLS & FORMS)

### 1. Nút Bấm (Button System):
* **`btn-primary`**: Nền `#0B291E`, chữ trắng, bo góc `20px`, padding `8.5px 18px`, font-size `12.5px`, font-weight `550`, bóng `0 3px 10px rgba(11,41,30,0.2)`.
* **`btn-pressed`**: Nền `#10382B`, chữ `#E2ECE6`, bóng chìm `inset 0 2px 6px rgba(0,0,0,0.3)`.
* **`btn-disabled`**: Nền `#D8D4CA`, chữ `#9C968A`, con trỏ `not-allowed`.

### 2. Custom Checkbox & Custom Radio (Chuẩn Tùy Biến):
* **Checkbox**: Kích thước `17x17px`, bo góc `4px`, viền `1.5px solid #A8A295`, nền trắng. Khi checked chuyển sang nền `#0B291E` với icon check trắng `clip-path`.
* **Radio**: Kích thước `17x17px`, bo tròn `50%`, viền `1.5px solid #A8A295`. Khi checked viền `#0B291E` và điểm tâm tròn `7px` màu `#0B291E`.

### 3. Trường Nhập Liệu (Input Fields):
* Nền `#FAF9F5`, viền `#D5D0C3`, bo góc `8px`, font chữ kế thừa, padding `8.5px 13px`.
* **Focus**: Viền vàng `#B88E4C`, bóng mở rộng `box-shadow: 0 0 0 3px rgba(184, 142, 76, 0.15)`.
* **Error**: Viền đỏ `#D9534F`, nền `#FFF9F9`, thông báo lỗi chữ đỏ font-size `10px`.

### 4. Switch & Slider:
* **Switch**: Khung `44x24px`, bo tròn `12px`, nền `#CCC7BA`. Khi active chuyển sang `#0B291E`, nút tròn trắng dịch chuyển `20px`.
* **Range Slider**: Thanh trượt dày `5px` màu `#D2CDC1`, nút kéo tròn `16x16px` màu `#0B291E` viền trắng `2px`.

---

## 3. 🧭 ĐIỀU HƯỚNG & TIẾN TRÌNH (NAVIGATION & STEPPERS)

1. **Pill Tabs**: Khung `#E5E1D6`, bo tròn `10px`, padding `3px`. Tab active có nền `#FAF9F5`, chữ `#0B291E` đậm, bóng nhẹ `0 1px 3px rgba(0,0,0,0.06)`.
2. **Breadcrumbs Pill**: Thẻ điều hướng bo tròn `8px`, nền `#FAF9F5`, viền `#DDD8CB`, phân cách bằng dấu `/`.
3. **Pagination**: Nút kích thước `28x28px`, bo góc `6px`. Nút active nền `#0B291E` chữ trắng.
4. **4-Step Legal Protocol Stepper**:
   - Vòng tròn bước `28x28px`: Bước 1 (Asset Vault) `✓`, Bước 2 (Heirs & Rules) `Active Popover`, Bước 3 (Notary Review), Bước 4 (Smart Seal).
   - Popover bước hiện tại: Nền `#0B291E`, chữ trắng, bo góc `4px`, chữ `9.5px`.

---

## 4. 📊 HIỂN THỊ DỮ LIỆU & PHẢN HỒI (DATA DISPLAY & FEEDBACK)

* **Display Card**: Kích thước chuẩn, nền `#FAF9F5`, viền `#DDD8CB`, bo góc `12px`, icon container `32x32px` màu `#E5EDE8` (`#0B291E`).
* **List Group**: Danh sách hàng có avatar tròn `26x26px`, viền ngăn cách `#EBE7DD`.
* **Badges / Tags**: `tag-new` (Nền `#E5EDE8`, chữ `#0B291E`), `tag-beta` (Nền `#FBF7EE`, chữ `#7D5D28`), `tag-count` (Nền `#0B291E`, chữ trắng).
* **Feedback Modals & Toasts**:
  - Modal xác nhận thu hồi di chúc (Revoke Vault).
  - Toast thông báo tức thì (Smart Will Sealed, Notary Approved).
  - Banner cảnh báo công chứng (`#0B291E` chữ trắng).
  - Thanh tiến trình mã hóa (Encryption Progress Bar 50%).
  - Skeleton Loader (`#DCD7CB`).
  - Empty State (Icon kính lúp mờ + nút Clear Filters).

---

## 5. 🏛️ BỘ 5 THÀNH PHẦN NGHIỆP VỤ ĐẶC THÙ (DOMAIN-SPECIFIC PROTOCOLS)

### 1. 🔐 Masked Private Key & 12-Word Seed Phrase Grid
- Khung che giấu mật mã: Nền trắng, font `monospace`, kích thước chữ `11px`, dấu chấm ẩn mật khẩu `••••••••••••••••`, nút `👁️ Toggle` và nút `📋 Copy`.
- Lưới 12 từ khôi phục: Bố cục 3 cột (Grid 3 cols), từng hộp từ có số thứ tự màu xám và từ khóa in nghiêng.

### 2. 💓 Live Dead Man's Switch (DMS) Heartbeat Card & Crypto Seal
- Thẻ DMS: Viền trái `4px solid #059669`, vòng tròn nhịp tim `38x38px` chứa điểm sáng `pulse-dot` hiệu ứng sóng xung nhịp CSS Keyframe `pulseAnimation` 1.6s.
- Hiển thị thời gian đếm ngược: `45 Days : 14 Hours Left` kèm nút `⚡ I'm Alive` màu xanh ngọc `#059669`.
- Thẻ niêm phong mật mã: Nền vàng nhạt `#FBF7EE`, viền vàng `#E8DCC6`, mã băm chuỗi ECDSA P-256 không thể giả mạo (`TAMPER-PROOF`).

### 3. 📄 Death Certificate & Legal Document Dropzone
- Vùng kéo thả viền đứt đoạn `2px dashed #C5BEAF`, nền `#FAF9F5`, bo góc `12px`.
- Tem bảo chứng: Badge niêm phong băm SHA-256 tự động.

### 4. 📹 15s Video Affidavit Frame (Điều 630 BLDS 2015)
- Khung webcam quay video tuyên thệ minh mẫn: Nền tối `#071E16`, viền `#2D4236`, góc trên có huy hiệu quay phim nền đen mờ kèm chấm đỏ nhấp nháy `REC 00:14 / 00:15`.
- Thanh điều khiển đáy: Nền `#0B291E`, chữ trắng, nút `⏹ Dừng quay` màu đỏ `#EF4444`.

### 5. ⚖️ Hộp Cảnh Báo Tuân Thủ Pháp Luật (Điều 644 / 612 BLDS 2015)
- Khung cảnh báo màu hổ phách vàng `#FFFBEB`, viền vàng `#FDE68A`, viền trái `4px solid #D97706`.
- Tiêu đề cân nhắc quyền lợi người thừa kế không phụ thuộc nội dung di chúc (cha mẹ già, con chưa thành niên).
- Checkbox cam đoan trách nhiệm dân sự.
