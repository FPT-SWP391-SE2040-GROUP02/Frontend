# TÀI LIỆU YÊU CẦU KỸ THUẬT & HỢP ĐỒNG API (FRONTEND - BACKEND CONTRACT)
## DỰ ÁN: LEGACYVAULT (SWP391 - FPT UNIVERSITY)

Tài liệu này quy định chi tiết **toàn bộ DTO (Data Transfer Objects), RESTful Endpoints, Cấu trúc Request/Response và Quy chuẩn nghiệp vụ** mà đội ngũ Backend (C# ASP.NET Core 8 Web API) cần xây dựng để tích hợp đồng bộ 100% với Frontend và sơ đồ thực thể ERD 11 bảng / 5 làn bơi Swimlane.

---

## 1. QUY CHUẨN NỀN TẢNG (BASE DTO & PROTOCOL)

### 1.1. Cấu Trúc Phản Hồi Chung (`ApiResponse<T>`)
Mọi endpoint trả về kết quả đều phải đóng gói vào envelope chuẩn:
```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
```

### 1.2. Phân Trang Chuẩn Backend C# (`PaginatedList<T>`)
Áp dụng cho mọi danh sách có tìm kiếm, lọc và phân trang:
```csharp
public class PaginatedList<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;
}
```
**Tham số đầu vào (`PaginationParams`)**:
- `pageIndex` (int, default: 1)
- `pageSize` (int, default: 10)
- `searchTerm` (string?, tìm kiếm đa trường)
- `sortColumn` (string?, trường sắp xếp)
- `sortOrder` ("ASC" | "DESC", default: "DESC")

---

## 2. MODULE 0: AUTHENTICATION & RBAC (5 VAI TRÒ CHUẨN HỆ THỐNG)

Hệ thống phân quyền dựa trên 5 vai trò chuẩn:
- **`OWNER`**: Chủ sở hữu két di sản số (Người lập di chúc & cấu hình tài sản).
- **`BENEFICIARY`**: Người thụ hưởng di sản (Nhận tài sản qua eKYC và ghép mảnh khóa Shamir).
- **`EXECUTOR`**: Người giám hộ di sản (Xác nhận tình trạng sinh tử & nộp Giấy chứng tử số).
- **`NOTARY`**: Công chứng viên / Legal Verifier (Thẩm định pháp lý, đối soát CSDL dân cư & duyệt giải phóng khóa).
- **`ADMIN`**: Quản trị viên hệ thống (Giám sát vận hành, bảng giá & Audit Log).

### 🔹 `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "owner@legacyvault.vn",
    "password": "Password@123"
  }
  ```
- **Response Data (`AuthSessionDto`)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "d8a7c2e1-...",
    "expiresIn": 86400,
    "user": {
      "id": "usr_01H...",
      "email": "owner@legacyvault.vn",
      "fullName": "Nguyễn Văn A",
      "role": "OWNER", // "OWNER" | "BENEFICIARY" | "EXECUTOR" | "NOTARY" | "ADMIN"
      "avatarUrl": "https://...",
      "kycStatus": "VERIFIED" // "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
    }
  }
  ```

### 🔹 `POST /api/v1/auth/register`
- **Request Body**: `fullName`, `email`, `password`, `confirmPassword`, `phoneNumber`.
- **Response**: `ApiResponse<AuthSessionDto>`.

### 🔹 `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password`
- **Request Forgot**: `email` -> Gửi OTP/Token qua email.
- **Request Reset**: `token`, `newPassword`, `confirmPassword`.

---

## 3. MODULE 1: GÓI DỊCH VỤ & THANH TOÁN SEPAY VIETQR

### 🔹 `GET /api/v1/billing/plans`
- **Mô tả**: Lấy danh sách gói cước lưu trữ di sản (Cá nhân / Gia tộc).
- **Response Data**:
  ```json
  [
    {
      "id": "plan_standard",
      "tier": "STANDARD",
      "name": "Cá Nhân Bất Biến",
      "priceVnd": 199000,
      "billingCycle": "YEARLY",
      "maxStorageMb": 5120,
      "maxBeneficiaries": 3,
      "supportedAssetTypes": ["CRYPTO", "CREDENTIAL", "DOCUMENT"],
      "hasNotaryVerification": true,
      "isPopular": true
    }
  ]
  ```

### 🔹 `POST /api/v1/billing/create-payment`
- **Request Body**: `{ "planId": "plan_standard" }`
- **Response Data (`PaymentInvoiceDto`)**:
  ```json
  {
    "invoiceId": "INV_20260912_001",
    "paymentCode": "LV892104", // Format tiền tố LV + 6 số
    "amount": 199000,
    "bankCode": "MBBank",
    "accountNumber": "0988123456",
    "accountName": "CONG TY CP LEGACYVAULT",
    "qrCodeUrl": "https://qr.sepay.vn/img?acc=0988123456&bank=MBBank&amount=199000&des=LV892104",
    "status": "PENDING",
    "expiresAt": "2026-09-12T22:45:00Z"
  }
  ```

### 🔹 `POST /api/v1/billing/webhook/sepay` (Webhook Nhận Biến Động Số Dư)
- **Cơ chế**: SePay bắn POST request khi phát hiện tiền vào tài khoản ngân hàng.
- **Header xác thực**: `Authorization: Apikey {SEPAY_WEBHOOK_API_KEY}`
- **Request Body chuẩn SePay**:
  ```json
  {
    "id": 98234,
    "gateway": "MBBank",
    "transactionDate": "2026-09-12 21:30:00",
    "accountNumber": "0988123456",
    "code": null,
    "content": "LV892104 chuyen tien goi ca nhan",
    "transferType": "in",
    "transferAmount": 199000,
    "accumulated": 50000000,
    "subAccount": null,
    "referenceCode": "MB12345678"
  }
  ```
- **Xử lý Backend C#**:
  1. Trích xuất mã giao dịch `LV[0-9]{6}` từ `content`.
  2. Tìm hóa đơn `INV` có `paymentCode == "LV892104"` và `status == PENDING`.
  3. So khớp `transferAmount >= invoice.amount`.
  4. Cập nhật `invoice.status = SUCCESS`, kích hoạt gói dịch vụ cho User.

---

## 4. MODULE 2: DEAD MAN'S SWITCH (NHỊP SINH TỒN & BÀN GIAO)

### 🔹 `GET /api/v1/dms/status`
- **Response Data (`DmsStateDto`)**:
  ```json
  {
    "status": "ACTIVE", // "ACTIVE" | "WARNING" | "GRACE_PERIOD" | "TRIGGERED" | "PAUSED"
    "lastPingAt": "2026-09-07T14:30:00Z",
    "nextPingDeadline": "2026-10-07T14:30:00Z",
    "daysRemaining": 25,
    "hoursRemaining": 14,
    "integritySealHash": "0x3f8a9e21...ecdsa_p256_verified_anchor",
    "config": {
      "checkIntervalDays": 30,
      "gracePeriodDays": 14,
      "reminderFrequencyDays": 3,
      "notifyExecutorOnGracePeriod": true,
      "channels": [
        { "type": "EMAIL", "enabled": true, "targetValue": "owner@gmail.com" },
        { "type": "TELEGRAM", "enabled": true, "targetValue": "@owner_legacy" }
      ]
    }
  }
  ```

### 🔹 `POST /api/v1/dms/pulse` (⚡ I'm Alive Ping)
- **Request Body**:
  ```json
  {
    "source": "WEB", // "WEB" | "EMAIL_LINK" | "TELEGRAM" | "MOBILE_APP"
    "clientTimestamp": "2026-09-12T21:40:00Z"
  }
  ```

### 🔹 `PUT /api/v1/dms/config`
- **Request Body**: `checkIntervalDays` (7-365), `gracePeriodDays` (3-60), `reminderFrequencyDays` (1-14), `channels`, `notifyExecutorOnGracePeriod`.

---

## 5. MODULE 3: QUẢN LÝ KHO TÀI SẢN SỐ (STRATEGY PATTERN)

### 🔹 Phân Loại Tài Sản & Payload Đã Mã Hóa:
Mọi nội dung nhạy cảm **bắt buộc được mã hóa phía Client (AES-GCM-256)** trước khi gửi lên Server (Server không giữ bản rõ - Zero Knowledge Encryption).

### 🔹 `GET /api/v1/assets`
- **Query Params**: `pageIndex`, `pageSize`, `assetType` (ALL | CRYPTO | CREDENTIAL | DOCUMENT | SOCIAL_MEDIA), `status`.
- **Response**: `PaginatedList<AssetItemDto>`.

### 🔹 `POST /api/v1/assets` (Thêm tài sản mới)
- **Request Body DTO**:
  ```json
  {
    "title": "Ví Lạnh Bitcoin Gia Tộc",
    "assetType": "CRYPTO",
    "description": "Chứa 2.5 BTC tại ví Ledger",
    "encryptedPayload": {
      "ciphertext": "U2FsdGVkX1+...",
      "iv": "dGVzdF9pdg==",
      "authTag": "dGVzdF90YWc=",
      "keyDerivationSalt": "c2FsdF8xMjM="
    },
    "beneficiaryIds": ["usr_heir_01", "usr_heir_02"],
    "shamirThreshold": 2,
    "shamirTotalShares": 3
  }
  ```

---

## 6. MODULE 4: XÁC MINH PHÁP LÝ CÔNG CHỨNG & VIDEO THỀ MINH MẪN

### 🔹 `POST /api/v1/legal/upload-death-certificate`
- **Mô tả**: Tải lên Giấy chứng tử số để công chứng viên kiểm tra đối chiếu Cơ sở dữ liệu Quốc gia về Dân cư.
- **Request Form-Data**: `file` (PDF/JPG), `certificateNumber`, `issuedDate`, `issuedPlace`.
- **Backend**: Tự động tính toán SHA-256 hash của file và lưu trữ dấu thời gian (Timestamp Authority - RFC 3161).

### 🔹 `POST /api/v1/legal/submit-video-affidavit`
- **Mô tả**: Lưu trữ bản ghi 15 giây video tuyên thệ minh mẫn theo Điều 630 BLDS 2015.
- **Request Form-Data**: `videoBlob` (WebM/MP4), `recordedAt`, `gpsCoordinates`, `browserFingerprint`.

---

## 7. MÃ LỖI HTTP VÀ XỬ LÝ LỖI CHUẨN

- `200 OK`: Thành công.
- `201 Created`: Tạo mới thành công.
- `400 Bad Request`: Lỗi validation dữ liệu đầu vào.
- `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn.
- `403 Forbidden`: Không có quyền truy cập role này.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `409 Conflict`: Dữ liệu bị trùng (ví dụ Email đã tồn tại).
- `500 Internal Server Error`: Lỗi logic máy chủ.

---

## 8. BỔ SUNG: MODULE 4B - GIA ĐÌNH HẠT NHÂN (CIVIL CODE COMPLIANCE)

### 🔹 `GET /api/v1/family-profile`
- **Mô tả**: Lấy hồ sơ gia đình hạt nhân để hiển thị lên cây gia phả di sản và kiểm tra Điều 612 / Điều 644 BLDS.
- **Response Data (`FamilyProfileDto`)**:
  ```json
  {
    "maritalStatus": "MARRIED", // "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED"
    "hasMaritalProperty": true, // Nếu true -> Khóa trần phân bổ tối đa 50% (Điều 612 BLDS)
    "spouse": {
      "fullName": "Trần Thị B",
      "nationalIdNumber": "079199001234",
      "phone": "0912345678"
    },
    "parents": [
      { "relationship": "FATHER", "fullName": "Nguyễn Văn C", "isAlive": true },
      { "relationship": "MOTHER", "fullName": "Lê Thị D", "isAlive": false }
    ],
    "minorChildren": [
      { "fullName": "Nguyễn Văn E", "birthYear": 2012, "isLaborDisabled": false } // Dưới 18t -> Thuộc diện Đ.644
    ],
    "acknowledgedLegalRisk": true
  }
  ```

### 🔹 `PUT /api/v1/family-profile`
- **Request Body**: Cấu trúc tương tự `FamilyProfileDto`.
- **Xử lý Backend C#**: Cập nhật bảng `FamilyProfiles`. Nếu có con nhỏ (<18 tuổi) hoặc cha mẹ già còn sống mà `acknowledgedLegalRisk == false`, trả về cảnh báo nhắc nhở tuân thủ Điều 644 BLDS (thừa kế bắt buộc không phụ thuộc nội dung di chúc).

---

## 9. BỔ SUNG: MODULE 4C - PHÂN BỔ DI SẢN & KÝ SỐ NIÊM PHONG DI CHÚC

### 🔹 `POST /api/v1/wills/allocate` (Phân bổ tỷ lệ thừa kế)
- **Request Body DTO (`AllocateEstateRequest`)**:
  ```json
  {
    "allocations": [
      {
        "assetId": "ast_01H...",
        "beneficiaryId": "ben_01H...",
        "sharePercentage": 50.00,
        "encryptedAssetDek": "U2FsdGVkX1+...key_phong_bi_dek"
      },
      {
        "assetId": "ast_01H...",
        "beneficiaryId": "ben_02H...",
        "sharePercentage": 50.00,
        "encryptedAssetDek": "U2FsdGVkX1+...key_phong_bi_dek"
      }
    ]
  }
  ```
- **Xử lý Backend C#**:
  1. Kiểm tra tổng tỷ lệ % của mỗi tài sản phải bằng đúng 100.00%.
  2. Nếu tài sản thuộc diện tài sản chung vợ chồng (`hasMaritalProperty == true`), kiểm tra tỷ lệ định đoạt không vượt quá 50% theo Điều 612 BLDS.

### 🔹 `POST /api/v1/wills/sign-and-seal` (Lễ Ký Số & Niêm Phong Kho)
- **Request Body DTO**:
  ```json
  {
    "manifestHash": "8f4b2a9c1e3d5f...sha256",
    "ownerSignature": "MEQCID...ecdsa_p256_signature",
    "oathVideoUrl": "https://res.cloudinary.com/.../video_affidavit_15s.webm",
    "oathVideoHash": "c2a1e8...sha256_video_blob",
    "keyShares": [
      { "shareIndex": 1, "holderType": "SYSTEM", "encryptedData": "share_data_1..." },
      { "shareIndex": 2, "holderType": "VERIFIER", "encryptedData": "share_data_2..." },
      { "shareIndex": 3, "holderType": "BENEFICIARY_POOL", "encryptedData": "share_data_3..." }
    ]
  }
  ```
- **Xử lý Backend C#**:
  1. Xác thực chữ ký số `ownerSignature` khớp với Public Key của Owner.
  2. Lưu 3 mảnh Shamir vào bảng `KeyShares`.
  3. Cập nhật `Vault.Status = "ACTIVE"`, kích hoạt đếm ngược Dead Man's Switch.
  4. Ghi vết `VAULT_SEALED` vào `AuditLogs` bất biến.

---

## 10. BỔ SUNG: MODULE 5B - CỔNG THẨM ĐỊNH CÔNG CHỨNG (NOTARY PORTAL)

### 🔹 `GET /api/v1/notary/claims`
- **Mô tả**: Lấy danh sách hồ sơ tử tuất chờ duyệt dành riêng cho Role `NOTARY`.
- **Query Params**: `PaginationParams`, `status` (PENDING | APPROVED | REJECTED).
- **Response**: `PaginatedList<DossierReviewItemDto>`.

### 🔹 `POST /api/v1/notary/claims/{claimId}/approve`
- **Mô tả**: Công chứng viên ký duyệt sau khi đối soát xong Giấy chứng tử số và manifest hash.
- **Request Body**:
  ```json
  {
    "notaryNotes": "Đã đối soát Giấy chứng tử số 12/2026/TLKT khớp CSDL quốc gia.",
    "notarySignature": "MEYCIQ...chu_ky_so_cong_chung_vien"
  }
  ```
- **Xử lý Backend C#**:
  1. Cập nhật `LegalClaims.claim_status = "APPROVED"`.
  2. Giải phóng Mảnh khóa Verifier (`KeyShares.is_released = true`).
  3. Đổi trạng thái kho sang `APPROVED`.
  4. Gửi email thông báo thừa kế di sản (kèm link an toàn) tới toàn bộ Beneficiaries trong kho.

### 🔹 `POST /api/v1/notary/claims/{claimId}/reject`
- **Request Body**: `{ "reason": "Bản scan Giấy chứng tử bị mờ, sai số hiệu hộ tịch." }`
- **Xử lý Backend C#**: Cập nhật `claim_status = "REJECTED"`, gửi thông báo yêu cầu Executor nộp lại chứng từ.

---

## 11. BỔ SUNG: MODULE 5C - CỔNG THỤ HƯỞNG DI SẢN (BENEFICIARY CLAIM & DECRYPT)

### 🔹 `POST /api/v1/claims/verify-ekyc`
- **Mô tả**: Xác thực danh tính người nhận thừa kế qua khuôn mặt và ảnh CCCD.
- **Request Body**: `{ "nationalIdNumber": "079199001234", "faceLivenessConfidence": 98.5 }`
- **Xử lý Backend**: So khớp số CCCD với `Beneficiaries.national_id_number`. Nếu khớp → cấp token quyền giải mã.

### 🔹 `GET /api/v1/claims/key-shares`
- **Mô tả**: Trả về Mảnh khóa System + Mảnh khóa Verifier đã giải phóng (đủ ngưỡng 2/3 Shamir).
- **Response Data**:
  ```json
  {
    "vaultId": "vlt_01H...",
    "systemShare": "share_data_1...",
    "verifierShare": "share_data_2...",
    "threshold": 2
  }
  ```
*(Trình duyệt của Beneficiary nhận 2 mảnh này tự ghép lại để phục hồi Master Key và giải mã DEK tại RAM máy khách).*

### 🔹 `POST /api/v1/claims/confirm-receipt`
- **Mô tả**: Người thừa kế ký xác nhận đã nhận đủ tài sản.
- **Response**: Trả về URL tải file **PDF/A Biên bản bàn giao di sản số có mã QR tra cứu**.
