# TRƯỜNG ĐẠI HỌC FPT — KHOA KỸ THUẬT PHẦN MỀM
## MÔN HỌC: SWP391 (PHÁT TRIỂN ỨNG DỤNG DOANH NGHIỆP)

---

# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
### PHƯƠNG ÁN 1: LEGAL-TECH & TUÂN THỦ BỘ LUẬT DÂN SỰ 2015
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
1. **Luật Giao dịch điện tử 2023 (Điều 1, 10, 12, 15, 23, 31):**  
   Công nhận thông điệp dữ liệu có giá trị như văn bản, giá trị như bản gốc, và giá trị pháp lý của chữ ký điện tử an toàn.
2. **Bộ luật Dân sự 2015 (Điều 105, 115, 117, 120, 415, 562, 609-662):**  
   Quy định về tài sản, giao dịch dân sự có điều kiện, hợp đồng vì lợi ích người thứ ba, hợp đồng ủy quyền và các quy định về thừa kế.
3. **Bộ luật Tố tụng Dân sự 2015 (Điều 95):**  
   Quy định về giá trị chứng cứ của thông điệp dữ liệu.

### 1.3. Phân định khái niệm: Tài sản số (Digital Assets) vs. Di sản số (Digital Estate)
- **Tài sản số (Điều 105 BLDS 2015):** Tồn tại và thuộc quyền quản lý của chủ sở hữu khi còn sống (*inter vivos*).
- **Di sản số (Điều 612 BLDS 2015):** Chỉ phát sinh tại thời điểm mở thừa kế (Điều 611 BLDS), là phần tài sản số hợp pháp còn lại sau khi thanh toán nghĩa vụ và loại trừ các quyền nhân thân không thể chuyển giao (Điều 25 BLDS).

#### Cơ chế phân loại 3 nhóm dữ liệu trong kho:
- **Nhóm 1: Di sản số có giá trị kinh tế (*Economic Digital Estate*):** Bàn giao quyền sở hữu/kiểm soát (ví crypto, tên miền, tài khoản thương mại).
- **Nhóm 2: Kỷ vật số / Ký ức số (*Digital Mementos*):** Bàn giao lưu niệm cho người thân (ảnh gia đình, thư từ).
- **Nhóm 3: Dữ liệu bảo mật nhân thân (*Confidential Personal Data*):** Tự động tiêu hủy mật mã (*Cryptographic Burn*) để bảo vệ quyền riêng tư cá nhân khi qua đời (Điều 38 BLDS 2015).

---

## 2. BẢN GIẢI TRÌNH GIẢI PHÁP PHÁP LÝ & CƠ CHẾ TUÂN THỦ PHÁP LUẬT DÂN SỰ

### 2.1. Xác lập Bản chất Pháp lý của Giao dịch
Để giải quyết bài toán di chúc điện tử chưa được công nhận trong thực tiễn công chứng và tránh xung đột với Khoản 2 Điều 1 Luật Giao dịch điện tử 2023 cùng các điều kiện hình thức cứng của Bộ luật Dân sự 2015, hệ thống xác lập bản chất pháp lý theo các chế định hợp đồng dân sự hợp pháp:
- **Giao dịch dân sự có điều kiện phát sinh (Điều 120 BLDS 2015):**  
  Sự kiện chủ tài khoản mất liên lạc trong một khoảng thời gian xác định, kết hợp với văn bản xác nhận sự kiện tử tuất hợp pháp, được thỏa thuận là điều kiện phát sinh hiệu lực của việc chuyển giao quyền tiếp cận thông tin cho bên thụ hưởng.
- **Hợp đồng vì lợi ích của người thứ ba (Điều 415 BLDS 2015):**  
  Chủ tài khoản xác lập thỏa thuận với bên quản trị dịch vụ nhằm mục đích: Khi điều kiện xảy ra, người thứ ba (Người thụ hưởng) có quyền trực tiếp yêu cầu tiếp nhận các thông tin, tài liệu và quyền kiểm soát tài sản số mà không cần sự can thiệp của chủ tài khoản.
- **Hợp đồng ủy quyền thực hiện công việc (Điều 562 BLDS 2015):**  
  Người thi hành (Executor) đóng vai trò là bên được ủy quyền đại diện nộp văn bản chứng minh sự kiện tử tuất và giám sát quá trình bàn giao thông tin cho các bên thụ hưởng theo đúng ý chí ban đầu.

### 2.2. Cơ chế Bảo đảm Ý chí Tự nguyện và Năng lực Hành vi Dân sự
- **Chứng cứ ghi nhận trạng thái minh mẫn (Điều 117 và Điều 630 BLDS 2015):**  
  Giao dịch chỉ có hiệu lực khi chủ thể có đầy đủ năng lực nhận thức và làm chủ hành vi, tham gia hoàn toàn tự nguyện, không bị lừa dối, đe dọa hay cưỡng ép. Tại thời điểm xác lập, chủ tài khoản thực hiện bản ghi hình tuyên thệ (15 giây qua webcam) nêu rõ họ tên, ngày sinh và cam đoan tự nguyện làm chứng cứ chứng minh ý chí đích thực.
- **Quyền sửa đổi và thu hồi ý chí (Điều 638 BLDS 2015):**  
  Trong suốt thời gian chủ tài khoản còn hoạt động, quyền định đoạt thuộc về chính chủ thể. Chủ tài khoản có quyền sửa đổi, bổ sung, thay thế hoặc hủy bỏ toàn bộ nội dung ủy quyền bất kỳ lúc nào. Giao dịch xác lập sau cùng sẽ phủ quyết các giao dịch xác lập trước đó.

### 2.3. Phân định Ranh giới Quyền Nhân thân và Quyền Tài sản
- **Bảo vệ quyền nhân thân và bí mật đời tư (Điều 25 và Điều 38 BLDS 2015):**  
  Đời sống riêng tư, bí mật cá nhân là bất khả xâm phạm và được pháp luật bảo vệ. Quyền nhân thân không thể thừa kế. Đối với các dữ liệu thuần túy mang tính nhân thân, chủ thể có quyền định đoạt: Cho phép người thân tiếp cận với tư cách kỷ vật lưu niệm, hoặc yêu cầu cơ chế tiêu hủy vĩnh viễn quyền tiếp cận khi qua đời.
- **Đối với quyền tài sản (Điều 105 và Điều 115 BLDS 2015):**  
  Đối với các dữ liệu gắn liền với giá trị kinh tế (quyền khai thác thương mại, tên miền, thông tin truy cập ví tài sản số): Hệ thống thực hiện chuyển giao quyền tiếp cận thông tin quản trị theo thỏa thuận dân sự.
- **Đối với tài sản phải đăng ký quyền sở hữu:**  
  Đối với bất động sản, tiền gửi tổ chức tín dụng, phương tiện giao thông: Hệ thống chỉ cung cấp Văn bản chỉ dẫn và tài liệu đối soát nguồn gốc. Việc chuyển quyền sở hữu thực tế bắt buộc phải tiến hành thủ tục khai nhận hoặc phân chia di sản thừa kế theo đúng trình tự pháp luật công chứng.

### 2.4. Trách nhiệm Thực hiện Nghĩa vụ Tài sản và Diện Thừa kế Bắt buộc
- **Ưu tiên thanh toán nghĩa vụ tài sản (Điều 615 BLDS 2015):**  
  Việc chuyển giao quyền tiếp cận thông tin tài sản không được nhằm mục đích tẩu tán tài sản hoặc trốn tránh nghĩa vụ tài chính đối với Nhà nước và bên thứ ba. Người tiếp nhận tài sản có trách nhiệm thực hiện các nghĩa vụ tài sản trong phạm vi giá trị tài sản được nhận.
- **Cơ chế tôn trọng diện thừa kế bắt buộc (Điều 644 BLDS 2015):**  
  Quy trình bắt buộc chủ sở hữu phải rà soát thân nhân thuộc diện hưởng thừa kế không phụ thuộc vào nội dung di chúc (Cha, Mẹ, Vợ/Chồng, Con chưa thành niên hoặc Con thành niên mất khả năng lao động). Nếu không phân bổ cho các đối tượng này, hệ thống đưa ra khuyến cáo pháp lý và yêu cầu xác nhận cam kết tự chịu trách nhiệm về tranh chấp dân sự phát sinh.
- **Xử lý di sản không có người nhận thừa kế (Điều 622 BLDS 2015):**  
  Trường hợp quá thời hiệu phân chia mà không có người nhận thừa kế hoặc từ chối nhận di sản, tài sản được niêm phong lưu trữ để phục vụ việc chuyển giao cho Nhà nước theo phán quyết của Tòa án.

### 2.5. Giá trị Chứng cứ và Cơ chế Chuyển đổi Văn bản Pháp lý
- **Giá trị chứng cứ của thông điệp dữ liệu (Điều 95 BLTTDS 2015 & Điều 12 Luật GDĐT 2023):**  
  Toàn bộ gói tài liệu được lưu trữ toàn vẹn, có đóng dấu thời gian xác thực và xác định rõ người khởi tạo được thừa nhận là chứng cứ hợp pháp trước cơ quan xét xử khi phát sinh tranh chấp.
- **Chuyển đổi thông điệp dữ liệu sang văn bản giấy (Điều 15 Luật GDĐT 2023):**  
  Khi người thụ hưởng cần thực hiện thủ tục hành chính tại Ngân hàng, Văn phòng Công chứng hoặc Cơ quan đăng ký đất đai, hệ thống kết xuất Văn bản chuyển đổi từ thông điệp dữ liệu (PDF/A có mã số nhận diện, dấu thời gian và mã QR tra cứu).

---

## 3. PHẠM VI HỆ THỐNG & SƠ ĐỒ NGỮ CẢNH (SCOPE & CONTEXT)

Hệ thống bao gồm 5 phân hệ cốt lõi:
1. **Quản lý kho E2EE (Client-Side AES-256-GCM Vault)**
2. **Giám sát Dead Man's Switch (DmsBackgroundWorker Engine)**
3. **Thẩm định Giấy chứng tử (Notary Portal & Proof of Death)**
4. **Bàn giao di sản số (Shamir Threshold Decryption & Handover)**
5. **Quản trị hệ thống & Kiểm toán (RBAC & WORM Audit Log)**

### 5 Tác nhân chính (Actors):
- **Vault Owner (Chủ kho di sản):** Tạo tài sản số, quay video minh mẫn, ký số di chúc, phản hồi ping định kỳ.
- **Digital Executor (Người thi hành di chúc số):** Nhận thông báo khi chủ kho mất liên lạc; nộp scan Giấy chứng tử số để kích hoạt quy trình thừa kế.
- **Legal Verifier / Notary (Công chứng viên):** Thẩm định Giấy chứng tử, kiểm tra tính toàn vẹn bản gốc di chúc, ký số giải phóng khóa.
- **Beneficiary (Người thụ hưởng):** Nhận thông báo thừa kế, xác thực danh tính (OTP/eKYC), giải mã di sản số và ký nhận.
- **System Administrator (Quản trị viên):** Quản trị tài khoản, giám sát BackgroundWorker và WORM Audit Log.

---

## 4. CÁC LUỒNG NGHIỆP VỤ CHÍNH (MAIN FLOWS)

### 4.1. Luồng 1: Khởi tạo, Quản lý Tài sản số & Thiết lập Di sản số E2EE
1. **Làn Vault Owner:** Đăng nhập hệ thống, truy cập 'Kho tài sản', chọn 'Thêm tài sản mới' (Ví Crypto, Mật khẩu, Tài khoản số, Tài liệu nhạy cảm).
2. **Làn Vault Owner:** Thực hiện chứng thực quyền sở hữu (Ký ví Web3 off-chain qua Metamask EIP-4361 hoặc Google OAuth 2.0).
3. **Làn Trình duyệt (Client-Side Web Crypto):** Tự động sinh khóa đối xứng AES-256-GCM, mã hóa toàn bộ dữ liệu nhạy cảm cục bộ tại máy khách.
4. **Làn Máy chủ (Backend ASP.NET Core & SQL Server):** Tiếp nhận bản mã (Ciphertext) và IV; lưu trữ an toàn theo nguyên tắc Zero-Knowledge (server không bao giờ có Plaintext).
5. **Làn Vault Owner:** Chuyển sang 'Kế hoạch Kế thừa': Chỉ định Beneficiary và Executor; chọn loại tài sản (Riêng hoặc Chung vợ chồng - khóa trần tối đa 50% theo Điều 612 BLDS).
6. **Làn Vault Owner:** Rà soát thân nhân: Nếu bỏ sót diện thừa kế bắt buộc, hệ thống cảnh báo Điều 644 BLDS; Owner tích cam kết tự chịu trách nhiệm.
7. **Làn Vault Owner:** Thực hiện ghi hình 15 giây qua webcam tuyên thệ tự nguyện, minh mẫn theo Điều 630 BLDS.
8. **Làn Trình duyệt & Hệ thống:** Tính mã băm `manifest_hash`, dùng cặp khóa ECDSA ký số lên bản băm (Điều 23 Luật GDĐT 2023). Đóng dấu thời gian, phân tách Master Key thành 3 mảnh Shamir (System, Verifier, Beneficiary), đưa kho vào trạng thái `ACTIVE`.

### 4.2. Luồng 2: Cơ chế Giám sát Sinh tồn (Dead Man's Switch Engine)
1. **Làn Máy chủ (DmsBackgroundWorker):** Tiến trình BackgroundService quét định kỳ CSDL theo chu kỳ interval (Demo: 2 phút; Thực tế: 30-90 ngày).
2. **Làn Máy chủ:** Kiểm tra điều kiện: Nếu `now > last_ping_at + interval`, chuyển trạng thái sang `GRACE_PERIOD` (Thời gian ân hạn).
3. **Làn Máy chủ:** Dùng MailKit gửi email cảnh báo dồn dập tới Vault Owner và cảnh báo sớm cho Digital Executor.
4. **Nhánh phản hồi kịp thời:** Owner đăng nhập, bấm 'Tôi còn hoạt động' -> Hệ thống reset `last_ping_at = now`, khôi phục kho về `ACTIVE`.
5. **Nhánh mất liên lạc:** Hết thời gian ân hạn mà Owner không phản hồi -> Hệ thống khóa vĩnh viễn quyền truy cập của Owner, chuyển sang `AWAITING_LEGAL_PROOF`, gửi thông báo chính thức cho Executor nộp Giấy chứng tử.

### 4.3. Luồng 3: Thẩm định Pháp lý & Bàn giao Di sản số (Two-Man Rule Handover)
1. **Làn Digital Executor:** Đăng nhập cổng Executor Portal, nộp scan Giấy chứng tử/Trích lục khai tử kèm số hiệu, ngày cấp, nơi cấp. Kho chuyển sang `CLAIM_PENDING`.
2. **Làn Legal Verifier / Notary:** Đăng nhập Notary Portal, đối soát tính hợp lệ của văn bản chứng tử và tra soát mã băm `manifest_hash` bảo đảm tính toàn vẹn bản gốc di chúc.
   - *Nhánh từ chối:* Nhập lý do từ chối -> Kho chuyển về `REJECTED`, thông báo cho Executor nộp lại.
   - *Nhánh phê duyệt:* Bấm 'Phê duyệt', nhập mật khẩu xác nhận cấp phép mở khóa.
3. **Làn Máy chủ:** Ghi nhận chữ ký duyệt của Verifier, giải phóng Mảnh khóa Verifier (Shamir Key Share). Kho chuyển sang `APPROVED`. Gửi email thừa kế đến Beneficiary.
4. **Làn Beneficiary:** Đăng nhập Beneficiary Portal, xác thực OTP / eKYC.
5. **Làn Trình duyệt & Máy chủ:** Kết hợp Mảnh khóa Notary + Mảnh khóa System (ngưỡng 2/3 Shamir) để tái tạo Master Key. Trình duyệt Beneficiary giải mã trực tiếp dữ liệu (Private key, mật khẩu, tài liệu mật).
6. **Làn Beneficiary & Máy chủ:** Beneficiary ký xác nhận đã nhận bàn giao, tải về bản PDF/A có mã QR. Mục tài sản chuyển sang `CLAIMED`. Khi toàn bộ tài sản được nhận, kho chuyển sang `CLOSED`. Ghi vết bất biến vào WORM Audit Log.

### 4.4. Luồng 4: Cơ chế Dự phòng 3 Tầng Xử lý Di sản Quá hạn / Vô chủ (Điều 622 BLDS)
1. **Làn Hệ thống:** Khi kho ở trạng thái `APPROVED`, kích hoạt bộ đếm Claim Timeout (Thực tế: 90 ngày; Demo: 2 phút).
2. **Tầng 1 (Fallback Beneficiary):** Nếu Beneficiary từ chối (Điều 620) hoặc quá hạn -> Tự động chuyển quyền giải mã sang Người thụ hưởng dự phòng (`FALLBACK_TRIGGERED`).
3. **Tầng 2 (Digital Executor - Điều 616 BLDS):** Nếu người dự phòng cũng quá hạn -> Giao quyền quản lý tạm thời cho Executor để tìm kiếm thân nhân khác.
4. **Tầng 3 (Di sản vô chủ - Điều 622 BLDS):** Hết thời hiệu mà không có người nhận -> Hệ thống thực thi theo chính sách Owner cấu hình trước:
   - *Chính sách Lưu trữ lạnh (Cold Archive):* Niêm phong vĩnh viễn CSDL chờ chuyển giao cho Nhà nước khi có phán quyết Tòa án.
   - *Chính sách Tiêu hủy mật mã (Cryptographic Burn):* Tự động xóa vĩnh viễn mảnh khóa giải mã (*Key Shredding*) để bảo vệ bí mật đời tư (Điều 38 BLDS).

---

## 5. BẢNG PHÂN RÃ TÍNH NĂNG (MoSCoW MATRIX)

| Mã FR | Nhóm tính năng | Mô tả chi tiết yêu cầu kỹ thuật | Tác nhân | Mức ưu tiên |
|---|---|---|---|---|
| **FR-AUTH-01** | Xác thực & RBAC | Đăng ký, đăng nhập JWT, phân quyền 5 roles (ASP.NET Core Identity). | All | **MUST** |
| **FR-VAULT-01** | Kho E2EE Client | Thêm/sửa tài sản số; trình duyệt mã hóa AES-256-GCM trước khi gửi lên API. | Vault Owner | **MUST** |
| **FR-LEGAL-01** | Cảnh báo Điều 644 | Kiểm tra cây thân nhân, cảnh báo xâm phạm 2/3 suất thừa kế bắt buộc. | Vault Owner | **MUST** |
| **FR-LEGAL-02** | Video Minh mẫn (Đ.630) | Quay video webcam 15s tuyên thệ tự nguyện, băm SHA-256 lưu trữ toàn vẹn. | Vault Owner | **MUST** |
| **FR-SIGN-01** | Ký số Di chúc | Trình duyệt sinh khóa ECDSA (P-256), ký lên manifest_hash (Điều 23 Luật GDĐT). | Vault Owner | **MUST** |
| **FR-DMS-01** | Cấu hình & Worker | Cài đặt chu kỳ kiểm tra (Demo: 2 phút; Thực tế: 30-90 ngày) và DmsBackgroundWorker. | Owner / System | **MUST** |
| **FR-CLAIM-01** | Nộp Chứng từ tử tuất | Executor upload scan Giấy chứng tử kèm số hiệu, ngày cấp (Điều 13 Luật GDĐT). | Executor | **MUST** |
| **FR-NOTARY-01** | Thẩm định & Ký duyệt | Notary đối soát Giấy chứng tử, bấm Phê duyệt và giải phóng mảnh khóa ký duyệt. | Legal Verifier | **MUST** |
| **FR-SHAMIR-01** | Phân chia Bí mật | Tái tạo khóa giải mã theo sơ đồ ngưỡng 2/3 Shamir (System + Notary). | System / Beneficiary | **MUST** |
| **FR-DISP-01** | Giải mã & Ký nhận | Beneficiary nhận khóa giải mã di sản số trên trình duyệt và ký xác nhận bàn giao. | Beneficiary | **MUST** |
| **FR-DISP-02** | Di sản vô chủ (Đ.622) | Chuyển quyền cho Người dự phòng; nếu quá hạn thì chuyển vào Cold Archive. | System | **SHOULD** |
| **FR-REPORT-01** | Xuất Dossier PDF/A | Kết xuất hồ sơ di sản số có mã QR và chữ ký số phục vụ đối soát công chứng ngoài đời. | Notary / Beneficiary | **SHOULD** |

---

## 6. YÊU CẦU PHI CHỨC NĂNG (NFRs) & CÔNG NGHỆ
- **Bảo mật:** Zero-Knowledge (Database tuyệt đối không lưu Plaintext mật khẩu/private key); chống IDOR; Rate limiting.
- **Hiệu năng:** Thời gian mã hóa client ≤ 1.0s, API phản hồi ≤ 800ms.
- **Demo Mode:** Công tắc chuyển chu kỳ kiểm tra xuống 2 phút để demo trước Hội đồng chấm thi.
- **Tech Stack:**
  - Frontend: React 19 (TypeScript), Tailwind CSS v4, Redux Toolkit, Web Crypto API.
  - Backend: ASP.NET Core 8 Web API, Entity Framework Core 8.
  - Database: SQL Server Express / Azure SQL.
  - Dịch vụ ngoài: Cloudinary (Scan Giấy chứng tử & Video tuyên thệ), MailKit (Gmail SMTP gửi cảnh báo khẩn).

---

## 7. VÒNG ĐỜI TRẠNG THÁI KHO (VAULT LIFECYCLE)

```
[ACTIVE] 
   │ (Hết interval, không ping)
   ▼
[GRACE_PERIOD] 
   │ (Hết thời gian ân hạn)
   ▼
[AWAITING_LEGAL_PROOF] 
   │ (Executor nộp Giấy chứng tử)
   ▼
[CLAIM_PENDING]
   ├─── (Notary từ chối) ───► [REJECTED] (Chờ nộp lại)
   │ (Notary phê duyệt)
   ▼
[APPROVED]
   ├─── (Tất cả Beneficiary đã nhận) ───► [CLOSED]
   │ (Quá hạn 90 ngày / Từ chối)
   ▼
[FALLBACK_TRIGGERED]
   │ (Người dự phòng quá hạn)
   ▼
[UNCLAIMED_LOCKED] ──► (Cold Archive / Cryptographic Burn)
```

---

## 8. PHÂN CÔNG NHÂN SỰ (100% FE + BE)

| STT | Họ tên & MSSV | Vai trò chính | Backend (ASP.NET Core 8) | Frontend (React TS) |
|---|---|---|---|---|
| 1 | **Nguyễn Thanh Duy (SE203514)** | FE Lead & Architect | API lưu Ciphertext `VaultController` | Dựng Base UI, Redux, Web Crypto, Owner Dashboard |
| 2 | **Nguyễn Hải Dương (SE203568)** | Trưởng nhóm & BE Lead | Kiến trúc EF Core, CSDL, API AuditLog | Admin Dashboard (Quản lý User, xem Audit Log) |
| 3 | **Trịnh Lê Thiên Quân (SE203375)** | BE Developer (Algo) | DmsBackgroundWorker, Shamir Secret Sharing | Cấu hình DMS (Bộ đếm thời gian, nút check-in) |
| 4 | **Phan Khánh Duy (SE203465)** | BE Developer (Legal) | API LegalClaim, MailKit gửi email cảnh báo | Notary Portal (Xem scan chứng tử, duyệt/từ chối) |
| 5 | **Nguyễn Ngọc Minh Tân (SE203535)** | BE Developer & QA | Auth Identity/JWT, API nhận di sản Claim | Beneficiary Portal (Nhận tài sản, giải mã, ký nhận) |
