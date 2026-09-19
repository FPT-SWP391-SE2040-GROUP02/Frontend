# TÀI LIỆU HỢP ĐỒNG API (FRONTEND - BACKEND CONTRACT)
## DỰ ÁN: LEGACYVAULT — HỆ THỐNG LƯU GIỮ VÀ BÀN GIAO TÀI SẢN SỐ
### Phiên bản: 1.1 — Chuẩn hóa theo SRS v1.1 (19/09/2026)
### Công nghệ Backend: C# ASP.NET Core 8 Web API | Frontend: React 19 + TypeScript (FSD)

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
- `sortOrder` ("asc" | "desc", default: "desc")

### 1.3. Header Bắt Buộc (Interceptors)
- `Authorization: Bearer <JWT>`
- `X-Correlation-ID: <UUID>` (Khả năng quan sát vết sự cố - Rule 25)
- `X-Active-Role: <Role>` (`VAULT_OWNER` | `DIGITAL_EXECUTOR` | `LEGAL_VERIFIER` | `BENEFICIARY` | `SYSTEM_ADMIN`)

---

## 2. MODULE 0: AUTHENTICATION & CONTEXTUAL RBAC

Hệ thống phân quyền theo ngữ cảnh Kho / Hồ sơ (RoleAssignment) gồm 5 vai trò:
- `VAULT_OWNER`: Chủ sở hữu kho tài sản số.
- `DIGITAL_EXECUTOR`: Người thực hiện hồ sơ (Chính hoặc Dự phòng theo ưu tiên).
- `LEGAL_VERIFIER`: Người xác minh pháp lý độc lập (mô phỏng).
- `BENEFICIARY`: Người thụ hưởng tài sản.
- `SYSTEM_ADMIN`: Quản trị viên hệ thống (chỉ vận hành, không xem tài sản / không duyệt hồ sơ).

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
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "owner@legacyvault.vn",
      "fullName": "Nguyễn Văn A",
      "identityStatus": "VERIFIED",
      "twoFactorEnabled": true
    }
  }
  ```

### 🔹 `POST /api/v1/auth/mfa/setup` & `POST /api/v1/auth/mfa/verify`
- Thiết lập và xác nhận TOTP / Passkey (bắt buộc để kích hoạt kho theo BR-01).

---

## 3. MODULE 1: QUẢN LÝ KHO (VAULT MANAGEMENT) & ĐIỂM DANH SINH TỒN (DMS)

### 🔹 `POST /api/v1/vaults`
- **Mô tả**: Tạo kho mới ở trạng thái `DRAFT`.
- **Request Body (`CreateVaultDto`)**:
  ```json
  {
    "title": "Kho Di Sản Gia Đình 2026",
    "description": "Lưu trữ tài liệu và hướng dẫn tài chính quan trọng",
    "heartbeatIntervalDays": 30,
    "gracePeriodDays": 14
  }
  ```

### 🔹 `POST /api/v1/vaults/{vaultId}/activate`
- **Mô tả**: Kiểm tra điều kiện `BR-01` (Chủ kho đã KYC + bật MFA, có ít nhất 1 tài sản, có ít nhất 1 Executor đã xác minh và chấp nhận vai trò). Nếu đủ điều kiện, chuyển `ACTIVE`.

### 🔹 `POST /api/v1/vaults/{vaultId}/ping`
- **Mô tả**: Điểm danh sinh tồn định kỳ (`⚡ I am Alive`). Cập nhật `lastPingAt` và dời deadline.

### 🔹 `POST /api/v1/vaults/{vaultId}/rescue-alive`
- **Mô tả**: Chủ sở hữu báo "Tôi còn sống" khi kho bị trễ hoặc đang có hồ sơ xác minh giả mạo (`RESCUE-01`).
- **Hành vi**: Ngay lập tức chặn các lần phát hành dữ liệu mới; chuyển hồ sơ xác minh sang trạng thái `CANCELLED` với lý do *"Đã hủy vì chủ sở hữu còn sống"* (`CLOSE-05`); giữ nguyên lịch sử những lần đã phát hành trước đó.

---

## 4. MODULE 2: QUẢN LÝ TÀI SẢN & PHIÊN BẢN (ASSET & ASSET VERSIONS)

*Bảo mật SEC-01:* Mỗi phiên bản tệp dùng một khóa dữ liệu ngẫu nhiên riêng (AES-256-GCM). Khóa dữ liệu được bao bọc (Wrapped Data Key).

### 🔹 `POST /api/v1/vaults/{vaultId}/assets`
- **Request Body (`CreateAssetDto`)**:
  ```json
  {
    "title": "Tài liệu Hợp đồng Kinh doanh",
    "assetType": "DOCUMENT",
    "allowRedistribution": true,
    "initialBeneficiaryEmail": "beneficiary@example.com"
  }
  ```

### 🔹 `POST /api/v1/assets/{assetId}/versions`
- **Mô tả**: Tải lên phiên bản mới của tài sản.
- **Request Body (`CreateAssetVersionDto`)**:
  ```json
  {
    "ciphertextUrl": "https://storage.legacyvault.vn/vault_01/doc_v1.enc",
    "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "wrappedDataKey": "enc_key_base64...",
    "initializationVector": "iv_12bytes_base64...",
    "authTag": "tag_16bytes_base64...",
    "fileSizeBytes": 10485760
  }
  ```

---

## 5. MODULE 3: PHÂN CÔNG NGƯỜI THỰC HIỆN (EXECUTOR ASSIGNMENTS & FALLBACKS)

### 🔹 `POST /api/v1/vaults/{vaultId}/executors`
- **Mô tả**: Phân công Người thực hiện chính (`PriorityOrder = 1`) hoặc danh sách dự phòng (`PriorityOrder = 2, 3...`) theo quy tắc `ASSIGN`.
- **Request Body**:
  ```json
  {
    "executorEmail": "executor@example.com",
    "priorityOrder": 1
  }
  ```

### 🔹 `POST /api/v1/executors/invitations/{assignmentId}/respond`
- **Mô tả**: Người thực hiện chấp nhận hoặc từ chối vai trò.
- **Request Body**:
  ```json
  {
    "accepted": true
  }
  ```

---

## 6. MODULE 4: HỒ SƠ XÁC MINH SỰ KIỆN (VERIFICATION CASES & EVIDENCE)

### 🔹 `POST /api/v1/verification-cases`
- **Mô tả**: Người thực hiện tạo hồ sơ khi kho chuyển sang `VERIFICATION_PENDING`.
- **Request Body (`CreateVerificationCaseDto`)**:
  ```json
  {
    "vaultId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventType": "DECEASED", // "DECEASED" | "MISSING"
    "integrityStatementAccepted": true, // Executor ký cam kết tính trung thực
    "evidence": {
      "documentType": "DEATH_CERTIFICATE",
      "fileUrl": "https://storage.legacyvault.vn/evidence/death_cert.pdf",
      "fileHashSha256": "4a5c9..."
    }
  }
  ```

### 🔹 `POST /api/v1/verification-cases/{caseId}/review`
- **Mô tả**: Người xác minh pháp lý phê duyệt hoặc xử lý hồ sơ.
- **Request Body (`ReviewDecisionDto`)**:
  ```json
  {
    "decisionType": "APPROVE", // "APPROVE" | "REJECT" | "REQUEST_EVIDENCE" | "SET_MISSING_WAIT" | "FLAG_FRAUD"
    "notes": "Giấy chứng tử hợp lệ từ cơ quan hộ tịch",
    "decisionManifestHash": "8f4b2..."
  }
  ```
- *Quy tắc Mất tích:* Nếu `eventType = MISSING`, chuyển `MISSING_PENDING`, **tuyệt đối không tạo quyền bàn giao**.

---

## 7. MODULE 5: BẢNG CHIA LẠI QUYỀN CÙNG NHẬN & CHỮ KÝ ĐỒNG THUẬN (REDISTRIBUTION & CONSENT)

*Quy tắc SHR & BR-06/BR-07:* Mỗi tệp có 1 bảng chia duy nhất; chỉ được chia lại 1 lần nếu chủ sở hữu cho phép. Tổng tỷ lệ đúng 100%. Mọi người có tỷ lệ > 0% phải ký trước khi bất kỳ ai được cấp khóa.

### 🔹 `POST /api/v1/assets/{assetVersionId}/redistribution`
- **Mô tả**: Người nhận ban đầu lập bảng chia sẻ quyền cùng nhận.
- **Request Body (`CreateRedistributionDto`)**:
  ```json
  {
    "members": [
      {
        "beneficiaryEmail": "person_a@example.com",
        "percentageShare": 60.00
      },
      {
        "beneficiaryEmail": "person_b@example.com",
        "percentageShare": 40.00
      }
    ]
  }
  ```

### 🔹 `POST /api/v1/redistribution-tables/{tableId}/sign-consent`
- **Mô tả**: Người thụ hưởng ký chấp thuận bảng chia.
- **Thời hạn TIME-01**: 168 giờ liên tục. Hết hạn không ai được mở tệp.
- **Request Body (`SignConsentDto`)**:
  ```json
  {
    "signedTableHash": "9a3e1...",
    "signatureValue": "ecdsa_signature_base64..."
  }
  ```

---

## 8. MODULE 6: BÀN GIAO & PHÁT HÀNH KHÓA (DELIVERY & KEY SESSIONS)

*Quy tắc NFR-05 & DEL:* Phiên nhận có hiệu lực 15 phút. Request lặp hoặc callback trùng trả kết quả cũ. Mất kết nối cho phép tiếp tục cùng giao dịch logic sau khi xác thực lại.

### 🔹 `POST /api/v1/delivery/transactions/{transactionId}/request-session`
- **Mô tả**: Người thụ hưởng yêu cầu phiên giải phóng khóa sau khi hồ sơ đã duyệt và bảng chia (nếu có) đã thu đủ 100% chữ ký.
- **Response Data (`DeliverySessionDto`)**:
  ```json
  {
    "sessionId": "ses_01...",
    "expiresAt": "2026-09-19T14:30:00Z", // 15 phút hiệu lực
    "ciphertextUrl": "https://storage.legacyvault.vn/vault_01/doc_v1.enc",
    "wrappedDataKey": "enc_key_base64...",
    "initializationVector": "iv_base64...",
    "authTag": "auth_tag_base64..."
  }
  ```

### 🔹 `POST /api/v1/delivery/transactions/{transactionId}/confirm-received`
- **Mô tả**: Client gửi xác nhận đã tải và giải mã thành công. Đóng giao dịch với trạng thái `DELIVERED`.

---

## 9. MODULE 7: GIÁM SÁT SỰ CỐ & SỔ CÁI KIỂM TOÁN (INCIDENTS & AUDIT LOG)

### 🔹 `GET /api/v1/audit-logs`
- **Quy tắc NFR-06:** Audit log truy vết đầy đủ nhưng TUYỆT ĐỐI KHÔNG chứa mật khẩu, OTP, khóa rõ hay nội dung tài sản.

### 🔹 `POST /api/v1/incidents` & `POST /api/v1/incidents/{id}/resolve`
- Ghi nhận sự cố nghi ngờ gian lận, lỗi gửi 72h hoặc tranh chấp; hỗ trợ đóng băng kho hoặc giải tỏa sau khi kiểm tra.

---

## 10. ĐỊNH HƯỚNG SAU MVP (MỤC 14 SRS v1.1)
Các tính năng sau không nằm trong API contract của 9 tuần:
- Endpoint chia tách / gom mảnh khóa Shamir `KeyShares`.
- Tích hợp cổng thanh toán VietQR / SePay tự động.
- Cổng tích hợp API công chứng viên và CSDL dân cư thật.
