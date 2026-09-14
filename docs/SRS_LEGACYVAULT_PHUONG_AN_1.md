# TRƯỜNG ĐẠI HỌC FPT — KHOA KỸ THUẬT PHẦN MỀM

## MÔN HỌC: SWP391 (PHÁT TRIỂN ỨNG DỤNG DOANH NGHIỆP)

---

# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

### PHƯƠNG ÁN 1: LEGAL-TECH (HIỆU CHỈNH KỸ THUẬT CHUẨN MỰC)

**Tên đề tài:** LegacyVault — Hệ thống Quản lý Tài sản số & Bàn giao Di sản số
*(Digital Asset Vault & Digital Estate Handover System)*

---

## ĐẶC TRƯNG CỐT LÕI CỦA PHƯƠNG ÁN 1: LEGAL-TECH

Hệ thống tập trung giải quyết bài toán pháp lý về **Di chúc điện tử và thừa kế di sản số tại Việt Nam**.
Quy trình mở khóa kho bắt buộc tuân thủ nguyên tắc mở thừa kế theo **Điều 611 Bộ luật Dân sự 2015**, yêu cầu nộp scan Giấy chứng tử và có sự thẩm định, ký duyệt của Công chứng viên (*Legal Verifier / Notary*).

---

## 1. BỐI CẢNH THỰC HIỆN ĐỀ TÀI & CĂN CỨ PHÁP LÝ

### 1.1. Bối cảnh thực tiễn

Khi một cá nhân qua đời, các di sản số giá trị (tài khoản ngân hàng, ví crypto, tài khoản kinh doanh, mạng xã hội) thường rơi vào tình trạng "vô chủ" hoặc bị đóng băng do người thừa kế không có mật khẩu truy cập. Phương án Legal-Tech số hóa quy trình lập di chúc và thừa kế theo đúng quy định pháp luật Việt Nam.

### 1.2. Căn cứ pháp lý cốt lõi

1. **Luật Giao dịch điện tử 2023 (Điều 1, 10, 12, 15, 23, 31):**Công nhận thông điệp dữ liệu có giá trị như văn bản, giá trị như bản gốc, và giá trị pháp lý của chữ ký điện tử an toàn.
2. **Bộ luật Dân sự 2015 (Điều 105, 115, 117, 120, 415, 562, 609–662):**Quy định về tài sản, giao dịch dân sự có điều kiện, hợp đồng vì lợi ích người thứ ba, hợp đồng ủy quyền và các quy định về thừa kế.
3. **Bộ luật Tố tụng Dân sự 2015 (Điều 95):**
   Quy định về giá trị chứng cứ của thông điệp dữ liệu.

### 1.3. Phân định khái niệm: Tài sản số (Digital Assets) vs. Di sản số (Digital Estate)

- **Tài sản số (Điều 105 Bộ luật Dân sự 2015):** Tồn tại và thuộc quyền quản lý của chủ sở hữu khi còn sống (*inter vivos*).
- **Di sản số (Điều 612 Bộ luật Dân sự 2015):** Chỉ phát sinh tại thời điểm mở thừa kế (Điều 611 BLDS), là phần tài sản số hợp pháp còn lại sau khi thanh toán nghĩa vụ và loại trừ các quyền nhân thân không thể chuyển giao (Điều 25 BLDS).

#### Cơ chế phân loại 3 nhóm dữ liệu trong kho:

- **Nhóm 1: Di sản số có giá trị kinh tế (*Economic Digital Estate*):** Bàn giao quyền sở hữu/kiểm soát (ví crypto, tên miền, tài khoản thương mại).
- **Nhóm 2: Kỷ vật số / Ký ức số (*Digital Mementos*):** Bàn giao lưu niệm cho người thân (ảnh gia đình, thư từ).
- **Nhóm 3: Dữ liệu bảo mật nhân thân (*Confidential Personal Data*):** Tự động tiêu hủy mật mã (*Cryptographic Burn*) để bảo vệ quyền riêng tư cá nhân khi qua đời (Điều 38 BLDS 2015).

---

## 2. BẢN GIẢI TRÌNH GIẢI PHÁP PHÁP LÝ & CƠ CHẾ TUÂN THỦ PHÁP LUẬT DÂN SỰ

### 2.1. Xác lập Bản chất Pháp lý của Giao dịch

Để giải quyết bài toán di chúc điện tử chưa được công nhận trong thực tiễn công chứng và tránh xung đột với Khoản 2 Điều 1 Luật Giao dịch điện tử 2023 cùng các điều kiện hình thức cứng của Bộ luật Dân sự 2015, hệ thống xác lập bản chất pháp lý theo các chế định hợp đồng dân sự hợp pháp:

- **Giao dịch dân sự có điều kiện phát sinh (Điều 120 Bộ luật Dân sự 2015):** Sự kiện chủ tài khoản mất liên lạc trong một khoảng thời gian xác định, kết hợp với văn bản xác nhận sự kiện tử tuất hợp pháp, được thỏa thuận là điều kiện phát sinh hiệu lực của việc chuyển giao quyền tiếp cận thông tin cho bên thụ hưởng.
- **Hợp đồng vì lợi ích của người thứ ba (Điều 415 Bộ luật Dân sự 2015):** Chủ tài khoản xác lập thỏa thuận với bên quản trị dịch vụ nhằm mục đích: Khi điều kiện xảy ra, người thứ ba (Người thụ hưởng) có quyền trực tiếp yêu cầu tiếp nhận các thông tin, tài liệu và quyền kiểm soát tài sản số mà không cần sự can thiệp của chủ tài khoản.
- **Hợp đồng ủy quyền thực hiện công việc (Điều 562 Bộ luật Dân sự 2015):** Người thi hành (*Executor*) đóng vai trò là bên được ủy quyền đại diện nộp văn bản chứng minh sự kiện tử tuất và giám sát quá trình bàn giao thông tin cho các bên thụ hưởng theo đúng ý chí ban đầu.

### 2.2. Cơ chế Bảo đảm Ý chí Tự nguyện và Năng lực Hành vi Dân sự

- **Chứng cứ ghi nhận trạng thái minh mẫn (Điều 117 và Điều 630 Bộ luật Dân sự 2015):** Giao dịch chỉ có hiệu lực khi chủ thể có đầy đủ năng lực nhận thức và làm chủ hành vi, tham gia hoàn toàn tự nguyện, không bị lừa dối, đe dọa hay cưỡng ép. Tại thời điểm xác lập, chủ tài khoản thực hiện bản ghi hình webcam 15 giây tuyên thệ nêu rõ họ tên, ngày sinh và cam đoan tự nguyện làm chứng cứ chứng minh ý chí đích thực.
- **Quyền sửa đổi và thu hồi ý chí (Điều 638 Bộ luật Dân sự 2015):** Trong suốt thời gian chủ tài khoản còn hoạt động, quyền định đoạt thuộc về chính chủ thể. Chủ tài khoản có quyền sửa đổi, bổ sung, thay thế hoặc hủy bỏ toàn bộ nội dung ủy quyền bất kỳ lúc nào. Giao dịch xác lập sau cùng sẽ phủ quyết các giao dịch xác lập trước đó.

### 2.3. Phân định Ranh giới Quyền Nhân thân và Quyền Tài sản

- **Bảo vệ quyền nhân thân và bí mật đời tư (Điều 25 và Điều 38 Bộ luật Dân sự 2015):** Đời sống riêng tư, bí mật cá nhân là bất khả xâm phạm và được pháp luật bảo vệ. Quyền nhân thân không thể thừa kế. Đối với các dữ liệu thuần túy mang tính nhân thân (thư từ, nhật ký, tài khoản cá nhân), chủ thể có quyền định đoạt: Cho phép người thân tiếp cận với tư cách kỷ vật lưu niệm, hoặc yêu cầu cơ chế tiêu hủy vĩnh viễn quyền tiếp cận khi qua đời nhằm bảo vệ danh dự, bí mật đời tư sau khi chết.
- **Đối với quyền tài sản (Điều 105 và Điều 115 Bộ luật Dân sự 2015):** Đối với các dữ liệu gắn liền với giá trị kinh tế (quyền khai thác thương mại, tên miền, thông tin truy cập ví tài sản số): Hệ thống thực hiện chuyển giao quyền tiếp cận thông tin quản trị theo thỏa thuận dân sự.
- **Đối với tài sản phải đăng ký quyền sở hữu:** Đối với bất động sản, tiền gửi tổ chức tín dụng, phương tiện giao thông: Hệ thống chỉ cung cấp Văn bản chỉ dẫn và tài liệu đối soát nguồn gốc. Việc chuyển quyền sở hữu thực tế bắt buộc phải tiến hành thủ tục khai nhận hoặc phân chia di sản thừa kế theo đúng trình tự pháp luật công chứng và cơ quan nhà nước có thẩm quyền.

### 2.4. Trách nhiệm Thực hiện Nghĩa vụ Tài sản và Diện Thừa kế Bắt buộc

- **Ưu tiên thanh toán nghĩa vụ tài sản (Điều 615 Bộ luật Dân sự 2015):** Việc chuyển giao quyền tiếp cận thông tin tài sản không được nhằm mục đích tẩu tán tài sản hoặc trốn tránh nghĩa vụ tài chính đối với Nhà nước và bên thứ ba. Người tiếp nhận tài sản có trách nhiệm thực hiện các nghĩa vụ tài sản trong phạm vi giá trị tài sản được nhận.
- **Cơ chế tôn trọng diện thừa kế bắt buộc (Điều 644 Bộ luật Dân sự 2015):** Quy trình bắt buộc chủ sở hữu phải rà soát thân nhân thuộc diện hưởng thừa kế không phụ thuộc vào nội dung di chúc (Cha, Mẹ, Vợ/Chồng, Con chưa thành niên hoặc Con thành niên mất khả năng lao động). Nếu không phân bổ cho các đối tượng này, hệ thống đưa ra khuyến cáo pháp lý và yêu cầu xác nhận cam kết tự chịu trách nhiệm về tranh chấp dân sự phát sinh.
- **Xử lý di sản không có người nhận thừa kế (Điều 622 Bộ luật Dân sự 2015):** Trường hợp quá thời hiệu phân chia mà không có người nhận thừa kế hoặc từ chối nhận di sản, tài sản được niêm phong lưu trữ để phục vụ việc chuyển giao cho Nhà nước theo phán quyết của Tòa án.

### 2.5. Giá trị Chứng cứ và Cơ chế Chuyển đổi Văn bản Pháp lý

- **Giá trị chứng cứ của thông điệp dữ liệu:** Căn cứ Điều 95 Bộ luật Tố tụng Dân sự 2015 và Điều 12 Luật Giao dịch điện tử 2023, toàn bộ gói tài liệu được lưu trữ toàn vẹn, có đóng dấu thời gian xác thực và xác định rõ người khởi tạo được thừa nhận là chứng cứ hợp pháp trước cơ quan xét xử khi phát sinh tranh chấp.
- **Chuyển đổi thông điệp dữ liệu sang văn bản giấy (Điều 15 Luật Giao dịch điện tử 2023):** Khi người thụ hưởng cần thực hiện thủ tục hành chính tại Ngân hàng, Văn phòng Công chứng hoặc Cơ quan đăng ký đất đai, hệ thống kết xuất Văn bản chuyển đổi từ thông điệp dữ liệu (PDF/A). Văn bản này phản ánh toàn vẹn nội dung gốc, có mã số nhận diện, thời điểm khởi tạo và dấu xác nhận của hệ thống, bảo đảm đầy đủ giá trị pháp lý để cơ quan hành chính thụ lý hồ sơ.

---

## 3. PHẠM VI HỆ THỐNG & SƠ ĐỒ NGỮ CẢNH (SCOPE & CONTEXT DIAGRAM)

### 3.1. Tổng quan Lõi Hệ thống (Process 0)

Lõi trung tâm **`0. HỆ THỐNG LEGACYVAULT (Zero-Knowledge Core & Legal-Tech Escrow Engine)`** tích hợp và điều phối 5 phân hệ nghiệp vụ nội bộ:

1. **Phân hệ 1:** Quản lý kho E2EE (*Zero-Knowledge Vault Management*).
2. **Phân hệ 2:** Giám sát Dead Man's Switch & Sinh tồn (*Liveness Monitor & Escalation*).
3. **Phân hệ 3:** Thẩm định Pháp lý Tử tuất / Mất tích (*Notary Verification Split-Screen*).
4. **Phân hệ 4:** Điều phối & Bàn giao Di sản số (*Estate Allocation & Decryption Handover*).
5. **Phân hệ 5:** Quản trị Phân quyền RBAC & Sổ cái Kiểm toán WORM (*Security & Audit Governance*).

---

### 3.2. Đặc tả Chi tiết Luồng Dữ liệu Hai chiều của 5 Tác nhân Người dùng (5 User Actors Dataflow)

#### 1. Vault Owner (Chủ kho / Người lập di chúc):

- **Luồng gửi VÀO Process 0 (Inflows):**
  - Token Google OpenID Connect (OIDC) & Thông tin đăng ký Passkey FIDO2 (`credentialId`, `publicKey`).
  - Bản mã tài sản số đã mã hóa đối xứng Client-side AES-256-GCM (`Ciphertext` + `IV` + `AuthTag`).
  - Dữ liệu cấu hình Cây gia đình hạt nhân JSON (Vợ/chồng, Cha mẹ ruột, Con cái kèm năm sinh phục vụ Điều 612 & 644 BLDS).
  - Tệp Video 15s webcam tuyên thệ minh mẫn kèm mã băm SHA-256 `oath_video_hash` (Điều 630 BLDS).
  - Chữ ký số cá nhân ECDSA P-256 ký trên mã băm tổng thể `manifest_hash` (Điều 23 Luật Giao dịch điện tử 2023).
  - Tín hiệu điểm danh liveness định kỳ (`⚡ I am Alive`) hoặc đăng nhập Passkey kích hoạt cơ chế Rollback khôi phục kho.
- **Luồng nhận VỀ từ Process 0 (Outflows):**
  - Biên bản điện tử xác nhận niêm phong kho an toàn kèm mã băm SHA-256 và dấu thời gian Timestamp.
  - Hộp cảnh báo pháp lý tự động: Cảnh báo khóa trần 50% tài sản chung (Điều 612 BLDS) và cảnh báo bỏ sót diện bắt buộc (Điều 644 BLDS).
  - Thông báo cảnh báo thời gian ân hạn DMS (*Grace Period Notice*) khi bỏ lỡ nhịp tim định kỳ.
  - Hóa đơn thanh toán VietQR SePay kèm mã chuyển khoản tự động có cú pháp `LV[0-9]{6}`.

#### 2. Digital Executor (Người thi hành di chúc số):

- **Luồng gửi VÀO Process 0 (Inflows):**
  - Thông tin đăng nhập xác thực tài khoản Executor.
  - Bản scan Giấy chứng tử số do UBND cấp **HOẶC** Quyết định có hiệu lực pháp luật của Tòa án nhân dân tuyên bố đã chết (Điều 71 BLDS) / tuyên bố mất tích (Điều 68 BLDS).
  - Dữ liệu hộ tịch: Số hiệu trích lục khai tử / số bản án Tòa án, ngày cấp, nơi cấp chứng từ.
  - Văn bản điện tử giải trình bổ sung hồ sơ khi bị Notary từ chối.
  - Lệnh kích hoạt phát tán thông báo thừa kế đến danh sách Beneficiaries.
  - Lệnh đóng hồ sơ thừa kế vĩnh viễn (*Case Closed*).
- **Luồng nhận VỀ từ Process 0 (Outflows):**
  - Báo động khẩn cấp khi chủ kho mất liên lạc sau khi kết thúc thời gian ân hạn 14 ngày.
  - Thông báo trạng thái thụ lý hồ sơ từ hệ thống.
  - Phán quyết thẩm định hồ sơ của Công chứng viên: Thông báo Chấp thuận (*Approve*) hoặc Từ chối (*Reject*) kèm lý do giải trình cụ thể.
  - Metadata danh mục tài sản và danh sách Người thụ hưởng được phân bổ (không chứa khóa giải mã).
  - Báo cáo tiến độ tiếp nhận tài sản thời gian thực của từng người thừa kế.
  - Biên bản xác nhận hoàn tất quy trình thi hành di sản số.

#### 3. Legal Verifier / Notary (Công chứng viên thẩm định pháp lý):

- **Luồng gửi VÀO Process 0 (Inflows):**
  - Quyết định phê duyệt hồ sơ thừa kế hợp pháp (*Approve*) kèm 4 tích chọn kiểm toán bắt buộc.
  - Mật khẩu / Mã PIN chữ ký số công chứng viên để giải phóng Mảnh khóa Verifier (*Shamir Share 2*).
  - Quyết định từ chối hồ sơ (*Reject*) kèm mã lỗi chuẩn (`ERR_*`) và văn bản giải trình tối thiểu 20 ký tự.
  - Lệnh tạm dừng / đóng băng khẩn cấp hồ sơ (*Freeze Claim*) khi phát hiện tranh chấp hoặc chủ kho xuất hiện.
  - Yêu cầu kết xuất nhật ký đối soát hồ sơ.
- **Luồng nhận VỀ từ Process 0 (Outflows):**
  - Danh sách hồ sơ tử tuất / mất tích đang chờ thẩm định (`CLAIM_PENDING`).
  - Tệp scan Giấy chứng tử / Quyết định Tòa án độ phân giải cao hiển thị trên bộ xem PDF chuyên dụng (*PDF Viewer có Zoom/Rotate*).
  - Thẻ đối soát thông tin nhân thân CCCD của chủ kho và chuỗi mã băm toàn vẹn `manifest_hash`.
  - Kết quả kiểm tra tính toàn vẹn di chúc số (*Tamper-proof integrity check*).
  - Báo cáo lịch sử kiểm toán hồ sơ và dấu vết thao tác.

#### 4. Beneficiary (Người thụ hưởng di sản số):

- **Luồng gửi VÀO Process 0 (Inflows):**
  - Mã xác thực liên kết bảo mật một lần (*One-time secure token*) nhận từ email.
  - Dữ liệu định danh eKYC: Ảnh chụp 2 mặt thẻ CCCD gắn chip và luồng video quét khuôn mặt sống 3D Liveness qua webcam.
  - Yêu cầu tải gói dữ liệu tài sản được thừa kế.
  - Chữ ký số xác nhận biên bản bàn giao di sản số.
  - Văn bản điện tử tuyên bố từ chối nhận di sản theo Điều 620 BLDS 2015 kèm mã xác thực OTP email.
- **Luồng nhận VỀ từ Process 0 (Outflows):**
  - Email thông báo quyền thừa kế di sản kèm liên kết truy cập bảo mật một lần.
  - Thông báo kết quả đối soát eKYC sinh trắc học thành công.
  - Bản mã dữ liệu tài sản (`Ciphertext` + `IV`) kèm khóa bọc ngoài `encrypted_asset_dek`.
  - Mảnh khóa Verifier (đã được Notary giải phóng) kết hợp với Mảnh khóa System để phục hồi Master Key tại RAM trình duyệt.
  - Tệp PDF/A Biên bản bàn giao di sản số có mã QR tra cứu tính toàn vẹn và chữ ký số công chứng theo Điều 15 Luật Giao dịch điện tử 2023.

#### 5. System Administrator (Quản trị viên an ninh & RBAC):

- **Luồng gửi VÀO Process 0 (Inflows):**
  - Lệnh thiết lập tham số hệ thống, chu kỳ DMS, chính sách phân quyền RBAC.
  - Lệnh khóa tạm thời hoặc mở khóa tài khoản có dấu hiệu vi phạm an ninh / tấn công brute-force.
  - Yêu cầu trích xuất sổ cái kiểm toán WORM phục vụ thanh tra hoặc cung cấp chứng cứ cho Tòa án.
  - Cấu hình kết nối API của các dịch vụ bên thứ ba.
- **Luồng nhận VỀ từ Process 0 (Outflows):**
  - Báo cáo sổ cái kiểm toán WORM bất biến với chuỗi liên kết Hash-chain không thể chỉnh sửa.
  - Chỉ số sức khỏe, hiệu năng và trạng thái hoạt động của tiến trình nền `DmsBackgroundWorker`.
  - Cảnh báo an ninh mạng tức thời: Phát hiện tấn công Brute-force, IDOR, lỗi xác thực JWT.
  - Báo cáo tổng hợp số lượng giao dịch, dung lượng lưu trữ và tình trạng hệ thống.

---

### 3.3. Đặc tả Chi tiết Luồng Dữ liệu của 6 Dịch vụ Bên ngoài (6 External Services Dataflow)

1. **Google OpenID Connect (OIDC):**

   - **Inflow:** ID Token (JWT) có chữ ký số của Google chứa định danh cố định `sub` (*Subject Identifier*), email, họ tên và ảnh đại diện.
   - **Outflow:** Yêu cầu ủy quyền xác thực tài khoản (*Auth Request*) kèm `client_id`, `redirect_uri` và `scopes: ["openid", "profile", "email"]`.
   - *Tài liệu tham chiếu:* [Google OpenID Connect Reference](https://developers.google.com/identity/openid-connect/reference?hl=vi)
2. **SePay Bank Hub:**

   - **Inflow:** Webhook `POST` thông báo biến động số dư tài khoản ngân hàng (gồm mã giao dịch, số tiền chuyển, chiều tiền vào `transferType == "in"`, nội dung chuyển khoản chứa mã hóa đơn `LV[0-9]{6}`, mã `referenceCode` đối soát chống trùng lặp Idempotency).
   - **Outflow:** Yêu cầu khởi tạo hóa đơn thanh toán gói dịch vụ lưu trữ kho di sản (kèm thông tin gói cước, số tiền VND và mã thanh toán).
   - *Tài liệu tham chiếu:* [SePay Developer Docs](https://developer.sepay.vn/vi)
3. **Email & SMS Gateway (MailKit SMTP thực tế & Twilio API):**

   - **Inflow:** Trạng thái chuyển phát thông báo (*Delivery Status: Sent, Bounced, Failed*).
   - **Outflow:** Lệnh phát tán email cảnh báo Dead Man's Switch dồn dập (4 cấp độ theo hàng đợi Background Queue có retry), email chứa mã xác thực OTP, email chứa link nhận di sản một lần; (mở rộng: Lệnh gửi tin nhắn SMS cảnh báo khẩn cấp qua Twilio).
   - *Tài liệu tham chiếu:* [MimeKit Docs](https://mimekit.net/docs/html/Introduction.htm), [MailKit GitHub](https://github.com/jstedfast/MailKit), [Twilio SMS Guidelines for Vietnam](https://www.twilio.com/en-us/guidelines/vn/sms)
4. **Private Object Storage (Cloudflare R2):**

   - **Inflow:** URL truy cập bảo mật có thời hạn (*Presigned URL 5–15 phút*) và mã băm toàn vẹn ETag / SHA-256 của tệp tin.
   - **Outflow:** Tệp scan Giấy chứng tử số gốc, tệp video 15s webcam tuyên thệ minh mẫn, bản mã tài sản (*Ciphertext*) đẩy vào Private Bucket có kiểm soát quyền truy cập tại Backend (Zero egress fees).
   - *Tài liệu tham chiếu:* [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
5. **Web3 Provider (MetaMask EIP-4361 & Polygon/Ethereum RPC):**

   - **Inflow:** Chữ ký cryptographic off-chain chứng minh quyền kiểm soát địa chỉ ví tiền mã hóa (*Sign-in with Ethereum - SIWE*); (mở rộng: Transaction Hash và Block Number xác nhận giao dịch ghi băm on-chain).
   - **Outflow:** Chuỗi thông điệp SIWE có cấu trúc (*Domain, Address, Nonce, ExpirationTime*); (mở rộng: Dữ liệu băm của phiên bản di chúc cần neo mốc thời gian).
   - *Tài liệu tham chiếu:* [EIP-4361 Standard](https://eips.ethereum.org/EIPS/eip-4361), [SIWE Docs](https://docs.login.xyz/), [MetaMask Docs](https://docs.metamask.io/)
6. **Third-Party eKYC Service (VNPT eKYC / FPT.AI SDK):**

   - **Inflow:** Kết quả bóc tách OCR số CCCD 12 số, họ tên, ngày sinh, quê quán; Điểm tin cậy khuôn mặt sống (*Liveness Score >= 85%*); Tỷ lệ trùng khớp khuôn mặt (*Face Match Confidence*).
   - **Outflow:** Tệp ảnh chụp 2 mặt thẻ CCCD gắn chip và luồng video quét khuôn mặt trực tiếp qua webcam trình duyệt.
   - *Tài liệu tham chiếu:* [FPT.AI eKYC SDK](https://docs.fpt.ai/docs/vi/vision/documentation/sdk-ekyc/), [VNPT eKYC AI](https://vnptai.io/ekyc/vi)

---

## 4. CÁC LUỒNG NGHIỆP VỤ CHÍNH & BẢN ĐẶC TẢ SWIMLANE (MAIN FLOWS)

### 4.1. Luồng 1: Google OpenID Connect (OIDC) — Đăng nhập & Khởi tạo tài khoản

- **Bước 1 (Client):** Người dùng chọn "Đăng nhập với Google" trên màn hình Login.
- **Bước 2 (Google OAuth 2.0):** Trả về ID Token chứa email, họ tên, avatar của người dùng.
- **Bước 3 (Role Resolution & Identity States):** Backend sử dụng định danh `sub` từ Google OIDC làm khóa liên kết và quản lý 3 trạng thái độc lập của người dùng:
  - *Trạng thái 1 (Xác thực):* Đã đăng nhập thành công qua Google OIDC (Auto-provisioning role `OWNER`/`MEMBER`).
  - *Trạng thái 2 (Xác minh danh tính):* Trạng thái `kyc_status` (`UNVERIFIED` | `PENDING` | `VERIFIED` | `REJECTED`) qua eKYC bên thứ ba.
  - *Trạng thái 3 (Phân quyền):* Quyền truy cập kho/tài sản cụ thể sau khi được chỉ định và thẩm định.
  - *Nguyên tắc:* Đăng nhập Google không tự cấp quyền Admin/Notary hay quyền nhận tài sản và không tự sinh cơ chế khôi phục khóa.
  - *Cơ chế Đa vai trò (Hybrid Identity):* Trường hợp một cá nhân vừa tự tạo kho (`OWNER`) vừa được người thân chỉ định nhận di sản (`BENEFICIARY`), hệ thống cấp cả 2 claims phân quyền và hiển thị thanh chuyển đổi ngữ cảnh làm việc trên Header (*'Két số của tôi' ↔ 'Di sản tôi được hưởng'*).
- **Bước 4 (Client & WebAuthn):** Hệ thống hiển thị modal gợi ý kích hoạt Passkey FIDO2 (vân tay/FaceID). Trình duyệt gọi Web API `navigator.credentials.create()`.
- **Bước 5 (Backend C#):** Lưu `passkey_credential_id` và `public_key` vào CSDL, phát hành cặp JWT Access Token (15 phút) và Refresh Token (7 ngày).
- **Bước 6 (Client):** Lưu Access Token vào bộ nhớ Redux và điều hướng người dùng vào trang Dashboard Overview.

---

### 4.2. Luồng 2 (Đặc trưng nghiệp vụ cốt lõi): Két số cá nhân E2EE & Lập Di chúc số

- **Bước 1 (Làn Owner):** Chủ kho truy cập mục "Kho tài sản", bấm "+ Thêm tài sản mới" (Ví Web3, Mật khẩu, Tài liệu mật).
- **Bước 2 (Làn Web Crypto API):** Trình duyệt tự sinh Khóa mã hóa dữ liệu đối xứng 256-bit AES-GCM (DEK) và vector khởi tạo IV 12 bytes. Mã hóa dữ liệu trực tiếp trong RAM máy khách, chỉ gửi Ciphertext, IV và AuthTag lên CSDL (Nguyên tắc Zero-Knowledge).
- **Bước 3 (Làn Owner):** Khai báo Cây gia đình hạt nhân theo Điều 651 BLDS (Vợ/chồng, Cha/mẹ ruột, Con cái kèm năm sinh).
- **Bước 4 (Làn Rà soát Pháp lý tự động):**
  - *Kiểm tra Điều 612 BLDS:* Khi tích "Tài sản chung vợ chồng", thanh trượt hoặc input `sharePercentage` lập tức bị khóa cứng giá trị tối đa **50.00%**. Nếu người dùng cố tình nhập > 50%, hệ thống báo lỗi viền đỏ và vô hiệu hóa nút "Tiếp tục".
  - *Kiểm tra Điều 644 BLDS:* Quét danh sách con nhỏ (< 18 tuổi) và cha mẹ già. Nếu `share_percentage = 0` (bỏ sót), hệ thống bật Modal Callout màu hổ phách cảnh báo Điều 644 và bắt buộc người dùng tích vào checkbox cam kết: `"[x] Tôi xác nhận đã hiểu rõ quy định Điều 644 BLDS 2015 và cam đoan tự chịu trách nhiệm trước pháp luật"` thì nút "Lưu & Ký số" mới sáng lên.
- **Bước 5 (Làn Owner):** Chỉ định Người thi hành (*Executor*) và Người thụ hưởng (*Beneficiary*) kèm tỷ lệ % thừa kế.
- **Bước 6 (Làn WebRTC Camera):** Trình duyệt bật webcam ghi hình 15 giây chủ kho đọc lời tuyên thệ minh mẫn, tự nguyện theo Điều 630 BLDS. File video được băm mã SHA-256 tạo thành `oath_video_hash`.
- **Bước 7 (Làn Ký số ECDSA):** Toàn bộ di chúc được băm thành `manifest_hash`. Trình duyệt dùng khóa bí mật ECDSA P-256 ký số lên `manifest_hash` theo Điều 23 Luật Giao dịch điện tử 2023.
- **Bước 8 (Làn Phân tách Khóa Shamir):** Khóa Master Key được phân rã thành 3 mảnh khóa độc lập theo thuật toán ngưỡng 2/3 Shamir (Mảnh 1 lưu Server, Mảnh 2 giao Notary khóa, Mảnh 3 mã hóa phong bì gửi Beneficiary).
- **Bước 9 (Làn Hệ thống):** Đóng dấu thời gian Timestamp, kích hoạt kho sang trạng thái `ACTIVE` và khởi động bộ đếm Dead Man's Switch.

---

### 4.3. Luồng 3: Giám sát Sinh tồn (DMS), Xử lý Quá bận, Rollback & Mất tích (Điều 68/71/73 BLDS)

- **Bước 1 (Làn DmsBackgroundWorker):** Tiến trình chạy ngầm C# quét CSDL định kỳ (Demo: 2 phút; Thực tế: 30–90 ngày).
- **Bước 2 (Làn Kiểm tra):** Nếu `Now > LastPingAt + Interval`, tự động chuyển kho sang `GRACE_PERIOD` (14–30 ngày).
- **Bước 3 (Làn Cảnh báo):** Thông báo DMS được gửi qua hàng đợi xử lý nền (Hangfire/Queue) với cơ chế retry. Nếu email thất bại liên tiếp, hệ thống tự động chuyển kênh liên hệ người dự phòng. SMS được coi là tính năng mở rộng.

#### Bảng Cảnh báo DMS 4 Cấp độ:

| Tiêu chí                    | Chế độ Thực tế (Ân hạn 14 ngày)                         | Chế độ Trình diễn (Ân hạn 120 giây)            |
| ----------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Lần 1 (Bắt đầu)** | Ngày 0: Email nhắc nhở nhẹ nhàng cho Owner.                | Giây 30: Báo lần 1.                                 |
| **Lần 2**              | Ngày thứ 3: Email + SMS/Telegram nhắc còn 11 ngày.         | Giây 60: Báo lần 2 + thông báo sớm cho Executor. |
| **Lần 3**              | Ngày thứ 7: Email khẩn + SMS cho Owner & Executor.           | Giây 90: Báo tối hậu thư lần 3.                  |
| **Lần cuối & Khóa**  | Ngày thứ 12: Tối hậu thư (48h). Hết ngày 14: Tạm khóa. | Hết 120 giây: Chuyển`AWAITING_LEGAL_PROOF`.       |

- **Bước 4A (Nhánh Quá bận / Bỏ quên check-in / Hồi phục Rollback):**
  - Chủ kho đi công tác xa hoặc tỉnh dậy sau tai nạn, mở web đăng nhập bằng Passkey sinh trắc học chính chủ.
  - Owner bấm `"⚡ HỦY LỆNH BÁO ĐỘNG — TÔI ĐÃ QUAY LẠI"`. Hệ thống kích hoạt cơ chế Rollback: reset `warning_count = 0`, `last_ping_at = Now`, khôi phục kho về `ACTIVE`, hủy toàn bộ phiên nộp của Executor. Khóa giải mã bảo mật tuyệt đối vì Notary chưa cấp Mảnh khóa 2.
- **Bước 4B (Nhánh Mất liên lạc / Mất tích theo Điều 68 & 71 BLDS):**
  - Hết thời gian ân hạn không có phản hồi, hệ thống khóa tài khoản Owner, chuyển kho sang Tạm khóa (Chờ nộp chứng từ pháp lý) [`AWAITING_LEGAL_PROOF`], mời Executor nộp chứng từ.
  - Trường hợp Mất tích: Sau 02 năm biệt tích tuyên bố mất tích (Điều 68), sau 05 năm tuyên bố đã chết (Điều 71). Executor bắt buộc phải nộp Quyết định có hiệu lực pháp luật của Tòa án nhân dân thay thế cho Giấy chứng tử.

#### Xử lý tình huống Chủ sở hữu đột ngột xuất hiện trở lại (Điều 68, 70, 71, 73 BLDS 2015):

1. **Giai đoạn 1 (Biệt tích 2 - 5 năm, kho ở trạng thái `AWAITING_LEGAL_PROOF` hoặc Bảo lưu mất tích):**Chủ kho đăng nhập bằng Passkey sinh trắc học FIDO2 hoặc quét eKYC khuôn mặt đối chiếu Video 15s. Hệ thống kích hoạt cơ chế Hồi sinh (*Resurrection Rollback*): Đưa kho về trạng thái 'Đang bảo vệ (Bình thường)' [`ACTIVE`], xóa yêu cầu của Executor, thông báo hủy tiến trình cho Notary và Executor. Bảo mật tuyệt đối vì chưa cấp Mảnh khóa 2.
2. **Giai đoạn 2 (Đã tuyên bố chết, Notary đã duyệt, nhưng Beneficiary chưa giải mã):**Chủ kho nộp Quyết định hủy bỏ tuyên bố đã chết (Điều 73 BLDS) hoặc xác thực sinh trắc học khẩn cấp. Hệ thống thu hồi Mảnh khóa Verifier, chuyển trạng thái kho sang Đóng băng khẩn cấp (`EMERGENCY_FROZEN`), ngăn chặn giải mã.
3. **Giai đoạn 3 (Tài sản đã được giải mã):**
   Căn cứ Khoản 1 & 2 Điều 73 BLDS 2015, người trở về yêu cầu trả lại tài sản. Hệ thống cung cấp Báo cáo Nhật ký kiểm toán WORM bất biến làm chứng cứ tố tụng tại Tòa án để thu hồi tài sản thực tế.

---

### 4.4. Luồng 4: Thẩm định Pháp lý & Ma trận Tiêu chí duyệt của Công chứng viên (Notary Review Matrix)

- **Bước 1 (Làn Executor):** Executor đăng nhập Executor Portal, kéo thả bản scan Giấy chứng tử số hoặc Quyết định Tòa án vào Dropzone, nhập số hiệu hộ tịch và ngày cấp. Kho chuyển sang `CLAIM_PENDING`.
- **Bước 2 (Làn Notary Workspace):** Công chứng viên đăng nhập Notary Portal, mở màn hình Split-Screen: Cột trái là PDF Viewer hỗ trợ Zoom/Rotate để soi bản scan chứng từ; cột phải là Thẻ đối soát thông tin nhân thân CCCD và nút kiểm tra tính toàn vẹn `manifest_hash`.
- **Bước 3A (Nhánh Từ chối - Reject):** Notary bấm nút đỏ "Từ chối", hệ thống bật Modal chọn Dropdown lý do chi tiết:
  - *'Bản scan giấy tờ bị mờ, mất góc hoặc không đọc được con dấu mộc đỏ. Vui lòng chụp hoặc quét lại bản rõ nét hơn.'*
  - *'Số CCCD hoặc họ tên trên giấy tờ không trùng khớp với thông tin chủ kho đã đăng ký. Vui lòng kiểm tra lại giấy tờ chính chủ.'*
  - *'Giấy tờ không đủ thẩm quyền pháp lý (Ví dụ: Giấy báo tử của bệnh viện chưa làm thủ tục khai tử tại UBND). Vui lòng nộp Trích lục khai tử hợp lệ.'*
  - *'Quyết định/Bản án của Tòa án chưa có hiệu lực pháp luật hoặc đang trong thời hạn kháng cáo. Vui lòng nộp bản án đã có hiệu lực pháp luật.'*
  - *'Chứng từ có dấu hiệu chỉnh sửa, tẩy xóa hoặc can thiệp bằng phần mềm đồ họa. Hồ sơ bị tạm dừng để thẩm tra xác minh.'*
    *Hệ thống bắt buộc nhập tối thiểu 20 ký tự hướng dẫn sửa đổi bổ sung.*
- **Bước 3B (Nhánh Phê duyệt - Approve):** Bắt buộc Notary tích đủ 4 checkbox kiểm toán trên giao diện trước khi nút xanh "Ký số Phê duyệt" sáng lên:
  1. `[x] Chứng từ hợp pháp (Trích lục khai tử do UBND cấp hoặc Bản án có hiệu lực)`
  2. `[x] Số CCCD và thông tin nhân thân hoàn toàn trùng khớp`
  3. `[x] Manifest_hash nguyên vẹn, không có dấu hiệu can thiệp trái phép`
  4. `[x] Tư cách Người thi hành (Executor) đúng thẩm quyền chỉ định`
- **Bước 4 (Làn Ký duyệt & Mở khóa):** Notary nhập mật khẩu/mã PIN ký số cá nhân để phê duyệt -> Backend giải phóng Mảnh khóa Verifier (*Shamir Share 2*). Kho chuyển sang trạng thái `APPROVED`.

---

### 4.5. Luồng 5: Tiếp nhận Di sản, eKYC Sinh trắc học & Xử lý Từ chối (Điều 620/622 BLDS)

- **Bước 1 (Làn Thông báo):** Hệ thống gửi email chứa liên kết bảo mật một lần đến từng Beneficiary.
- **Bước 2 (Làn Beneficiary eKYC):** Người thừa kế mở link, đăng nhập và bắt buộc thực hiện eKYC sinh trắc học: Chụp 2 mặt CCCD gắn chip và quét khuôn mặt sống 3D Liveness qua webcam.
- **Bước 3 (Làn So khớp):** AI bóc tách OCR số CCCD so khớp với `national_id_number` đã khai báo. Face Match Score giữa ảnh CCCD và webcam liveness bắt buộc đạt **>= 85.00%**. Nếu thực hiện sai quá 3 lần, tài khoản sẽ bị khóa 24h.
- **Bước 4A (Nhánh Người nhận ưu tiên 1 Từ chối nhận di sản - Điều 620 BLDS):**
  - Căn cứ Điều 620 BLDS 2015: Người thừa kế bấm nút "Tôi muốn từ chối nhận di sản", hệ thống hiển thị văn bản từ chối, cảnh báo mất quyền và cấm tự ý bàn giao/chỉ định người ngoài nhận thay, bắt buộc xác thực OTP qua email.
  - *Xử lý tự động:* Sau khi xác nhận từ chối, hệ thống tự động thu hồi quyền của Người 1, chuyển giao quyền thừa kế cho Người dự phòng (*Fallback Beneficiary - Tầng 2*).
  - *Di sản vô chủ:* Nếu không có người dự phòng, áp dụng Điều 622 BLDS 2015: Chuyển kho vào trạng thái Lưu trữ lạnh (*Cold Archive*) chờ Tòa án giải quyết.
- **Bước 4B (Nhánh Nhận bàn giao thành công):**
  - Hệ thống kết hợp Mảnh khóa Verifier + Mảnh khóa System (ngưỡng 2/3 Shamir) để phục hồi Master Key.
  - Trình duyệt Beneficiary dùng Master Key giải mã trực tiếp dữ liệu trong RAM (Private Key, Seed Phrase, Mật khẩu).
  - Beneficiary ký số xác nhận đã nhận bàn giao.
  - Hệ thống xuất file PDF/A Biên bản bàn giao di sản số có mã QR tra cứu tính toàn vẹn và chữ ký số công chứng theo Điều 15 Luật Giao dịch điện tử 2023. Kho chuyển sang trạng thái `CLOSED` vĩnh viễn.

---

## 5. MÔ HÌNH USE CASE & BẢNG PHÂN RÃ CHỨC NĂNG (USE CASE MODEL & MoSCoW MATRIX)

### 5.1. Bảng Phân Rã Use Case Chuẩn UML 2.5 (19 Use Cases)

| Mã UC          | Tên Use Case                                                     | Tác nhân chính       | Gói chức năng     | Quan hệ UML                          | MoSCoW         |
| --------------- | ----------------------------------------------------------------- | ----------------------- | -------------------- | ------------------------------------- | -------------- |
| **UC-01** | Đăng nhập & Xác thực Passkey                                 | All Roles               | Auth Package         | -                                     | **MUST** |
| **UC-02** | Đăng ký & Tự tạo tài khoản Google OAuth 2.0                | Vault Owner             | Auth Package         | -                                     | **MUST** |
| **UC-03** | Quản lý Tài sản số E2EE                                      | Vault Owner             | Vault Management     | -                                     | **MUST** |
| **UC-04** | Khai báo Cây Gia đình Hạt nhân                              | Vault Owner             | Legal Compliance     | -                                     | **MUST** |
| **UC-05** | Rà soát Pháp lý Điều 612 & Điều 644                       | System                  | Legal Compliance     | `<<extend>>` bởi Cảnh báo Đ.644 | **MUST** |
| **UC-06** | Quay Video Tuyên thệ 15s Minh mẫn Điều 630                   | Vault Owner             | Legal Compliance     | -                                     | **MUST** |
| **UC-07** | Ký số & Niêm phong Di chúc ECDSA P-256                        | Vault Owner             | Will Sealing         | `<<include>>` UC-05, UC-06          | **MUST** |
| **UC-08** | Phân rã Mảnh khóa Shamir 2/3                                  | System                  | Cryptographic Engine | -                                     | **MUST** |
| **UC-09** | Điểm danh Sinh tồn ('⚡ I am Alive')                           | Vault Owner             | DMS Package          | -                                     | **MUST** |
| **UC-10** | Quét ngầm & Kích hoạt Thời gian Ân hạn                     | System BackgroundWorker | DMS Package          | -                                     | **MUST** |
| **UC-11** | Hồi phục / Hủy Báo động Khẩn cấp (Rollback)               | Vault Owner             | DMS Package          | -                                     | **MUST** |
| **UC-12** | Nộp Chứng từ Tử tuất / Quyết định Tòa án Điều 68/71   | Digital Executor        | Claim Package        | -                                     | **MUST** |
| **UC-13** | Đối soát Hồ sơ trên Màn hình Split-Screen                 | Legal Verifier / Notary | Verification Package | -                                     | **MUST** |
| **UC-14** | Phê duyệt Mở thừa kế & Giải phóng Khóa Verifier           | Legal Verifier / Notary | Verification Package | -                                     | **MUST** |
| **UC-15** | Từ chối Hồ sơ & Yêu cầu Bổ sung                            | Legal Verifier / Notary | Verification Package | -                                     | **MUST** |
| **UC-16** | eKYC Sinh trắc học Nhận Di sản                                | Beneficiary             | Handover Package     | -                                     | **MUST** |
| **UC-17** | Phục hồi Khóa Shamir 2/3 & Giải mã Tài sản E2EE            | Beneficiary             | Handover Package     | -                                     | **MUST** |
| **UC-18** | Từ chối Nhận Di sản Điều 620 & Kích hoạt Dự phòng       | Beneficiary / System    | Handover Package     | -                                     | **MUST** |
| **UC-19** | Xuất Biên bản Bàn giao PDF/A có mã QR Điều 15 Luật GDĐT | Beneficiary / Notary    | Reporting Package    | -                                     | **MUST** |

---

### 5.2. Đặc tả Chi tiết 3 Use Case Trọng tâm

#### Đặc tả UC-07: Ký số & Niêm phong Di chúc

- **Mô tả:** Chủ kho thực hiện băm manifest danh mục tài sản và dùng khóa ECDSA P-256 ký số xác nhận ý chí cuối cùng.
- **Tác nhân:** Vault Owner.
- **Tiền điều kiện:** Kho ở trạng thái thiết lập, đã thêm tài sản và hoàn tất video tuyên thệ.
- **Luồng sự kiện chính:**
  1. Hệ thống tổng hợp manifest băm SHA-256;
  2. Owner xác nhận nội dung;
  3. Trình duyệt gọi khóa bí mật ký số;
  4. Hệ thống lưu chữ ký và timestamp.
- **Luồng ngoại lệ Điều 644:** Nếu rà soát phát hiện vi phạm suất thừa kế bắt buộc, hệ thống yêu cầu tích checkbox cam kết trước khi cho phép ký.
- **Hậu điều kiện:** Kho chuyển sang trạng thái `ACTIVE`, kích hoạt DMS.

#### Đặc tả UC-14: Phê duyệt Mở thừa kế & Giải phóng Khóa Verifier

- **Mô tả:** Công chứng viên thẩm định tính pháp lý của hồ sơ tử tuất và ký duyệt để giải phóng mảnh khóa thứ 2.
- **Tác nhân:** Legal Verifier / Notary.
- **Tiền điều kiện:** Kho ở trạng thái `CLAIM_PENDING`, Executor đã nộp chứng từ.
- **Luồng sự kiện chính:**
  1. Notary xem hồ sơ Split-screen;
  2. Kiểm tra tính toàn vẹn `manifest_hash`;
  3. Tích chọn đủ 4 tiêu chí phê duyệt;
  4. Nhập mã PIN ký duyệt.
- **Tiêu chí phê duyệt:** Chứng từ hợp pháp, CCCD trùng khớp, Manifest nguyên vẹn, Executor đúng thẩm quyền.
- **Hậu điều kiện:** Kho chuyển sang trạng thái `APPROVED`, mảnh khóa Verifier được giải phóng.

#### Đặc tả UC-18: Từ chối Nhận Di sản Điều 620 & Kích hoạt Fallback

- **Mô tả:** Xử lý tình huống người thừa kế ưu tiên từ chối nhận di sản theo quy định pháp luật.
- **Tác nhân:** Beneficiary.
- **Tiền điều kiện:** Kho ở trạng thái `APPROVED`, Beneficiary đã xác thực eKYC.
- **Luồng chính:**
  1. Beneficiary chọn "Từ chối nhận";
  2. Hệ thống cảnh báo hệ quả pháp lý;
  3. Xác thực OTP qua email;
  4. Chuyển quyền thừa kế sang Fallback Tier 2 hoặc Cold Archive Điều 622 nếu không có người dự phòng.
- **Hậu điều kiện:** Quyền tiếp cận của người cũ bị thu hồi, người dự phòng nhận thông báo mới.

---

## 6. CÔNG NGHỆ, KỸ THUẬT THỰC HIỆN & YÊU CẦU PHI CHỨC NĂNG (NFRs)

### 6.1. Phạm vi Công nghệ Tích hợp

- **Phạm vi Cốt lõi (Core Capstone Scope):** Google OIDC + SePay Test Mode (VietQR) + MailKit SMTP thực tế + Cloudflare R2 Private Storage + Third-party eKYC SDK (FPT.AI / VNPT).
- **Tính năng Mở rộng (Extended Scope):** Twilio SMS (Vietnam Guidelines) + Neo dấu vết băm tài liệu lên Blockchain (SIWE Docs & MetaMask Docs).

### 6.2. Chiến lược Tối ưu Chi phí & Tận dụng Tài nguyên

- Tận dụng Google OAuth 2.0 tự động sinh tài khoản.
- Đẩy toàn bộ chi phí tính toán mã hóa AES-GCM về Web Crypto API máy khách (0đ server CPU).
- Tận dụng Cloudflare R2 lưu trữ bản mã với chính sách **Zero Egress Fees**.
- Tích hợp SePay VietQR cá nhân tự động khớp giao dịch, không tốn phí duy trì cổng thanh toán doanh nghiệp.

### 6.3. Quy định Lưu trữ & Bảo mật

- **Kiến trúc R2:** Lưu trữ bản mã (`Ciphertext`) và chứng cứ pháp lý (video/ảnh) trong bucket riêng tư, truy cập qua Presigned URL có thời hạn 5–15 phút.
- **Tính minh bạch:** Dữ liệu eKYC/Giấy chứng tử được bên thứ ba (OCR/Liveness) và Notary đọc để xử lý; dữ liệu tài sản giữ nguyên Zero-Knowledge.
- **Khả năng demo:** Hỗ trợ công tắc Demo Mode chuyển chu kỳ kiểm tra xuống 2 phút để biểu diễn trước Hội đồng chấm thi.

---

## 7. MÔ HÌNH DỮ LIỆU (3NF ERD & STATE MACHINE)

### 7.1. Từ Điển Dữ Liệu 11 Bảng (Third Normal Form - 3NF)

1. **`Users` (Thông tin tài khoản & Định danh cá nhân):**

   - `id`: UUID (PK)
   - `email`: NVARCHAR(255) (UQ)
   - `full_name`: NVARCHAR(150)
   - `national_id_number`: VARCHAR(20) (NULL) - CCCD 12 số sau eKYC
   - `phone_number`: VARCHAR(20) (NULL)
   - `role`: VARCHAR(30) (`OWNER`, `BENEFICIARY`, `EXECUTOR`, `NOTARY`, `ADMIN`)
   - `passkey_credential_id`: VARCHAR(255) (NULL)
   - `passkey_public_key`: NVARCHAR(MAX) (NULL)
   - `is_active`: BIT (DEFAULT 1)
   - `created_at`: DATETIME2
2. **`Vaults` (Két sắt số di sản):**

   - `id`: UUID (PK)
   - `owner_id`: UUID (FK -> Users.id)
   - `vault_name`: NVARCHAR(150)
   - `status`: VARCHAR(30) (Theo ma trận 8 trạng thái)
   - `manifest_hash`: VARCHAR(64) - SHA-256 niêm phong
   - `owner_signature`: NVARCHAR(MAX) - Chữ ký ECDSA P-256
   - `oath_video_url`: NVARCHAR(500) (NULL)
   - `oath_video_hash`: VARCHAR(64) (NULL)
   - `sealed_at`: DATETIME2 (NULL)
   - `created_at`: DATETIME2
3. **`DigitalAssets` (Tài sản số trong kho):**

   - `id`: UUID (PK), `vault_id`: UUID (FK), `title`: NVARCHAR(150), `created_at`: DATETIME2
   - `asset_type`: VARCHAR(30) (`CRYPTO_WALLET`, `CREDENTIAL`, `DOCUMENT`, `SECRET_NOTE`)
   - `encrypted_payload`: NVARCHAR(MAX) - Ciphertext (AES-256-GCM)
   - `initialization_vector`: VARCHAR(32), `auth_tag`: VARCHAR(32)
4. **`FamilyProfiles` (Gia đình hạt nhân & Rà soát Điều 612/644):**

   - `id`: UUID (PK), `vault_id`: UUID (FK, UQ 1:1), `marital_status`: VARCHAR(30), `has_marital_property`: BIT
   - `spouse_info_json`, `parents_info_json`, `minor_children_json`: NVARCHAR(MAX) (NULL)
   - `acknowledged_legal_risk`: BIT - Cam đoan tự chịu trách nhiệm Điều 644
5. **`Beneficiaries` (Danh sách người thụ hưởng):**

   - `id` (PK), `vault_id` (FK), `user_id` (FK, NULL), `full_name`, `email`, `relationship`
   - `national_id_number`: VARCHAR(20) - CCCD khai báo trước để so khớp eKYC
   - `priority_tier`: INT - 1: Primary; 2: Fallback (Điều 620 BLDS)
6. **`AssetAllocations` (Phân bổ tỷ lệ & Khóa phong bì DEK):**

   - `id` (PK), `asset_id` (FK), `beneficiary_id` (FK), `share_percentage`: DECIMAL(5,2)
   - `encrypted_asset_dek`: NVARCHAR(MAX) - Khóa DEK mã hóa bọc ngoài (Envelope)
   - `allocation_status`: `PENDING`, `CLAIMED`, `FORFEITED`, `TRANSFERRED_TO_FALLBACK`
   - `claimed_at`: DATETIME2 (NULL)
7. **`DmsConfigs` (Cấu hình Dead Man's Switch):**

   - `id` (PK), `vault_id` (FK, UQ 1:1), `check_interval_days`, `grace_period_days`, `reminder_frequency_days`
   - `max_warning_count`, `warning_count`, `last_warning_sent_at`, `last_ping_at`, `executor_id` (FK)
8. **`KeyShares` (3 Mảnh khóa phân rã Shamir 2/3):**

   - `id` (PK), `vault_id` (FK), `share_index` (1-3), `encrypted_share_data`, `is_released`
   - `holder_type`: `SYSTEM`, `VERIFIER`, `BENEFICIARY`
9. **`LegalClaims` (Hồ sơ mở thừa kế & Thẩm định):**

   - `id` (PK), `vault_id` (FK), `executor_id` (FK), `verifier_id` (FK, NULL), `verified_at`
   - `death_certificate_url`, `death_record_number`, `verifier_notes`
   - `claim_status`: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`
10. **`AuditLogs` (Nhật ký kiểm toán WORM bất biến):**

    - `id` (BIGINT PK), `vault_id`, `user_id`, `action`, `details_json`, `prev_hash`, `current_hash`, `created_at`
11. **`PaymentTransactions` (Lịch sử thanh toán SePay):**

    - `id` (PK), `user_id` (FK), `vault_id`, `order_code` (UQ), `amount`, `payment_status`, `paid_at`

---

### 7.2. Ma trận Vòng đời trạng thái Kho (Vault State Machine)

Hệ thống quản lý 8 trạng thái cốt lõi:

1. **`ACTIVE` (Đang bảo vệ - Bình thường):** Kho đang hoạt động bình thường, chủ kho điểm danh đúng hạn.
2. **`GRACE_PERIOD` (Đang ân hạn - Chờ điểm danh):** Quá hạn check-in, đang trong thời gian ân hạn 14–30 ngày, gửi cảnh báo dồn dập.
3. **`AWAITING_LEGAL_PROOF` (Tạm khóa - Chờ nộp chứng từ):** Hết ân hạn, kho bị tạm khóa quyền của Owner, chờ Executor nộp chứng từ.
4. **`CLAIM_PENDING` (Đang thẩm định - Notary đang kiểm tra):** Executor đã nộp chứng từ, hồ sơ đang chờ Notary thẩm định Split-screen.
5. **`APPROVED` (Đã phê duyệt - Sẵn sàng mở thừa kế):** Notary đã ký duyệt hợp lệ, Mảnh khóa Verifier đã giải phóng, sẵn sàng bàn giao.
6. **`REJECTED` (Cần bổ sung chứng từ - Bị từ chối):** Notary từ chối do chứng từ mờ/sai số CCCD/giả mạo, yêu cầu nộp lại.
7. **`CLOSED` (Đã hoàn tất bàn giao - Đóng hồ sơ):** 100% tài sản đã được giải mã và nhận bàn giao thành công, niêm phong kho vĩnh viễn.
8. **`UNCLAIMED_LOCKED` (Lưu trữ lạnh - Chờ phán quyết Tòa án):** Quá thời hiệu nhận hoặc người thừa kế từ chối, kho bị khóa vào Lưu trữ lạnh theo Điều 622 BLDS.

---

## 8. PHÂN CÔNG NHÂN SỰ 5 THÀNH VIÊN (100% CÓ FE + BE)

| STT | Họ tên & MSSV                              | Vai trò                 | Backend (ASP.NET Core 8)                      | Frontend (React TypeScript)                                |
| --- | -------------------------------------------- | ------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| 1   | **Nguyễn Thanh Duy (SE203514)**       | FE Lead & Architect      | API lưu Ciphertext`VaultController`        | Dựng Base UI, Redux, Web Crypto, Owner Dashboard          |
| 2   | **Nguyễn Hải Dương (SE203568)**    | Trưởng nhóm & BE Lead | Kiến trúc EF Core, CSDL, API AuditLog       | Admin Dashboard (quản lý user, xem Audit Log)            |
| 3   | **Trịnh Lê Thiên Quân (SE203375)** | BE Developer (Algo)      | DmsBackgroundWorker, Shamir Secret Sharing    | Cấu hình DMS (bộ đếm thời gian, nút check-in)       |
| 4   | **Phan Khánh Duy (SE203465)**         | BE Developer (Legal)     | API LegalClaim, MailKit gửi email cảnh báo | Notary Portal (xem scan chứng tử, duyệt/từ chối)      |
| 5   | **Nguyễn Ngọc Minh Tân (SE203535)** | BE Developer & QA        | Auth Identity/JWT, API nhận di sản Claim    | Beneficiary Portal (nhận tài sản, giải mã, ký nhận) |

---

## 9. PHỤ LỤC: QUY TRÌNH THANH TOÁN SEPAY (`LV[0-9]{6}`)

Hệ thống tạo hóa đơn dịch vụ (độc lập với điều kiện mở thừa kế) -> sinh VietQR kèm mã `LVxxxxxx` -> Khách thanh toán -> SePay gửi Webhook -> Backend kiểm tra tính toàn vẹn (Idempotency, số tiền, mã hóa đơn) -> Cập nhật trạng thái `PAID`.
