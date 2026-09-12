# TÀI LIỆU YÊU CẦU KỸ THUẬT & HỢP ĐỒNG API (FRONTEND - BACKEND CONTRACT)
## DỰ ÁN: LEGACYVAULT (SWP391 - FPT UNIVERSITY)

Tài liệu này quy định chi tiết **toàn bộ DTO (Data Transfer Objects), RESTful Endpoints, Cấu trúc Request/Response và Quy chuẩn nghiệp vụ** mà đội ngũ Backend (C# ASP.NET Core Web API) cần xây dựng để tích hợp đồng bộ 100% với Frontend.

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

## 2. MODULE 0: AUTHENTICATION & RBAC (PHÂN QUYỀN)

### 🔹 `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
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
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "role": "MEMBER", // "GUEST" | "MEMBER" | "NOTARY" | "EXECUTOR" | "ADMIN"
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
    "bankCode": "MBBank", // Hoặc VCB, Techcombank
    "accountNumber": "0988123456",
    "accountName": "CONG TY CP LEGACYVAULT",
    "qrCodeUrl": "https://qr.sepay.vn/img?acc=0988123456&bank=MBBank&amount=199000&des=LV892104",
    "status": "PENDING", // "PENDING" | "SUCCESS" | "EXPIRED" | "CANCELLED"
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
  1. Trích xuất mã giao dịch có định dạng `LV[0-9]{6}` từ trường `content`.
  2. Tìm hóa đơn `INV` tương ứng có `paymentCode == "LV892104"` và `status == PENDING`.
  3. So khớp `transferAmount >= invoice.amount`.
  4. Cập nhật `invoice.status = SUCCESS`, kích hoạt gói dịch vụ cho User và gửi email thông báo hóa đơn VAT điện tử.

---

## 4. MODULE 2: DEAD MAN'S SWITCH (NHỊP SINH TỒN & BÀN GIAO)

### 🔹 `GET /api/v1/dms/status`
- **Mô tả**: Lấy trạng thái thời gian thực của Dead Man's Switch.
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
        { "type": "EMAIL", "enabled": true, "targetValue": "nguyenvana@gmail.com" },
        { "type": "TELEGRAM", "enabled": true, "targetValue": "@vana_legacy" }
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
- **Xử lý Backend C#**:
  1. Ghi nhận nhật ký ping (IP, UserAgent, Source).
  2. Cập nhật `LastPingAt = Now`, `NextPingDeadline = Now + Config.CheckIntervalDays`.
  3. Ký số hàm băm mới bằng ECDSA P-256 (`IntegritySealHash`).
  4. Trả về hạn chót mới và mã seal.

### 🔹 `PUT /api/v1/dms/config`
- **Request Body**: `checkIntervalDays` (7-365), `gracePeriodDays` (3-60), `reminderFrequencyDays` (1-14), `channels`, `notifyExecutorOnGracePeriod`.

### 🔹 Background Worker (Hangfire / Quartz.NET)
- Chạy định kỳ mỗi 1 giờ để quét các tài khoản:
  - Nếu `Now >= NextPingDeadline` và `Status == ACTIVE`: Chuyển sang `GRACE_PERIOD`, gửi cảnh báo khẩn cấp qua Email/SMS/Telegram tới User và Executor.
  - Nếu `Now >= NextPingDeadline + GracePeriodDays` và chưa ping: Chuyển sang `TRIGGERED`, kích hoạt giao thức thẩm tra pháp lý công chứng (Notary Legal Verification).

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
    "shamirThreshold": 2, // Cần tối thiểu 2/3 người thụ hưởng để giải mã
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

Backend trả về HTTP Status Code tiêu chuẩn kèm cấu trúc `ApiResponse`:
- `200 OK`: Thành công.
- `201 Created`: Tạo mới thành công.
- `400 Bad Request`: Lỗi validation dữ liệu đầu vào.
- `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn.
- `403 Forbidden`: Không có quyền truy cập role này.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `409 Conflict`: Dữ liệu bị trùng (ví dụ Email đã tồn tại).
- `500 Internal Server Error`: Lỗi logic máy chủ.
