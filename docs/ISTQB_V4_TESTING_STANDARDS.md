# HỆ THỐNG QUẢN LÝ DI SẢN SỐ & BÀN GIAO THỪA KẾ (LEGACYVAULT)

## TÀI LIỆU QUY CHUẨN KIỂM THỬ CHUẨN MỰC THEO ISTQB v4.0

*(Test Policy, Test Strategy, Test Techniques & Defect Management Guidelines)*

---

- **Dự án:** LegacyVault — Digital Asset Vault & Estate Handover System
- **Mã môn học:** SWP391 (Phát triển Ứng dụng Doanh nghiệp)
- **Chuẩn tham chiếu:**
  1. *Foundations of Software Testing - ISTQB Certification* (Dorothy Graham, Rex Black, Erik van Veenendaal, Isabel Evans).
  2. *ISTQB Certified Tester Foundation Level (CTFL) Syllabus v4.0 (2023)*.
  3. *Hiến chương 31 Quy tắc Kỹ thuật Dự án LegacyVault (`AGENTS.md`)*.

---

# MỤC LỤC

1. [CHƯƠNG 1: NỀN TẢNG KIỂM THỬ &amp; 7 NGUYÊN LÝ CỐT LÕI (CTFL v4.0)](#chương-1-nền-tảng-kiểm-thử--7-nguyên-lý-cốt-lõi-ctfl-v40)
2. [CHƯƠNG 2: 4 CẤP ĐỘ KIỂM THỬ &amp; CÁC LOẠI KIỂM THỬ (TEST LEVELS &amp; TYPES)](#chương-2-4-cấp-độ-kiểm-thử--các-loại-kiểm-thử-test-levels--types)
3. [CHƯƠNG 3: KIỂM THỬ TĨNH (STATIC TESTING) &amp; QUY CHUẨN REVIEW HÌNH THỨC](#chương-3-kiểm-thử-tĩnh-static-testing--quy-chuẩn-review-hình-thức)
4. [CHƯƠNG 4: BỘ KỸ THUẬT THIẾT KẾ KIỂM THỬ THỰC CHIẾN (TEST DESIGN TECHNIQUES)](#chương-4-bộ-kỹ-thuật-thiết-kế-kiểm-thử-thực-chiến-test-design-techniques)
   - 4.1. Kỹ thuật Hộp đen (Black-box Techniques - K3)
   - 4.2. Kỹ thuật Hộp trắng (White-box Techniques - K3)
   - 4.3. Kỹ thuật Dựa trên Kinh nghiệm (Experience-based Techniques)
5. [CHƯƠNG 5: QUẢN TRỊ KIỂM THỬ, RỦI RO &amp; VÒNG ĐỜI KHIẾM KHUYẾT (TEST MANAGEMENT)](#chương-5-quản-trị-kiểm-thử-rủi-ro--vòng-đời-khiếm-khuyết-test-management)
   - 5.1. Phân định Rủi ro Sản phẩm (Product Risks) vs Rủi ro Dự án (Project Risks)
   - 5.2. Vòng đời Khiếm khuyết Chuẩn IEEE 829 & ISO 29119
   - 5.3. Mẫu Báo cáo Sự cố (Test Incident Report Template)
   - 5.4. Tiêu chuẩn Đầu vào & Đầu ra (Entry & Exit Criteria / DoD)
6. [CHƯƠNG 6: CÔNG CỤ TỰ ĐỘNG HÓA KIỂM THỬ &amp; CI/CD PIPELINE](#chương-6-công-cụ-tự-động-hóa-kiểm-thử--cicd-pipeline)

---

# CHƯƠNG 1: NỀN TẢNG KIỂM THỬ & 7 NGUYÊN LÝ CỐT LÕI (CTFL v4.0)

## 1.1. Bản chất của Kiểm thử trong Hệ thống LegacyVault

Kiểm thử phần mềm không chỉ là hành động chạy code để xem có lỗi hay không, mà là một **quy trình xuyên suốt toàn bộ vòng đời phát triển (SDLC)** bao gồm cả hoạt động tĩnh (Static Testing - Review tài liệu SRS, thiết kế mật mã) và hoạt động động (Dynamic Testing - Thực thi test cases trên code).

Mục tiêu tối thượng của kiểm thử trong dự án LegacyVault:

1. Xác định lỗi (Defects) để ngăn chặn thảm họa rò rỉ dữ liệu di sản.
2. Đo lường chất lượng hệ thống theo tiêu chuẩn ISO/IEC 25010.
3. Cung cấp chứng cứ pháp lý xác thực rằng phần mềm tuân thủ Điều 609-662 Bộ luật Dân sự 2015 và Luật Giao dịch điện tử 2023.

---

## 1.2. Ánh xạ 7 Nguyên Lý Kiểm Thử Cốt Lõi vào Dự án LegacyVault

|     STT     | Nguyên lý ISTQB v4.0                                                                                                                                              | Diễn giải Chuẩn mực                                                                                                                                                                              | Ứng dụng Thực chiến trong LegacyVault                                                                                                                                                                                                                      |
| :---------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Testing shows the presence of defects, not their absence** *(Kiểm thử chỉ ra sự hiện diện của lỗi, không thể chứng minh phần mềm hết lỗi)* | Dù chạy hàng trăm bài test pass 100%, ta chỉ chứng minh được các kịch bản đó không phát sinh failure, chứ không thể kết luận phần mềm tuyệt đối an toàn 100%.            | Đội ngũ không được chủ quan sau khi test pass; hệ thống luôn phải có tầng phòng thủ chiều sâu (Defense-in-depth), bọc`GlobalErrorBoundary` và Audit Logs truy vết sự cố.                                                              |
| **2** | **Exhaustive testing is impossible** *(Kiểm thử kiệt quệ là bất khả thi)*                                                                            | Không thể kiểm thử toàn bộ mọi giá trị đầu vào (ví dụ: không thể test hết$2^{256}$ giá trị băm SHA-256 hay mọi tổ hợp mật khẩu).                                          | Bắt buộc áp dụng kỹ thuật**Phân vùng tương đương (EP)** và **Phân tích giá trị biên (BVA)** để chọn lọc tập dữ liệu đại diện nhỏ nhất có khả năng phát hiện lỗi cao nhất.                                    |
| **3** | **Early testing saves time and money (Shift-Left)** *(Kiểm thử sớm tiết kiệm chi phí và thời gian)*                                                 | Chi phí sửa lỗi tăng theo cấp số nhân nếu phát hiện muộn ở các pha sau (Chi phí sửa lỗi tài liệu là 1x, khi đã code là 10x, khi lên Production là 100x).                     | Áp dụng mô hình**Shift-Left**: Review đặc tả SRS, API Contract và viết Zod validation schemas trước khi bắt tay viết UI Component.                                                                                                          |
| **4** | **Defects cluster together** *(Lỗi có xu hướng tập trung cục bộ - Nguyên lý Pareto 80/20)*                                                         | Khoảng 80% lỗi hệ thống thường ẩn náu trong 20% các module phức tạp nhất.                                                                                                                | Tập trung kiểm thử chuyên sâu vào 2 "điểm nóng" rủi ro cao nhất: Module giải mã khóa dữ liệu trong RAM theo AssetVersions và Module thẩm định chứng từ tử tuất / mất tích của Người xác minh pháp lý.                                                              |
| **5** | **Beware of the pesticide paradox** *(Coi chừng nghịch lý thuốc trừ sâu)*                                                                             | Nếu lặp đi lặp lại cùng một bộ test cases cũ, sâu bọ (lỗi mới) sẽ sinh ra khả năng kháng thuốc và bộ test sẽ không còn tìm ra lỗi mới.                                     | Định kỳ cập nhật, mở rộng bộ test suites sau mỗi Sprint; bổ sung các kịch bản ngoại lệ dựa trên kinh nghiệm (Error Guessing) và thay đổi thực tế pháp lý.                                                                             |
| **6** | **Testing is context dependent** *(Kiểm thử phụ thuộc vào bối cảnh)*                                                                                 | Không có chiến lược kiểm thử chung cho mọi phần mềm. Một trang thương mại điện tử được test khác hoàn toàn với một hệ thống Legal-Tech/Web3.                              | LegacyVault đòi hỏi Zero Data Leakage: Kiểm thử bảo mật (OWASP Top 10), xác thực danh tính E2EE và tính tuân thủ pháp luật được đặt ở mức ưu tiên tuyệt đối (Severity Critical).                                                   |
| **7** | **Absence-of-errors fallacy** *(Quan niệm sai lầm về sự vắng bóng của lỗi)*                                                                         | Một hệ thống dù chạy không có bất kỳ bug phần mềm nào nhưng nếu nó không đáp ứng đúng nhu cầu người dùng và căn cứ pháp luật thì vẫn là một sản phẩm thất bại. | Một két di sản mở khóa hoàn hảo về mặt kỹ thuật nhưng vi phạm Điều 611 (mở khi chủ nhân chưa qua đời) hoặc Điều 644 (tước đoạt quyền thừa kế bắt buộc) thì hệ thống hoàn toàn vô dụng và đối mặt với kiện tụng. |

---

# CHƯƠNG 2: 4 CẤP ĐỘ KIỂM THỬ & CÁC LOẠI KIỂM THỬ (TEST LEVELS & TYPES)

```
       [ Acceptance Testing ]  <--->  Yêu cầu Người dùng & Tuân thủ Pháp lý (SRS/BLDS)
              ^
       [ System Testing ]      <--->  Đặc tả Yêu cầu Hệ thống & Luồng E2E
              ^
       [ Integration Testing ] <--->  Thiết kế Kiến trúc & Giao tiếp Hợp đồng API
              ^
       [ Component Testing ]   <--->  Thiết kế Chi tiết (Schemas, State Machine, Crypto)
```

## 2.1. Bốn Cấp độ Kiểm thử (Test Levels)

### 1. Component Testing (Unit Testing - Kiểm thử Thành phần)

- **Mục tiêu:** Tìm lỗi và kiểm tra tính đúng đắn của từng đơn vị mã nguồn riêng lẻ (tách biệt với môi trường ngoài).
- **Đối tượng kiểm thử:** Zod Schemas (`asset.schema.ts`, `claim.schema.ts`, `dms.schema.ts`), máy trạng thái `vaultState.ts`, các hàm chuyển đổi Adapter, Utility băm SHA-256 client-side.
- **Công cụ:** Vitest kết hợp jsdom.

### 2. Integration Testing (Kiểm thử Tích hợp)

- **Mục tiêu:** Kiểm thử giao tiếp và tính tương thích giữa các thành phần phần mềm hoặc giữa client và dịch vụ bên thứ ba.
- **Phân loại tích hợp:**
  - *Component Integration Testing:* Tích hợp giữa Form UI -> Hook -> Redux Store / TanStack Query Cache.
  - *System Integration Testing:* Tích hợp giữa Frontend Axios Client -> Backend C# API -> Cloudflare R2 Presigned Upload.

### 3. System Testing (Kiểm thử Hệ thống)

- **Mục tiêu:** Đánh giá toàn bộ hành vi của hệ thống hoàn chỉnh dựa trên phạm vi yêu cầu dự án (End-to-End Behavior).
- **Phạm vi kiểm thử:** Luồng hoàn chỉnh từ khi Chủ két tạo két di sản E2EE $\to$ Cấu hình DMS 30 ngày $\to$ Không ping $\to$ Chuyển Grace Period $\to$ Người thi hành nộp scan Giấy chứng tử $\to$ Công chứng viên thẩm định và duyệt $\to$ Người thụ hưởng nhận di sản.

### 4. Acceptance Testing (Kiểm thử Chấp nhận)

- **User Acceptance Testing (UAT):** Người dùng cuối (Chủ két, Người thụ hưởng) thao tác thực tế xác nhận độ tiện dụng và trải nghiệm người dùng theo 10 Heuristics (NN/g).
- **Legal Compliance Testing (Kiểm thử Tuân thủ Pháp luật):** Luật sư hoặc chuyên gia công chứng thẩm định:
  - Bản xuất PDF/A Biên bản bàn giao có đầy đủ chữ ký số và dấu thời gian (Luật Giao dịch điện tử 2023).
  - Hộp cảnh báo tuân thủ Điều 612 (khóa trần 50% tài sản chung vợ chồng) và Điều 644 (diện thừa kế bắt buộc).

---

## 2.2. Bốn Loại Kiểm thử (Test Types)

1. **Functional Testing (Kiểm thử Chức năng):** Đánh giá *"Hệ thống làm ĐÚNG cái gì?"* theo tài liệu SRS.
2. **Non-functional Testing (Kiểm thử Phi chức năng):** Đánh giá *"Hệ thống chạy TỐT như thế nào?"* theo ISO/IEC 25010:
   - *Bảo mật (Security):* Zero Private Key in Storage, Content Security Policy (CSP), chống Clickjacking (`X-Frame-Options: DENY`).
   - *Hiệu năng (Performance):* Thời gian băm SHA-256 file 20MB tại client $< 500ms$.
   - *Tiếp cận (Accessibility - a11y):* Chuẩn WCAG 2.1 AA, tỷ lệ tương phản $4.5:1$, Focus Trap cho Modal.
3. **Structural Testing (White-box Testing - Kiểm thử Cấu trúc):** Dựa trên cấu trúc mã nguồn để đo lường độ phủ câu lệnh (Statement) và nhánh rẽ (Branch).
4. **Change-related Testing (Kiểm thử Liên quan đến Thay đổi):**
   - **Confirmation Testing (Re-testing):** Chạy lại đúng bài test đã fail sau khi Developer thông báo đã fix lỗi để xác nhận lỗi đã được khắc phục hoàn toàn.
   - **Regression Testing (Kiểm thử Hồi quy):** Chạy toàn bộ bộ test suite hiện có để bảo đảm việc sửa lỗi không gây ra lỗi phụ ngoài ý muốn (side-effects) ở các tính năng cũ đang chạy tốt.

---

# CHƯƠNG 3: KIỂM THỬ TĨNH (STATIC TESTING) & QUY CHUẨN REVIEW HÌNH THỨC

Kiểm thử tĩnh là phương pháp kiểm thử **không thực thi mã nguồn**, giúp phát hiện lỗi sớm ngay từ khâu đặc tả yêu cầu, thiết kế kiến trúc và viết code.

## 3.1. Bốn (04) Loại Review Hình Thức Chuẩn ISTQB

```
   [ Ít trang trọng nhất ]                                              [ Trang trọng nhất ]
      Informal Review  -->  Walkthrough  -->  Technical Review  -->  Inspection
      (Peer review 1-1)     (Tác giả trình bày)  (Chuyên gia kỹ thuật)  (Có Moderator & Metrics)
```

| Loại Review                  | Tính Trang Trọng |              Người Chủ Trì              |           Chuẩn Bị Trước           |                 Biên Bản & Ghi Chép                 | Mục Tiêu Cốt Lõi                                                                             | Áp Dụng trong Dự Án SWP391                                                                                           |
| :---------------------------- | :----------------: | :------------------------------------------: | :-------------------------------------: | :----------------------------------------------------: | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **1. Informal Review**  |       Thấp       |                 Bất kỳ ai                 |            Không bắt buộc            |                         Không                         | Phát hiện lỗi nhanh, trao đổi giải pháp 1-1 giữa 2 lập trình viên.                    | Pair programming, review nhanh 1 file hook hoặc util trước khi tạo PR.                                               |
| **2. Walkthrough**      |    Trung bình    |         **Tác giả (Author)**         |             Khuyến khích             |            Tùy chọn (có thể có Scribe)            | Chuyển giao kiến thức (Knowledge transfer), đạt được sự đồng thuận chung.            | Tác giả trình bày luồng nghiệp vụ DMS Heartbeat hoặc sơ đồ Shamir cho cả nhóm 5 người.                    |
| **3. Technical Review** |        Cao        |   **Chuyên gia kỹ thuật / Lead**   |               Bắt buộc               |          Có (Ghi nhận lỗi & Action points)          | Đánh giá tính khả thi kiến trúc, sự nhất quán kỹ thuật, tuân thủ tiêu chuẩn FSD. | Review Pull Request trên GitHub (yêu cầu tối thiểu 2 Tech Approvals theo Rule 4).                                   |
| **4. Inspection**       |      Rất cao      | **Moderator (Không phải tác giả)** | Bắt buộc (Tỷ lệ đọc 5-10 trang/h) | Bắt buộc (Biên bản chi tiết, đo lường Metrics) | Loại bỏ lỗi ở mức tối đa, thu thập dữ liệu cải tiến quy trình dự án.              | Đánh giá chính thức tài liệu SRS Phương án 1 và Báo cáo Đồ án tốt nghiệp trước khi nộp Hội đồng. |

---

## 3.2. Năm (05) Vai Trò Bắt Buộc trong Quy Trình Review Formal

1. **Author (Tác giả):** Người trực tiếp tạo ra tài liệu hoặc mã nguồn cần review. Có trách nhiệm giải thích các điểm chưa rõ và trực tiếp sửa lỗi (Rework) sau phiên họp.
2. **Moderator (Review Leader - Người điều phối):** Người chủ trì buổi review (không bao giờ là tác giả). Có trách nhiệm lập kế hoạch, kiểm tra điều kiện vào (Entry check), điều phối buổi họp tránh công kích cá nhân và kiểm tra việc sửa lỗi (Follow-up).
3. **Scribe (Recorder - Thư ký ghi chép):** Ghi chép trung thực từng lỗi phát hiện, mức độ nghiêm trọng và hành động khắc phục vào biên bản (Logging list).
4. **Reviewer (Người đánh giá / Thanh tra viên):** Các thành viên có chuyên môn (đồng nghiệp, tester, chuyên gia miền nghiệp vụ) nghiên cứu kỹ tài liệu trước phiên họp để chỉ ra lỗi.
5. **Manager (Người quản lý / PO):** Quyết định thực hiện review, phân bổ thời gian trong Sprint Backlog và đánh giá việc hoàn thành mục tiêu.

---

## 3.3. Quy Trình 6 Giai Đoạn Review Formal Chuẩn Mực

```
   1. Planning   -->   2. Kick-off   -->   3. Preparation
                                                 |
   6. Follow-up  <--   5. Rework     <--   4. Review Meeting
```

1. **Planning (Lập kế hoạch):** Moderator xác định mục tiêu, lựa chọn đội ngũ review, phân bổ tài liệu và kiểm tra Entry Criteria.
2. **Kick-off (Khởi động):** Moderator giới thiệu mục tiêu, vai trò của từng thành viên và tài liệu tham chiếu liên quan.
3. **Individual Preparation (Chuẩn bị cá nhân):** Các Reviewer độc lập đọc tài liệu với tốc độ quy chuẩn ($5 - 10$ trang/giờ) và ghi chú các nghi vấn.
4. **Review Meeting (Họp đánh giá):** Gồm 3 giai đoạn: *Giai đoạn Ghi nhận lỗi (Logging phase)* $\to$ *Giai đoạn Thảo luận (Discussion phase)* $\to$ *Giai đoạn Ra quyết định (Decision phase)*.
5. **Rework (Sửa đổi):** Tác giả chỉnh sửa các lỗi đã được ghi nhận trong biên bản.
6. **Follow-up (Theo dõi & Đóng):** Moderator đối soát các thay đổi, kiểm tra Exit Criteria để chính thức phê duyệt tài liệu/code.

---

## 3.4. Kiểm Tra Tĩnh Tự Động (Static Analysis by Tools)

LegacyVault áp dụng tầng kiểm tra tĩnh tự động 100% không để lỗi lọt vào nhánh tích hợp:

- **TypeScript Static Compiler (`tsc --noEmit`):** Phát hiện toàn bộ lỗi sai kiểu dữ liệu, thiếu trường DTO, vi phạm Null-safety.
- **ESLint Rule Engine:** Chặn triệt để `any`, cấm `@ts-ignore`, bảo đảm cấu trúc import một chiều chuẩn FSD.
- **Husky & Git Pre-commit Hook (Rule 29):** Tự động chặn lệnh `git commit` nếu mã nguồn chưa vượt qua `type-check` và `lint`.

---

# CHƯƠNG 4: BỘ KỸ THUẬT THIẾT KẾ KIỂM THỬ THỰC CHIẾN (TEST DESIGN TECHNIQUES)

## 4.1. Kỹ thuật Hộp Đen (Black-box Techniques - K3)

### 1. Phân Vùng Tương Đương (Equivalence Partitioning - EP)

Chia tập dữ liệu đầu vào thành các nhóm (phân vùng) mà hệ thống xử lý như nhau. Chỉ cần chọn 1 giá trị đại diện cho mỗi phân vùng.

- **Phân vùng hợp lệ (Valid Partitions):** Các giá trị được hệ thống chấp nhận và xử lý thành công.
- **Phân vùng không hợp lệ (Invalid Partitions):** Các giá trị bị hệ thống từ chối và phản hồi thông báo lỗi rõ ràng.

### 2. Phân Tích Giá Trị Biên (Boundary Value Analysis - BVA)

Lỗi phần mềm có xu hướng tập trung cao nhất tại các điểm ranh giới giữa các phân vùng tương đương.

- **Kỹ thuật 2-value Boundary:** Với khoảng $[A, B]$, kiểm thử tại các điểm:
  $$
  \{A - 1, A\} \quad \text{và} \quad \{B, B + 1\}
  $$
- **Kỹ thuật 3-value Boundary:** Kiểm thử cả 3 điểm quanh biên:
  $$
  \{A - 1, A, A + 1\} \quad \text{và} \quad \{B - 1, B, B + 1\}
  $$

#### Bảng Áp Dụng Thực Tế EP & BVA cho LegacyVault:

| Tham Số / Trường Dữ Liệu                                    | Phân Vùng Hợp Lệ (Valid)                | Phân Vùng Không Hợp Lệ (Invalid)                                                             | Giá Trị Biên Cần Kiểm Thử (BVA)                                                                                                                        |
| :--------------------------------------------------------------- | :------------------------------------------ | :------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Số trích lục tử tuất** (`deathCertificateNumber`) | Chuỗi ký tự độ dài$3 \le L \le 50$  | $L < 3$ hoặc $L > 50$ hoặc chuỗi rỗng                                                     | - Biên dưới: 2 ký tự (Invalid), 3 ký tự (Valid Min), 4 ký tự (Valid)- Biên trên: 49 ký tự (Valid), 50 ký tự (Valid Max), 51 ký tự (Invalid) |
| **Cơ quan cấp chứng từ** (`deathCertificateIssuer`)  | Chuỗi ký tự độ dài$5 \le L \le 150$ | $L < 5$ hoặc $L > 150$                                                                       | - Biên dưới: 4 ký tự (Invalid), 5 ký tự (Valid Min)- Biên trên: 150 ký tự (Valid Max), 151 ký tự (Invalid)                                      |
| **Mã băm SHA-256** (`deathCertScanHash`)               | Đúng 64 ký tự hex`[0-9a-fA-F]`        | - Độ dài$\ne 64$- Chứa ký tự phi hex (`g-z`, ký tự đặc biệt `#`, khoảng trắng) | - Biên độ dài: 63 ký tự (Invalid), 64 ký tự (Valid), 65 ký tự (Invalid)- Biên tập ký tự (EP-Regex): Chuỗi 64 chữ "z" (Invalid)               |
| **Chu kỳ sinh tồn DMS** (`checkIntervalDays`)          | Số nguyên$7 \le N \le 365$ (ngày)      | $N < 7$, $N > 365$, số âm, số thập phân                                                  | - Biên dưới: 6 ngày (Invalid), 7 ngày (Valid Min), 8 ngày (Valid)- Biên trên: 364 ngày (Valid), 365 ngày (Valid Max), 366 ngày (Invalid)          |
| **Thời gian ân hạn** (`gracePeriodDays`)              | Số nguyên$3 \le N \le 60$ (ngày)       | $N < 3$, $N > 60$                                                                             | - Biên dưới: 2 ngày (Invalid), 3 ngày (Valid Min), 4 ngày (Valid)- Biên trên: 59 ngày (Valid), 60 ngày (Valid Max), 61 ngày (Invalid)             |
| **Tần suất nhắc nhở** (`reminderFrequencyDays`)      | Số nguyên$1 \le N \le 14$ (ngày)       | $N < 1$, $N > 14$                                                                             | - Biên: 0 ngày (Invalid), 1 ngày (Valid Min), 14 ngày (Valid Max), 15 ngày (Invalid)                                                                    |
| **Kênh nhận tin DMS** (`channels`)                     | Mảng chứa từ 1 đến 4 kênh thông báo | Mảng rỗng 0 phần tử                                                                           | - Biên mảng: 0 kênh (Invalid), 1 kênh (Valid Min), 4 kênh (Valid)                                                                                       |

---

### 3. Bảng Quyết Định (Decision Table Testing)

Lý tưởng để kiểm thử các tổ hợp logic nghiệp vụ phức tạp dựa trên quy định pháp luật.

#### Bảng Quyết Định: Thẩm Định Hồ Sơ Mở Thừa Kế (Điều 611 BLDS):

| Điều kiện (Conditions)                                                                                                                 | Rule 1 (Hợp lệ) | Rule 2 (Sai loại giấy tờ) |      Rule 3 (Sai băm SHA-256)      | Rule 4 (Cơ quan cấp không rõ) | Rule 5 (Chưa hết Grace Period) |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :---------------: | :--------------------------: | :---------------------------------: | :-------------------------------: | :------------------------------: |
| 1. Két đang ở trạng thái`AWAITING_LEGAL_PROOF`?                                                                                    |    **Y**    |         **Y**         |             **Y**             |            **Y**            |  **N** (Két còn Active)  |
| 2. Loại văn bản thuộc danh mục hợp pháp (Giấy chứng tử / Bản án)?                                                             |    **Y**    |         **N**         |             **Y**             |            **Y**            |           **Y**           |
| 3. Mã băm SHA-256 tệp scan hợp lệ (đúng 64 ký tự hex)?                                                                           |    **Y**    |         **Y**         | **N** (Phi hex/sai độ dài) |            **Y**            |           **Y**           |
| 4. Cơ quan cấp đạt chuẩn thẩm quyền ($\ge 5$ ký tự)? | **Y** | **Y** | **Y** | **N** ($< 5$ ký tự) |    **Y**    |                              |                                    |                                  |                                  |
| **Hành động / Kết quả (Actions/Outcomes)**                                                                                     |                  |                              |                                    |                                  |                                  |
| Chấp thuận chuyển hồ sơ sang`CLAIM_PENDING`                                                                                        |    **X**    |                              |                                    |                                  |                                  |
| Báo lỗi: Loại chứng từ pháp lý không hợp lệ                                                                                     |                  |         **X**         |                                    |                                  |                                  |
| Báo lỗi: Tệp scan bị lỗi băm hoặc không toàn vẹn                                                                                |                  |                              |             **X**             |                                  |                                  |
| Báo lỗi: Tên cơ quan cấp chứng từ không đầy đủ                                                                                |                  |                              |                                    |            **X**            |                                  |
| Chặn thao tác: Két chưa đủ điều kiện pháp lý mở thừa kế                                                                     |                  |                              |                                    |                                  |           **X**           |

---

### 4. Kiểm Thử Chuyển Trạng Thái (State Transition Testing)

#### Sơ đồ Chuyển Trạng Thái Vòng Đời Két Di Sản:

```
       [ DRAFT ] ------------ (Discard) -------------> [ CLOSED ]
           |                                                ^
     (Activate)                                             |
           v                                                |
       [ ACTIVE ] <--- (Ping Alive / Revive) ---+          |
        |      |                                |           |
   (Miss Ping) (Owner Terminate)                |           |
        |      +--------------------------------+           |
        v                                       |           |
  [ GRACE_PERIOD ]                              |           |
        |                                       |           |
   (Timer Expire)                               |           |
        v                                       |           |
 [ AWAITING_LEGAL_PROOF ] -- (Owner Alive) -----+           |
        |                                                   |
   (File Claim)                                             |
        v                                                   |
  [ CLAIM_PENDING ] -- (Notary Reject: Request Proof) ------+
        |
   (Notary Approve)
        v
    [ APPROVED ] ----------- (Complete Handover) -----------+
```

#### Bảng Ma Trận Trạng Thái (State Table) & Kiểm thử Negative:

| Trạng thái hiện tại        | Sự kiện: Kích hoạt | Sự kiện: Quá hạn Ping | Sự kiện: Điểm danh Alive | Sự kiện: Nộp Giấy chứng tử | Sự kiện: Công chứng Duyệt | Sự kiện: Hoàn tất Bàn giao |
| :----------------------------- | :--------------------: | :-----------------------: | :--------------------------: | :------------------------------: | :----------------------------: | :-----------------------------: |
| **DRAFT**                |       `ACTIVE`       |      —*(Invalid)*      |       —*(Invalid)*       |         —*(Invalid)*         |        —*(Invalid)*        |           `CLOSED`           |
| **ACTIVE**               |    —*(Invalid)*    |     `GRACE_PERIOD`     |          `ACTIVE`          |         —*(Invalid)*         |        —*(Invalid)*        |           `CLOSED`           |
| **GRACE_PERIOD**         |    —*(Invalid)*    |      —*(Invalid)*      |  `ACTIVE` *(Hồi sinh)*  |         —*(Invalid)*         |        —*(Invalid)*        |         —*(Invalid)*         |
| **AWAITING_LEGAL_PROOF** |    —*(Invalid)*    |      —*(Invalid)*      | `ACTIVE` *(Kháng cáo)* |        `CLAIM_PENDING`        |        —*(Invalid)*        |         —*(Invalid)*         |
| **CLAIM_PENDING**        |    —*(Invalid)*    |      —*(Invalid)*      |       —*(Invalid)*       |         —*(Invalid)*         |          `APPROVED`          |         —*(Invalid)*         |
| **APPROVED**             |    —*(Invalid)*    |      —*(Invalid)*      |       —*(Invalid)*       |         —*(Invalid)*         |        —*(Invalid)*        |           `CLOSED`           |
| **CLOSED**               |    —*(Invalid)*    |      —*(Invalid)*      |       —*(Invalid)*       |         —*(Invalid)*         |        —*(Invalid)*        |         —*(Invalid)*         |

> **Quy định Nghiệm thu State Transition:**
>
> - **0-Switch Coverage:** 100% tất cả các bước chuyển trạng thái hợp lệ phải được thực thi có assertion kiểm tra.
> - **Negative State Transition Testing:** Bắt buộc có test cases khẳng định các bước nhảy cóc phi pháp (ví dụ: `DRAFT` $\to$ `APPROVED`, `ACTIVE` $\to$ `APPROVED`, hoặc `CLOSED` $\to$ `ACTIVE`) bị từ chối và ném ra lỗi máy trạng thái.

---

## 4.2. Kỹ thuật Hộp Trắng (White-box Techniques - K3)

Trong ISTQB v4.0, hai kỹ thuật cốt lõi đo lường độ kỹ lưỡng của code:

1. **Statement Testing & Coverage:** Đo lường tỷ lệ phần trăm câu lệnh được thực thi:
   $$
   \text{Statement Coverage} = \frac{\text{Số câu lệnh đã chạy qua}}{\text{Tổng số câu lệnh}} \times 100\%
   $$
2. **Branch Testing & Coverage:** Đo lường tỷ lệ phần trăm các nhánh rẽ điều khiển (True/False của `if`, từng case của `switch`, guard conditions) được kiểm thử:
   $$
   \text{Branch Coverage} = \frac{\text{Số nhánh rẽ logic đã duyệt}}{\text{Tổng số nhánh rẽ logic}} \times 100\%
   $$

> **Chỉ tiêu Bắt buộc (DoD) trong LegacyVault:**
> File máy trạng thái cốt lõi `client/src/entities/vault/model/vaultState.ts` bắt buộc đạt **100% Statement Coverage** và **100% Branch Coverage** trong bộ test `vaultState.test.ts`.

---

## 4.3. Kỹ thuật Dựa trên Kinh Nghiệm (Experience-Based Techniques)

### 1. Error Guessing (Đoán Lỗi)

Dựa trên trực giác, kiến thức chuyên sâu về công nghệ Web3, mật mã học và bối cảnh người dùng để chủ động thiết kế các kịch bản lỗi biên đặc thù.

#### Ma Trận Đoán Lỗi (Error Guessing Matrix) cho LegacyVault:

| Mã Lỗi        | Kịch Bản Đoán Lỗi Thực Tế                                                                                          | Nguy Cơ Tiềm Ẩn                                                         | Biện Pháp Kiểm Thử & Phòng Thủ                                                    |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **EG-01** | Người dùng nộp mã băm SHA-256 viết hoa (`A-F`) hoặc viết thường (`a-f`).                                   | Regex không hỗ trợ`A-F` dẫn đến từ chối oan chứng từ hợp lệ. | Test cả 2 chuỗi upper-case và lower-case; chuẩn hóa regex`/^[0-9a-fA-F]{64}$/`.  |
| **EG-02** | Bị đứt mạng đột ngột (Network drop) khi đang upload video tuyên thệ 15s lên Cloudflare R2.                     | Treo giao diện, mất trạng thái, tệp lưu trữ dở dang trên bucket.  | Kiểm thử hủy kết nối; kích hoạt retry hoặc xóa chunk rác qua AbortController. |
| **EG-03** | Chủ két nhập Timestamp thời gian điểm danh ở tương lai (Client Clock Skew).                                      | Đánh lừa thuật toán đếm ngược của DMS Heartbeat.                 | Backend từ chối timestamp lớn hơn giờ máy chủ server NTP quá 5 phút.           |
| **EG-04** | Tổng tỷ lệ phân chia tài sản cho các bên thụ hưởng là$99.99\%$ hoặc $100.01\%$.                          | Tranh chấp di sản dân sự do thất thoát hoặc dư thừa phần trăm.  | Zod refinement kiểm tra tổng`sum(percentages) === 100.00` với sai số zero.        |
| **EG-05** | Nhập 12 từ khóa bí mật (Seed Phrase) nhưng lặp lại 1 từ 12 lần hoặc chứa từ không thuộc từ điển BIP-39. | Tạo ví ảo không thể khôi phục, mất vĩnh viễn tài sản Web3.     | Kiểm thử danh sách từ hợp lệ theo từ điển BIP-39 English Wordlist.             |

### 2. Exploratory Testing (Kiểm thử Thăm dò)

- Áp dụng phương pháp **Time-boxed Test Charter (khung thời gian 60 - 90 phút)**:
  - *Mục tiêu:* Thử nghiệm đóng vai Người thừa kế giả mạo nộp hồ sơ chứng tử giả để tìm kẽ hở logic của giao diện kiểm duyệt Công chứng viên.
  - *Ghi nhận:* Ghi log trực tiếp hành vi bất thường, không cần viết trước kịch bản từng bước.

### 3. Checklist-based Testing (Kiểm thử Dựa trên Danh sách Kiểm tra)

- Sử dụng checklist kiểm tra bảo mật OWASP:
  - [ ] Không có Private Key nào xuất hiện trong `localStorage` hay `sessionStorage`.
  - [ ] Mọi dữ liệu nhạy cảm giải mã chỉ tồn tại trong biến RAM và bị dọn sạch khi component unmount.
  - [ ] Toàn bộ các nút bấm form đều tự động disabled ngay sau khi click để chống double-submit.

---

# CHƯƠNG 5: QUẢN TRỊ KIỂM THỬ, RỦI RO & VÒNG ĐỜI KHIẾM KHUYẾT (TEST MANAGEMENT)

## 5.1. Phân Định Rạch Ròi Product Risks vs Project Risks

ISTQB phân định rõ ràng giữa hai nhóm rủi ro:

- **Product Risk (Rủi ro Sản phẩm / Rủi ro Chất lượng):** Rủi ro liên quan trực tiếp đến thuộc tính, tính năng và độ an toàn của phần mềm đang xây dựng.
- **Project Risk (Rủi ro Dự án / Rủi ro Tiến độ & Tổ chức):** Rủi ro liên quan đến quá trình quản lý dự án, con người, công cụ, ngân sách và thời hạn bàn giao.

Chỉ số Ưu tiên Rủi ro được tính theo công thức chuẩn:

$$
RPN = \text{Likelihood (Khả năng xảy ra: 1 - 5)} \times \text{Impact (Mức độ tác hại: 1 - 5)}
$$

### Bảng 1: Ma Trận Rủi Ro Sản Phẩm (Product Risks Matrix)

|        ID        | Rủi Ro Sản Phẩm (Product Risk)                                                                             | Khả Năng (L: 1-5) | Tác Hại (I: 1-5) |             RPN             | Chiến Lược Giảm Thiểu & Kiểm Thử                                                                           |
| :--------------: | :------------------------------------------------------------------------------------------------------------ | :-----------------: | :----------------: | :-------------------------: | :---------------------------------------------------------------------------------------------------------------- |
| **PRD-01** | Rò rỉ Private Key hoặc Seed Phrase ra`localStorage` bị tấn công XSS lấy cắp di sản.                |          2          |         5         |   **10** *(High)*   | Component Test RAM-only variable; kiểm tra code review tự động không có`storage.setItem`.                 |
| **PRD-02** | Công chứng viên duyệt nhầm giấy chứng tử giả mạo do mã băm SHA-256 không đối soát toàn vẹn. |          2          |         5         |   **10** *(High)*   | Kiểm thử Decision Table và BVA tính hash SHA-256 ngay tại trình duyệt đối chiếu với cơ sở dữ liệu. |
| **PRD-03** | DMS Heartbeat gửi nhầm thông báo báo tử khi chủ nhân vẫn còn sống do sai lệch timezone.           |          3          |         4         | **12** *(Critical)* | Unit test chu kỳ DMS với mock UTC time; kiểm thử chu trình hồi sinh Grace Period.                           |
| **PRD-04** | Phân chia di sản vi phạm Điều 644 BLDS (bỏ quên cha mẹ già, con chưa thành niên).                 |          3          |         4         | **12** *(Critical)* | System Test kiểm tra bắt buộc hiển thị Hộp cảnh báo pháp lý và form cam kết trách nhiệm.            |
| **PRD-05** | Vỡ layout trên thiết bị di động khiến nút "⚡ I am Alive" bị che khuất không bấm được.         |          3          |         3         |  **9** *(Medium)*  | Responsive Testing trên Viewport iPhone, Android; kiểm tra chuẩn tiếp cận WCAG$44 \times 44$px.            |

### Bảng 2: Ma Trận Rủi Ro Dự Án (Project Risks Matrix)

|        ID        | Rủi Ro Dự Án (Project Risk)                                                                 | Khả Năng (L: 1-5) | Tác Hại (I: 1-5) |           RPN           | Kế Hoạch Ứng Phó (Contingency & Mitigation)                                                                      |
| :--------------: | :--------------------------------------------------------------------------------------------- | :-----------------: | :----------------: | :----------------------: | :------------------------------------------------------------------------------------------------------------------- |
| **PRJ-01** | Thành viên phụ trách Module Shamir Crypto bị ốm hoặc bận đột xuất trong Sprint.     |          3          |         4         | **12** *(High)* | Áp dụng pair-programming; tài liệu hóa kiến trúc qua JSDoc 100% và Scaffold // TODO 5 thông số.            |
| **PRJ-02** | Tài khoản Cloudflare R2 vượt hạn mức Free Tier gây gián đoạn tải video tuyên thệ. |          2          |         4         | **8** *(Medium)* | Sử dụng Mock Storage Service trên môi trường Test/Dev; thiết lập giới hạn dung lượng upload$\le 25$MB. |
| **PRJ-03** | Trễ tiến độ Sprint do phát sinh quá nhiều lỗi hồi quy ở giai đoạn cuối Sprint.    |          3          |         4         | **12** *(High)* | Thiết lập CI/CD Pipeline chạy tự động`vitest run` ở mỗi Pull Request; tuân thủ Micro-Commit.             |
| **PRJ-04** | Thay đổi quy định pháp lý hoặc yêu cầu từ Giảng viên hướng dẫn môn SWP391.     |          3          |         3         | **9** *(Medium)* | Thiết kế kiến trúc phân tầng FSD linh hoạt; cô lập logic nghiệp vụ trong`entities` và `features`.    |

---

## 5.2. Vòng Đời Quản Lý Khiếm Khuyết Chuẩn IEEE 829 & ISO 29119

Khi một bài kiểm thử phát hiện kết quả thực tế (Actual Result) sai lệch so với kết quả mong đợi (Expected Result), một **Sự cố (Incident)** được ghi nhận và quản lý qua vòng đời:

```
     [ REPORTED ]  ---(Moderator Review: Valid)---->  [ OPENED ]  ---(Assigned to Dev)--> [ ASSIGNED ]
          |                                               |                                    |
  (Invalid/Duplicate)                                (Deferred: Low)                      (Dev Fixes)
          v                                               v                                    v
     [ REJECTED ]                                    [ DEFERRED ]                          [ FIXED ]
                                                                                               |
     [ CLOSED ]  <---(Pass Confirmation Test)--- [ RE-TESTING ] <------------------------------+
          ^                                               |
          |                                     (Fail Confirmation)
          |                                               v
          +----------------------------------------- [ RE-OPENED ]
```

### Các trạng thái chuẩn:

1. **Reported:** Tester phát hiện sự cố và tạo bản ghi lỗi sơ bộ.
2. **Opened:** Quản lý kiểm thử / Moderator xác nhận lỗi tái lập được và hợp lệ.
3. **Assigned:** Gán cho Lập trình viên phụ trách module tương ứng để sửa chữa.
4. **Fixed:** Lập trình viên đã sửa code trên nhánh fix và tạo PR.
5. **Re-testing (Confirmation Testing):** Tester chạy lại đúng kịch bản lỗi trên bản build mới.
6. **Re-opened:** Nếu lỗi vẫn còn xuất hiện, trả về cho Lập trình viên xử lý tiếp.
7. **Closed:** Lỗi đã được khắc phục hoàn toàn, kiểm thử hồi quy thành công.
8. **Deferred:** Lỗi nhỏ không ảnh hưởng bàn giao, dời sang Sprint sau.
9. **Rejected:** Báo cáo lỗi không chính xác, hiểu sai nghiệp vụ hoặc do môi trường sai.

---

## 5.3. Mẫu Báo Cáo Sự Cố Chuẩn Mực (Incident Report Template IEEE 829)

```markdown
================================================================================
MÃ BÁO CÁO LỖI (DEFECT ID): LV-BUG-2026-089
================================================================================
Tiêu đề:
  Form nộp hồ sơ thừa kế chấp nhận chuỗi SHA-256 chứa ký tự phi hex 'z'

Mức độ nghiêm trọng (Severity): Critical (Ảnh hưởng trực tiếp tính toàn vẹn chứng từ)
Mức độ ưu tiên (Priority): High (Bắt buộc sửa trước khi kết thúc Sprint)
Module / Thành phần: client/src/features/claims/model/claim.schema.ts
Người báo cáo (Reporter): QA Lead
Người chịu trách nhiệm (Assignee): FE Developer
Phiên bản phần mềm: v1.0.0-rc2 (Git Commit: 8a7f12c)
Môi trường kiểm thử: Windows 11 / Chrome 128 / Node v22

1. Mô tả tóm tắt sự cố (Summary):
   Trường deathCertScanHash chỉ kiểm tra độ dài 64 ký tự mà không kiểm tra định dạng
   chuỗi hex hợp lệ. Người dùng nhập 64 ký tự 'z' form vẫn cho phép nộp.

2. Các bước tái lập lỗi (Steps to Reproduce):
   Bước 1: Đăng nhập với vai trò Người Thi Hành (Executor).
   Bước 2: Mở modal "Nộp Hồ Sơ Yêu Cầu Mở Thừa Kế" tại Két di sản ID: vlt_01.
   Bước 3: Chọn loại chứng từ "Trích lục khai tử".
   Bước 4: Nhập mã băm SHA-256: "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz".
   Bước 5: Điền các thông tin khác hợp lệ và nhấn nút "Gửi hồ sơ".

3. Kết quả mong đợi (Expected Result):
   Hệ thống báo lỗi Inline Validation: "Mã băm SHA-256 chỉ được chứa các ký tự hex hợp lệ (0-9, a-f, A-F)".
   Nút gửi bị vô hiệu hóa.

4. Kết quả thực tế (Actual Result):
   Form chấp nhận dữ liệu thành công và gửi payload lên backend.

5. Bằng chứng đính kèm (Attachments):
   - Ảnh chụp màn hình form validation pass với chuỗi 'z': screenshot_claim_bug.png
   - File log kiểm thử Vitest: test_output_error.log
================================================================================
```

---

## 5.4. Tiêu Chuẩn Đầu Vào & Đầu Ra (Entry & Exit Criteria / DoD)

### Tiêu Chuẩn Đầu Vào (Entry Criteria cho Giai đoạn Test Execution):

- [ ] Mã nguồn đã vượt qua kiểm tra tĩnh: `npm run type-check` đạt 0 lỗi.
- [ ] Linter không cảnh báo vi phạm kiến trúc FSD hay sử dụng kiểu `any`.
- [ ] Môi trường Test Harness / jsdom đã được cấu hình ổn định.

### Tiêu Chuẩn Đầu Ra (Exit Criteria / Definition of Done - DoD cho Sprint):

- [ ] **100% Unit Tests & Integration Tests PASS** trên Vitest (`npm run test:run`).
- [ ] **100% Branch Coverage** đạt được trên các module máy trạng thái quan trọng (`vaultState.ts`).
- [ ] **0 lỗi nghiêm trọng (Critical / High)** còn tồn đọng ở trạng thái `Opened` hoặc `Assigned`.
- [ ] Đầy đủ bằng chứng kiểm thử (Screenshots, Test Logs) đính kèm trong Pull Request Template.
- [ ] Tối thiểu 2 phê duyệt (Approvals) từ Tech Lead / Reviewer trước khi merge vào nhánh `develop`.

---

# CHƯƠNG 6: CÔNG CỤ TỰ ĐỘNG HÓA KIỂM THỬ & CI/CD PIPELINE

Hệ thống công cụ chuẩn hóa trong LegacyVault:

```
                      [ CI/CD Pipeline Automation ]
                                    |
     +------------------------------+------------------------------+
     |                              |                              |
[ Static Analysis ]         [ Unit / Component ]         [ Contract & Schema ]
- TypeScript Compiler       - Vitest Test Runner         - Zod Schema Validation
- ESLint                    - React Testing Library      - API Base Service Tests
- Husky Pre-commit          - jsdom Environment          - Mock Handlers
```

1. **Test Runner:** `vitest` phiên bản 5.x — Tốc độ thực thi siêu tốc, tích hợp trực tiếp với cấu hình Vite của dự án.
2. **DOM Environment:** `jsdom` — Giả lập môi trường DOM trình duyệt để kiểm thử Component UI và Hook.
3. **UI Test Utilities:** `@testing-library/react`, `@testing-library/user-event` — Kiểm thử tương tác người dùng theo triết lý *Testing as User*.
4. **CI/CD Quality Gate Script:**
   ```bash
   # Lệnh chạy tự động kiểm tra toàn bộ chất lượng trước khi commit / merge:
   npm run type-check && npm run test:run
   ```

---

*Tài liệu này là chuẩn mực kiểm thử chính thức của dự án LegacyVault (SWP391), có hiệu lực bắt buộc đối với tất cả thành viên phát triển và trợ lý AI.*
