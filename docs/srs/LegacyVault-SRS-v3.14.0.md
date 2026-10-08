# Đặc tả yêu cầu phần mềm LegacyVault

**Phiên bản:** 3.14.0 **Ngày cập nhật:** 07/10/2026 **Cấu trúc:** bốn luồng chính F1–F4; thanh toán SePay là luồng bổ trợ P. **Phạm vi:** kho di sản số, eKYC cơ bản, điểm danh, xét chứng tử, xác minh video và bàn giao đúng quyền.

LegacyVault giúp Owner lưu nội dung tài sản số được mã hóa và chỉ định người nhận. Sau khi Verifier phê duyệt chứng tử, người nhận mở lời mời, đăng nhập hoặc đăng ký rồi thực hiện eKYC. Email và số điện thoại dùng để liên lạc, không phải điều kiện đối chiếu để vào eKYC. Backend đối chiếu danh tính với chỉ định đã chốt; Executor xác minh qua video trong app; người đúng danh tính chủ động đồng ý nhận trước khi được cấp quyền xem/tải.

## Thay đổi so với v3.12.1

| Nội dung                 | Quy tắc v3.13.0                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Sau đăng nhập từ lời mời | Vào eKYC ngay, không có cổng đối chiếu email/số điện thoại với hồ sơ Owner                |
| Xác minh tài khoản       | Vẫn xác minh email đăng ký theo dịch vụ tài khoản; không cần trùng email chỉ định         |
| Hồ sơ người nhận         | Số căn cước 12 chữ số, họ tên và ngày sinh bắt buộc; email/số điện thoại phục vụ liên lạc |
| Điều kiện tiếp tục nhận  | eKYC và đối chiếu chỉ định, sau đó video với Executor; eKYC không tự cấp quyền            |
| eKYC                     | Dịch vụ chung cho Owner kích hoạt, Beneficiary nhận và Owner báo còn sống                 |
| Đọc căn cước             | Ưu tiên QR, dùng OCR đối chiếu/dự phòng; đọc được QR không chứng minh thẻ thật            |
| Owner báo còn sống       | Chặn cấp grant mới ngay; xác minh với mẫu đăng ký; Verifier kết luận hồ sơ chứng tử       |
| Nhánh ngoại lệ           | Bỏ ngoại lệ chỉ vì liên hệ khác; giữ xem xét khác biệt danh tính/bằng chứng chưa rõ       |
| Chống kéo dài lưu trữ    | Click link, đăng nhập, mở phiên eKYC hoặc yêu cầu sai người không tự giữ xóa/đặt lại hạn  |
| Trạng thái và kiểm thử   | Bổ sung bảng chuyển trạng thái, mã yêu cầu, ưu tiên/MVP và AC truy vết                    |
| Tài liệu                 | Quy tắc được viết đầy đủ trong bản này; lịch sử và nhãn swimlane ở phụ lục                |

## 1. Phạm vi và quy ước

### 1.1. Phạm vi sản phẩm

Trong phạm vi: tài khoản app/Google; RBAC; kho/tài sản/gói/chỉ định; mã hóa; lời mời Executor; eKYC cơ bản; điểm danh; chứng tử và phản đối; lời mời Beneficiary; lịch và video trong app; nhận/từ chối; grant; xem/tải có hạn; lưu trữ và cleanup có kiểm tra; SePay; audit; quy trình Admin tiếp nhận và quản lý sự cố.

Ngoài phạm vi: chuyển nhượng hoặc thay người nhận trong app; người nhận đồng cấp/ưu tiên; chia phần trăm/số dư; kho cá nhân Free/Plus của Beneficiary và import; gia hạn tải; suy nghĩ lại hai năm; ngày bàn giao chung bắt buộc; giao dịch ngân hàng/blockchain; NFC; cơ sở dữ liệu dân cư/hộ tịch; chữ ký số công chứng; ghi hình toàn bộ cuộc gọi bắt buộc; thay mẫu khuôn mặt qua giao diện; Admin xem khóa hoặc mở tài sản thủ công.

eKYC cơ bản không được mô tả là eKYC được chứng nhận hoặc bảo đảm phát hiện mọi giả mạo. Nhận nội dung qua app không tự xác lập quyền sở hữu, chuyển tiền, chuyển coin hoặc thay thế thủ tục pháp lý bên ngoài.

### 1.2. Thuật ngữ

| Thuật ngữ        | Ý nghĩa                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| Owner            | Người sở hữu và quản lý kho, kế hoạch khi còn quyền quản lý                   |
| Executor         | Người Owner cho phép nộp chứng tử và xác minh Beneficiary qua video           |
| Beneficiary      | Người được Owner chỉ định nhận nội dung của một gói                           |
| Verifier         | Nhân sự xét chứng tử và phản đối về sự kiện Owner qua đời                     |
| Admin            | Người quản lý tài khoản/vai trò và điều phối sự cố đúng phạm vi               |
| Tài sản          | File hoặc bản ghi tài khoản/ví có nội dung mã hóa và phiên bản riêng          |
| Gói bàn giao     | Một hoặc nhiều tài sản được chỉ định giao cùng nhau                           |
| Chỉ định         | Bản ghi người nhận và phạm vi, nhận diện bằng`designation_id`                 |
| Snapshot         | Bản chốt bất biến gồm tài sản/phiên bản, gói, chỉ định và phân công của hồ sơ |
| Yêu cầu xác minh | Hồ sơ một tài khoản đang chứng minh mình là người được chỉ định               |
| Lượt bàn giao    | Tiến trình của một chỉ định trên một gói trong một hồ sơ chứng tử             |
| Grant            | Quyền đọc được tạo sau kết luận đúng danh tính và chấp thuận nhận             |
| Đồng thụ hưởng   | Nhiều người nhận cùng nội dung bằng các grant độc lập                         |
| Phiên eKYC       | Lần thu thập/kiểm tra bằng chứng gắn tài khoản, mục đích và đối tượng         |
| Mẫu Owner        | Đặc trưng khuôn mặt từ selfie đạt lúc đăng ký, được bảo vệ và lưu phiên bản   |
| Hold             | Chặn có nguyên nhân, phạm vi, người phụ trách, thời hạn hoặc ngày rà soát     |
| QR/OCR/PAD       | Đọc QR / nhận dạng chữ / phát hiện dấu hiệu giả mạo khuôn mặt                 |

`user_id`, `designation_id` và số căn cước là ba loại dữ liệu khác nhau. Số căn cước được bảo vệ, không dùng làm ID công khai trong URL. Không giả định có `person_id` được xác thực bởi cơ quan nhà nước.

### 1.3. Mức ưu tiên và phạm vi nghiệm thu

Mỗi yêu cầu có nhãn **Must/Should/Could** và **MVP: Có/Không**. Must là điều kiện cần của chức năng trong phạm vi; Should là cải tiến được ưu tiên; Could là lựa chọn bổ sung. MVP Có xác định phạm vi phiên bản này, không phải cam kết làm được tất cả trong một tháng. Không áp dụng phương án thu gọn thay video bằng duyệt ảnh.

**Đề xuất** là giá trị/cách triển khai cần khách hàng xác nhận trước khi đưa vào vận hành. Dùng giá trị đề xuất trong môi trường kiểm thử phải ghi phiên bản cấu hình; không chuyển nó thành quy định pháp luật hoặc quyết định đã được khách hàng chốt.

### 1.4. Các điểm còn cần xác nhận

| Điểm | Đề xuất trong bản này | Trạng thái |
| --- | --- | --- |
| Thời gian phản đối chứng tử | 72 giờ từ`objection_started_at` sau bằng chứng giao thông báo | Cần xác nhận |
| Owner hoàn tất báo còn sống | 7 ngày từ báo cáo đầu tiên được tiếp nhận | Cần xác nhận |
| Verifier kết luận phản đối | 48 giờ từ có đủ kết quả hoặc hết 7 ngày | Cần xác nhận |
| Executor dự phòng | Khuyến nghị một người đã chấp nhận, không bắt buộc kích hoạt | Cần xác nhận |
| Ân hạn hết gói | Chưa đưa 365 ngày thành chính sách; dùng mục 8.3 | Chưa chốt phương án mới |
| Mẫu thẻ/đối tượng MVP | Người từ đủ 18 tuổi, CCCD gắn chip và căn cước mẫu 2024 đã được kiểm thử | Đề xuất cần xác nhận |
| SMS/video | Chọn nhà cung cấp thực tế hỗ trợ yêu cầu của bản này | Chưa chốt nhà cung cấp |
| Ngưỡng eKYC | Hiệu chỉnh trên dữ liệu thử và lưu phiên bản | Chưa có ngưỡng nghiệm thu cuối cùng |
| Giới hạn file, NFR, dữ liệu sinh trắc | Giá trị đề xuất ở mục 10 và 12 | Cần xác nhận |

## 2. Vai trò và phân quyền

| Vai trò | Quyền | Giới hạn |
| --- | --- | --- |
| Owner | Thiết lập kho/chỉ định; eKYC; điểm danh; mua gói; báo còn sống; xem audit kho mình | Không sửa snapshot đang xét hoặc tự xóa kết luận chứng tử |
| Executor | Nộp/bổ sung chứng tử; xem bằng chứng người nhận được phân công; lịch/video; kết luận danh tính | Không duyệt chứng tử, đổi chỉ định hoặc đọc nội dung tài sản qua vai trò Executor |
| Beneficiary | Khởi tạo eKYC, cung cấp bằng chứng, video, nhận/từ chối, đọc theo grant | Chỉ thao tác hồ sơ mình; không sửa dữ liệu Owner đã chốt |
| Verifier | Xét chứng tử, xem kết quả Owner báo còn sống cần cho hồ sơ, kết luận phản đối | Không xác minh video Beneficiary hoặc cấp grant |
| Admin | RBAC, nhân sự đủ điều kiện, metadata tích hợp/audit, xử lý sự cố | Không duyệt eKYC thay Owner, xác nhận Beneficiary, duyệt chứng tử hoặc ghi đã trả tiền |

- **ROLE-01** [Must; MVP: Có]: Đăng ký app/Google tạo tài khoản thường; quyền staff chỉ được cấp qua quản trị hợp lệ.
- **ROLE-02** [Must; MVP: Có]: Quyền được kiểm tra theo đối tượng, phân công và trạng thái hiện hành ở backend.
- **ROLE-03** [Must; MVP: Có]: Executor và Verifier của cùng hồ sơ phải khác người và không tự xét mình là Beneficiary.
- **ROLE-04** [Must; MVP: Có]: Thu hồi vai trò hoặc khóa tài khoản chặn thao tác mới và phiên liên quan, giữ lịch sử.
- **ROLE-05** [Must; MVP: Có]: Việc Owner mời Executor không cấp quyền nội dung hoặc quyền quản trị cho người được mời.
- **ROLE-06** [Must; MVP: Có]: API của Admin/Executor/Verifier không đọc payload tài sản qua vai trò đó.

## 3. Tổng quan luồng

| Mã | Tên | Bắt đầu | Kết quả |
| --- | --- | --- | --- |
| F1 | Đăng nhập, đăng ký và thiết lập kho | Người dùng truy cập app | Nháp hoặc kế hoạch hoạt động sau eKYC và đủ điều kiện |
| F2A | Điểm danh | Đến kỳ | Kỳ tiếp theo hoặc việc kiểm tra cho Executor |
| F2B | Nộp và xác minh giấy chứng tử | Executor có giấy và phân công hợp lệ | Bổ sung, từ chối hoặc duyệt cho F3 |
| F2C | Owner báo còn sống | Owner gửi báo cáo khi có hồ sơ chứng tử | Kết luận phản đối và trạng thái kế hoạch phù hợp |
| F3 | Xác minh người nhận và bàn giao | Chứng tử được duyệt, snapshot hợp lệ, không có chặn | Grant riêng hoặc lượt/yêu cầu kết thúc |
| F4 | Quy trình tiếp nhận và quản lý sự cố | Lỗi/bất thường hoặc báo cáo hợp lệ | Đóng có căn cứ hoặc việc tiếp theo có người/hạn |
| P | Thanh toán SePay | Owner mua/gia hạn | Quyền dịch vụ hoặc giao dịch cần đối chiếu |

F2B không phụ thuộc phải trễ điểm danh trước. Phê duyệt chứng tử chỉ mở F3. F1 và F3 dùng chung tài khoản; eKYC có mục đích riêng, không là điều kiện cho mọi lần đăng nhập. F4 hỗ trợ các luồng, không thay người ra quyết định nghiệp vụ.

## 4. Dịch vụ eKYC dùng chung

### 4.1. Ba mục đích và kết quả

eKYC kiểm tra bằng chứng ảnh/video và tạo kết quả hỗ trợ. Backend vẫn cần đối chiếu chỉ định và kiểm tra quyền. Điểm model không phải xác suất một người có quyền nhận tài sản.

| Mục đích | Bằng chứng tham chiếu | Khi đạt | Khi cần xem xét |
| --- | --- | --- | --- |
| `OWNER_ENROLLMENT` | Căn cước và selfie trực tiếp | Hoàn tất điều kiện F1, tạo mẫu đăng ký đầu tiên | Chưa kích hoạt; thử lại/hỗ trợ, không có người duyệt thay |
| `BENEFICIARY_CLAIM` | Căn cước, selfie và chỉ định trong snapshot | Được đặt lịch video | Executor xem bằng chứng theo mục 7.2 |
| `OWNER_ALIVE` | Selfie mới và mẫu Owner đã đăng ký | Bằng chứng cho Verifier ở F2C | Giữ yêu cầu kiểm tra theo hạn; Verifier kết luận hồ sơ |

Kết quả nghiệp vụ eKYC: `PASSED`, `REVIEW_REQUIRED`, `FAILED`. Trạng thái phiên `ERROR`, `EXPIRED`, `CANCELLED` không được coi là kết luận sai danh tính. Lỗi chất lượng khi còn thu thập yêu cầu chụp lại, chưa tạo kết luận gian lận.

### 4.2. Quy trình ảnh và căn cước

1. Backend kiểm tra tài khoản/đối tượng/mục đích, hiển thị đồng ý và tạo phiên.
2. Với đăng ký Owner/người nhận, chụp hai mặt của mẫu thẻ được hỗ trợ.
3. Kiểm tra đủ thẻ, độ rõ, ánh sáng, vùng mặt và vùng dữ liệu.
4. Giải mã QR, xác định mẫu dữ liệu, trích các trường cần thiết.
5. OCR các trường trên mặt thẻ để đối chiếu; QR không đọc được thì dùng OCR dự phòng đủ tin cậy.
6. Kiểm tra số căn cước 12 chữ số, họ tên, ngày sinh, thời hạn của mẫu thẻ.
7. Backend tạo thử thách ngẫu nhiên cho camera, nhận bằng chứng đúng phiên.
8. Kiểm tra động tác, tính liên tục khuôn mặt, PAD và so mặt.
9. Với Beneficiary, đối chiếu dữ liệu được kiểm tra với chỉ định từ snapshot.
10. Lưu kết quả, lý do, model/ngưỡng và các liên kết bằng chứng được bảo vệ.

PaddleOCR có thể phát hiện vùng chữ, VietOCR nhận dạng các vùng đã cắt; hoặc dùng PaddleOCR cho cả pipeline nếu đo thử đạt hơn. Không coi VietOCR là công cụ tự sửa dấu của kết quả text. QR là dữ liệu đọc từ ảnh, không phải xác thực chữ ký hoặc đọc chip. Ngày hết hạn lấy từ vùng tương ứng của thẻ khi QR không có trường này.

### 4.3. Yêu cầu phiên và kiểm tra

- **EKYC-01** [Must; MVP: Có]: Phiên eKYC phải gắn `user_id`, mục đích, đối tượng và phiên bản dữ liệu tham chiếu ở backend.
- **EKYC-02** [Must; MVP: Có]: Backend lấy chỉ định Beneficiary từ snapshot, không lấy thông tin kỳ vọng do frontend cung cấp.
- **EKYC-03** [Must; MVP: Có]: Bắt đầu thu thập phải có bản ghi đồng ý theo mục đích và phiên bản thông báo dữ liệu.
- **EKYC-04** [Must; MVP: Có]: Hai mặt căn cước phải thuộc cùng một hồ sơ chụp và có trường cần thiết đủ rõ.
- **EKYC-05** [Must; MVP: Có]: Chất lượng ảnh không đủ phải trả hướng dẫn chụp lại cụ thể.
- **EKYC-06** [Must; MVP: Có]: Dữ liệu QR phải được kiểm tra cấu trúc theo mẫu thẻ trước khi dùng.
- **EKYC-07** [Must; MVP: Có]: QR/OCR khác nhau ở trường bắt buộc phải chuyển chụp lại hoặc xem xét, không tự chọn kết quả thuận lợi.
- **EKYC-08** [Must; MVP: Có]: Số căn cước phải giữ đủ 12 ký tự số, bao gồm số 0 đầu, dưới dạng chuỗi.
- **EKYC-09** [Must; MVP: Có]: Ngày sinh và thời hạn phải được kiểm tra theo mẫu thẻ đã hỗ trợ, không suy diễn ngày hết hạn từ QR thiếu dữ liệu.
- **EKYC-10** [Must; MVP: Có]: Backend phải tạo thử thách có thứ tự ngẫu nhiên, nonce và hạn phiên.
- **EKYC-11** [Must; MVP: Có]: Hướng dẫn động tác phía trình duyệt không thay kiểm tra bằng chứng tại server.
- **EKYC-12** [Must; MVP: Có]: Bằng chứng phải giữ một khuôn mặt liên tục trong phiên; thay người phải kết thúc lần thử đó.
- **EKYC-13** [Must; MVP: Có]: So khớp phải dùng selfie được lấy từ phiên thử thách đã đạt và ảnh căn cước của cùng phiên.
- **EKYC-14** [Must; MVP: Có]: Kết quả PAD, động tác và so mặt được kiểm tra độc lập trước khi xác định `PASSED`.
- **EKYC-15** [Must; MVP: Có]: Ngưỡng, model và cấu hình quyết định do backend quản lý và được ghi phiên bản cùng kết quả.
- **EKYC-16** [Must; MVP: Có]: Frontend không được ghi đè trường đã đọc để tự chuyển kết quả thành đạt.
- **EKYC-17** [Must; MVP: Có]: Phiên hết hạn, sai tài khoản, sai mục đích hoặc đã được tiêu thụ không được tái sử dụng cho quyết định khác.
- **EKYC-18** [Must; MVP: Có]: API model nội bộ phải được xác thực và chỉ nhận công việc từ backend được phép.
- **EKYC-19** [Must; MVP: Có]: Lỗi model/hạ tầng phải tạo trạng thái lỗi kỹ thuật, không tạo kết luận gian lận.
- **EKYC-20** [Must; MVP: Có]: Giới hạn thử áp dụng theo tài khoản/mục đích/đối tượng và nguồn truy cập, không khóa toàn kho chỉ vì người ngoài thử thất bại.
- **EKYC-21** [Must; MVP: Có]: Người không dùng được mẫu thẻ hoặc động tác được hỗ trợ phải nhận thông báo giới hạn và hướng xử lý phù hợp với mục đích.
- **EKYC-22** [Must; MVP: Có]: Mẫu Owner đầu tiên chỉ được tạo từ selfie trực tiếp của phiên đăng ký đã đạt.
- **EKYC-23** [Must; MVP: Có]: Mẫu Owner đã có không được thay bằng ảnh hoặc mật khẩu đơn thuần; cập nhật mẫu qua UI ngoài phạm vi bản này.
- **EKYC-24** [Must; MVP: Có]: Owner đã có mẫu khi kích hoạt thêm kế hoạch phải chứng minh cùng danh tính; không tự ghi đè mẫu gốc.
- **EKYC-25** [Must; MVP: Có]: eKYC đạt không tạo grant, phê duyệt chứng tử hoặc kết luận pháp lý về giấy tờ.
- **EKYC-26** [Must; MVP: Có]: Selfie báo còn sống phải so với đúng phiên bản mẫu đã gắn Owner, không dùng ảnh tham chiếu tự tải lên.
- **EKYC-27** [Must; MVP: Có]: Enrollment đạt gắn số căn cước/họ tên/ngày sinh Owner với tài khoản và mẫu; hồ sơ chứng tử phải đối chiếu đúng dữ liệu này, không chỉ tên kho hoặc email.

### 4.4. Đối chiếu chỉ định

- **MATCH-01** [Must; MVP: Có]: Số căn cước của bằng chứng đã kiểm tra phải trùng chính xác số trong chỉ định để nhánh tự động đạt.
- **MATCH-02** [Must; MVP: Có]: Họ tên đối chiếu sau chuẩn hóa Unicode, khoảng trắng và hoa/thường; không tự bỏ dấu hoặc dùng tên gần giống để cho đạt.
- **MATCH-03** [Must; MVP: Có]: Ngày sinh phải trùng sau chuẩn hóa định dạng ngày.
- **MATCH-04** [Must; MVP: Có]: Khác biệt OCR chưa rõ phải có kết quả gốc và lý do để Executor xem xét hoặc yêu cầu chụp lại.
- **MATCH-05** [Must; MVP: Có]: Căn cước khác rõ ràng với chỉ định phải đóng yêu cầu sai người; không thay số chỉ định để hợp thức hóa.
- **MATCH-06** [Must; MVP: Có]: Trường hợp nghi Owner nhập sai phải được ghi không đủ căn cứ/xem xét có bằng chứng; Executor/Admin không được sửa snapshot hoặc chọn Beneficiary mới.
- **MATCH-07** [Must; MVP: Có]: Email/số điện thoại của tài khoản và chỉ định không tham gia quyết định khớp danh tính trong F3.

### 4.5. Giới hạn và đo lường

Không đọc NFC, không xác thực dân cư/hộ tịch và không cam kết chống mọi deepfake/camera ảo. FaceLandmarker đo landmarks/biểu cảm; PAD RGB có thể thay đổi theo thiết bị/ánh sáng. Nhóm phải đo riêng selfie–ảnh căn cước và selfie mới–mẫu selfie. Không lấy ngưỡng cosine 0.363 hoặc PAD 0.7 của prototype làm ngưỡng nghiệm thu mặc định.

Trước khi sử dụng quyết định tự động, phải có cấu hình đã được hiệu chỉnh và báo cáo thử được chấp thuận. Báo cáo ghi số người, số cặp đúng/khác, thiết bị, mẫu thẻ, lỗi theo trường, nhận nhầm/từ chối nhầm và loại tấn công đã thử. Không có lỗi trong một bộ thử nhỏ không chứng minh tỷ lệ sai ngoài thực tế bằng 0.

## 5. F1 — Đăng nhập, đăng ký và thiết lập kho

Người dùng tạo tài khoản, lưu tài sản mã hóa và chọn người nhận. Kế hoạch chỉ hoạt động sau khi Owner đạt eKYC, có gói dịch vụ phù hợp và Executor nhận nhiệm vụ. Beneficiary chưa được thông báo về di sản ở giai đoạn này.

### 5.1. Tài khoản app và Google

1. Chọn email/mật khẩu hoặc Google.
2. App xác minh email đăng ký; Google được kiểm tra token tại backend.
3. Tạo/khôi phục phiên của `user_id` ổn định; trả về đường dẫn nội bộ đã kiểm tra.
4. Nếu đang mở lời mời, quay lại đúng lời mời rồi vào eKYC; không yêu cầu email/điện thoại tài khoản trùng chỉ định.
5. Nếu tạo kế hoạch, vào thiết lập kho. Đăng nhập thành công không tự hoàn tất eKYC, điểm danh hoặc cấp quyền di sản.

- **AUTH-01** [Must; MVP: Có]: Google dùng `sub` ổn định; backend kiểm tra chữ ký, `aud`, `iss`, `exp` và CSRF/nonce/state phù hợp cách tích hợp. [Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- **AUTH-02** [Must; MVP: Có]: Email Google trùng tài khoản app chưa liên kết phải xác thực tài khoản app trước khi liên kết; không tự gộp quyền chỉ từ email.
- **AUTH-03** [Must; MVP: Có]: Tài khoản Google không bắt buộc có mật khẩu app; thêm/bỏ phương thức đăng nhập cần xác thực lại và còn ít nhất một phương thức.
- **AUTH-04** [Must; MVP: Có]: Email đăng ký app phải được xác minh. Email Google chỉ được tin theo token và thẩm quyền của nhà cung cấp; trường hợp cần thiết xác minh quyền kiểm soát riêng. Xác minh tài khoản không đối chiếu liên hệ của chỉ định.
- **AUTH-05** [Must; MVP: Có]: Tên/ảnh Google và khôi phục tài khoản không tự xác nhận danh tính, gỡ hold hoặc tạo grant.
- **AUTH-06** [Must; MVP: Có]: Sau xác thực từ lời mời, backend khôi phục đúng ngữ cảnh token/lượt; `return_url` không cho chuyển đến địa chỉ tùy ý bên ngoài.

### 5.2. Tạo kho, tài sản, gói và chỉ định

1. Tạo kho nháp; chọn/mua gói dịch vụ theo mục 8.
2. Upload file hoặc nhập bản ghi tài sản. Backend kiểm tra định dạng/quota, mã hóa và lưu phiên bản.
3. Owner tự tạo gói và đưa tài sản vào gói; không tự gom gói theo tập người nhận.
4. Nhập người nhận: họ tên, ngày sinh, số căn cước 12 chữ số; ít nhất một kênh email/điện thoại dùng được để gửi lời mời. Khuyến nghị có cả hai kênh.
5. Chỉ định một hoặc nhiều người nhận cùng gói. Mỗi người có lượt và quyền riêng.
6. Mời Executor chính; có thể mời người dự phòng. Hệ thống lưu phạm vi và chấp thuận nhiệm vụ.
7. Owner chọn chu kỳ điểm danh và thời gian chờ; đọc chính sách nhận/tải/lưu/xóa.
8. Owner đồng ý xử lý dữ liệu eKYC, chụp thẻ, thực hiện thử thách selfie và đạt eKYC đăng ký.
9. Backend kiểm tra tất cả điều kiện và kích hoạt; khởi tạo kỳ điểm danh.

- **SETUP-01** [Must; MVP: Có]: Kích hoạt cần tài khoản đủ điều kiện, email xác minh, gói trả phí còn hạn, Owner eKYC `PASSED`, Executor chính chấp nhận và ít nhất một gói có tài sản/chỉ định hợp lệ.
- **SETUP-02** [Must; MVP: Có]: Không thông báo di sản cho Beneficiary ở F1; không tạo tài khoản hoặc sự đồng ý xử lý dữ liệu thay họ.
- **SETUP-03** [Must; MVP: Có]: Một phiên bản tài sản thuộc tối đa một gói hiệu lực; nhiều người cùng gói đều được chỉ định nhận toàn bộ nội dung bằng quyền độc lập.
- **SETUP-04** [Must; MVP: Có]: Owner quản lý gói trực tiếp và chủ động chọn tài sản/người nhận; thay đổi tạo phiên bản, không tự gom mọi tài sản có cùng tập người nhận.
- **SETUP-05** [Must; MVP: Có]: Nộp chứng tử thành công ghim snapshot có phiên bản nội dung thực tế; thay đổi sau đó không làm đổi snapshot đang xét.
- **SETUP-06** [Must; MVP: Có]: Khi còn quyền quản lý, Owner được đổi/thu hồi Executor; người thay thế phải chấp nhận. Không dùng thay nhân sự để sửa chỉ định đang ghim hoặc gỡ hold.
- **SETUP-07** [Must; MVP: Có]: Chỉ định dùng ID nội bộ riêng; gắn tài khoản người nhận chỉ sau bằng chứng và xác minh đúng người, không từ email hoặc tên giống nhau.
- **SETUP-08** [Must; MVP: Có]: Số căn cước, họ tên và ngày sinh là bắt buộc đối với chỉ định mới đủ điều kiện kích hoạt; dữ liệu cũ thiếu thông tin phải được Owner hoàn thiện, không tự suy đoán.
- **SETUP-09** [Must; MVP: Có]: Owner phải thấy cảnh báo về hạn phản hồi, hạn tải và khả năng xóa trước khi kích hoạt; lưu phiên bản chính sách đã chấp thuận.
- **SETUP-10** [Should; MVP: Có]: Executor dự phòng được khuyến nghị; chỉ người Owner đã cho phép và đã chấp nhận mới được thay người chính. Chưa có dự phòng phải hiển thị nguy cơ đình trệ.
- **SETUP-11** [Must; MVP: Có]: Owner eKYC lỗi/cần xem xét/không đạt chỉ được thử lại hoặc nhận hỗ trợ kỹ thuật; Admin/Executor/Verifier không có đường duyệt thay để kích hoạt.
- **ASSET-01** [Must; MVP: Có]: Mỗi file/bản ghi có ID, phiên bản, checksum và DEK riêng; sau nhận được đọc từng tài sản thuộc đúng phiên bản gói.
- **ASSET-02** [Must; MVP: Có]: Bí mật bản ghi tài khoản/ví nằm trong payload mã hóa; không đưa mật khẩu/seed phrase vào tên, metadata tìm kiếm hoặc thông báo.
- **ASSET-03** [Must; MVP: Có]: Tài sản ngoài gói/chỉ định hợp lệ được ghi ngoài kế hoạch, không tự bàn giao.
- **ASSET-04** [Must; MVP: Có]: File không hỗ trợ/lỗi/vượt quota bị từ chối có lý do; lưu đồng thời kiểm tra cả số lượng và byte trong giao dịch thích hợp.
- **ASSET-05** [Must; MVP: Có]: Di chúc Owner tự lưu có thể là tài sản nhưng không thành giấy tờ bắt buộc cho F2B.

### 5.3. Ví dụ và ngoại lệ

Owner tạo gói “Tài liệu gia đình”, chỉ định A và B rồi mời Executor. A/B không nhận thông báo lúc lập. Owner đạt eKYC nhưng Executor chưa nhận nhiệm vụ thì kế hoạch vẫn nháp. Lỗi upload không xóa tài sản cũ; lỗi eKYC không được ghi thành giả mạo khi chưa có căn cứ.

## 6. F2 — Điểm danh, chứng tử và Owner báo còn sống

Điểm danh phát hiện việc cần kiểm tra; không chứng minh Owner đã mất. Executor có thể nộp chứng tử khi có giấy mà không cần đợi trễ điểm danh. Hệ thống báo Owner và chỉ cho Verifier duyệt sau cửa sổ phản đối, nếu không có chặn chưa giải quyết.

### 6.1. F2A — Điểm danh

1. Hệ thống tính kỳ tiếp theo từ lần điểm danh hợp lệ theo cấu hình kế hoạch.
2. Gửi nhắc theo lịch; Owner đăng nhập và chủ động bấm điểm danh.
3. Backend kiểm tra quyền/trạng thái, ghi điểm danh và kỳ kế tiếp.
4. Đến hạn chưa điểm danh: vào thời gian chờ, tiếp tục nhắc.
5. Hết thời gian chờ: tạo việc cho Executor kiểm tra liên hệ và tình trạng Owner.
6. Chưa có chứng tử được duyệt: kho chưa được bàn giao và chưa mời Beneficiary.

- **DMS-01** [Must; MVP: Có]: Chu kỳ đề xuất 30/60/90 ngày, mặc định 30; thời gian chờ 7/14/30 ngày, mặc định 7. Lưu lựa chọn và phiên bản cấu hình của kế hoạch.
- **DMS-02** [Must; MVP: Có]: Đăng nhập/thanh toán không phải điểm danh; job lặp không tạo nhiều việc cho cùng kỳ.
- **DMS-03** [Must; MVP: Có]: Trễ điểm danh/hết thời gian chờ không tự mở kho hoặc khởi động hạn F3.
- **DMS-04** [Must; MVP: Có]: Khi đã có hồ sơ chứng tử, hành động báo còn sống đi F2C; không dùng login/điểm danh để tự xóa hồ sơ.
- **DMS-05** [Must; MVP: Có]: Owner chưa rõ tình trạng thì giữ bảo vệ dữ liệu và điều phối có người/hạn rà soát; không áp dụng mốc xóa F3 trước khi F3 bắt đầu.
- **DMS-06** [Should; MVP: Có]: Nhắc đề xuất trước hạn điểm danh 7 ngày, 1 ngày, khi vào thời gian chờ và còn 2 ngày chờ; retry theo khóa thông báo, không gửi mỗi lần job chạy.

### 6.2. F2B — Nộp và xét chứng tử

1. Executor hợp lệ chọn Owner/kho được phân công.
2. Nhập họ tên/số căn cước Owner, ngày mất, số giấy, ngày cấp, nơi cấp; upload giấy chứng tử đủ trang. Không yêu cầu mục “giấy tờ liên quan” chung chung.
3. Executor kiểm tra thông tin, xác nhận khai báo và gửi. Backend ghi phiên bản hồ sơ, ghim snapshot và phân công Verifier đủ điều kiện.
4. Hệ thống gửi thông báo hồ sơ cho Owner qua các kênh đã đăng ký; nêu hạn phản đối, cách báo còn sống và mã hồ sơ. Có audit giao thông báo.
5. Cửa sổ phản đối chạy theo mục 10. Verifier được xem sơ bộ/yêu cầu bổ sung, chưa được phê duyệt trong thời gian này.
6. Hệ thống gắn cờ nếu có điểm danh hợp lệ sau ngày mất hoặc dữ liệu bất nhất; xử lý theo F2C/F4, không tự phê duyệt.
7. Verifier đối chiếu thông tin và các trang giấy: **yêu cầu bổ sung / từ chối / phê duyệt**; ghi căn cứ và phiên bản đã xét.
8. Phê duyệt cần hết cửa sổ phản đối, không có phản đối/hold chưa kết luận, Executor đã xác nhận đúng bản và Verifier hợp lệ.
9. Verifier xác nhận điện tử trong ứng dụng. Backend ghi quyết định, người, thời điểm và phiên bản; chuyển điều kiện F3.

- **DEATH-01** [Must; MVP: Có]: Chỉ bắt giấy chứng tử đủ trang; thiếu/mờ yêu cầu bổ sung đúng phần và giữ lịch sử các lần nộp.
- **DEATH-02** [Must; MVP: Có]: Verifier kiểm tra hồ sơ trong phạm vi ứng dụng; xem ảnh hoặc OCR không chứng minh giấy thật, không tự nhận đã đối chiếu cơ sở dữ liệu hộ tịch.
- **DEATH-03** [Must; MVP: Có]: Xác nhận điện tử là hành động phê duyệt có xác thực và audit; không được gọi là chữ ký số công chứng/chứng thực nếu chưa tích hợp tương ứng.
- **DEATH-04** [Must; MVP: Có]: Upload sửa/bổ sung tạo phiên bản và cần Executor xác nhận bản mới; quyết định gắn đúng phiên bản, không ghi đè giấy đã xét.
- **DEATH-05** [Must; MVP: Có]: Mỗi kho có tối đa một hồ sơ chứng tử hoạt động cùng phạm vi; hồ sơ mới sau từ chối liên kết lịch sử cũ.
- **DEATH-06** [Must; MVP: Có]: Duyệt chứng tử chỉ mở F3; không giải mã và không cấp grant.
- **DEATH-07** [Must; MVP: Có]: Nghi giả mạo/Owner báo còn sống tạo việc kiểm tra, chặn phát hành mới; không tuyên bố thu hồi được file đã tải ra ngoài.
- **DEATH-08** [Must; MVP: Có]: Mọi kênh Owner cấu hình được đưa vào kế hoạch giao thông báo; cần ít nhất một bằng chứng giao thành công trước khi chạy cửa sổ. Lỗi tất cả kênh tạo sự cố, có người/hạn xử lý; không tự coi im lặng là đã được báo.
- **DEATH-09** [Must; MVP: Có]: Không phê duyệt khi cửa sổ chưa hết hoặc đang có phản đối/hold cần kết luận; yêu cầu bổ sung/từ chối có thể thực hiện sớm.
- **DEATH-10** [Must; MVP: Có]: Điểm danh hợp lệ sau ngày mất ghi trên hồ sơ tạo cờ mâu thuẫn có căn cứ và chặn phê duyệt cho đến khi được xét; không kết luận thật/giả chỉ từ timestamp.
- **DEATH-11** [Must; MVP: Có]: Chỉnh dữ liệu trọng yếu, như danh tính Owner/ngày mất sau khi đã thông báo, cần thông báo lại và cửa sổ mới cho phiên bản đó; giữ lịch sử, giới hạn lạm dụng bằng sự cố có phân công.

### 6.3. F2C — Owner báo còn sống

1. Owner đăng nhập, xem hồ sơ liên quan và bấm **“Tôi còn sống”**. Backend kiểm tra đúng tài khoản Owner và ghi lần báo đầu.
2. Chặn ngay phê duyệt chứng tử, lời mời mới và grant mới cho phạm vi hồ sơ; thông báo Verifier/Executor, tạo sự cố theo dõi.
3. Owner thực hiện selfie trực tiếp với thử thách; backend so với mẫu khuôn mặt đã đạt ở F1. Đăng nhập lại không thay bước này.
4. Có kết quả đạt: Verifier xem bằng chứng, mâu thuẫn chứng tử và audit rồi kết luận Owner còn sống hoặc cần làm rõ.
5. Chưa đạt/lỗi: cho thử lại có hạn; đề xuất tối đa 7 ngày từ lần báo đầu. Báo nhiều lần không gia hạn.
6. Hết hạn hoặc thất bại: chuyển Verifier kết luận dựa trên hồ sơ. Không tự duyệt chứng tử hoặc giữ chặn vô hạn chỉ vì nút đã bấm.
7. Kết luận **Owner còn sống**: đóng/từ chối hồ sơ chứng tử vì phản đối được xác nhận, hủy tiến trình F3 chưa hoàn tất, thu hồi quyền chưa phát hành và kiểm tra grant đã có theo phạm vi sự cố.
8. Đưa kế hoạch về hoạt động nếu còn đủ điều kiện; nếu dịch vụ hết hạn thì về trạng thái cần gia hạn. Đặt lại kỳ điểm danh, gỡ đúng chặn đã giải quyết, đóng việc theo dõi.
9. Kết luận **phản đối không được xác nhận**: ghi lý do, đóng báo cáo; hồ sơ chứng tử vẫn cần quyết định riêng và hết các chặn khác trước F3.
10. **Chưa đủ căn cứ**: yêu cầu bổ sung/xem lại chứng tử có người/hạn. Báo cáo còn sống được kết thúc theo kết luận, nhưng chặn mới do mâu thuẫn hồ sơ có căn cứ phải được quản lý riêng.

- **ALIVE-01** [Must; MVP: Có]: Báo còn sống hợp lệ từ tài khoản Owner lập tức chặn hành động phát hành mới của hồ sơ; thao tác nhận đồng thời phải kiểm tra chặn trong cùng giao dịch.
- **ALIVE-02** [Must; MVP: Có]: Selfie mới được kiểm tra với mẫu đăng ký của Owner, đúng phiên bản; mật khẩu, Google hoặc ảnh tải lại không đủ xác nhận sống.
- **ALIVE-03** [Must; MVP: Có]: Hạn xác minh tính từ lần báo đầu được tiếp nhận; lặp báo cáo/retry không đặt lại 7 ngày đề xuất.
- **ALIVE-04** [Must; MVP: Có]: Hết hạn/thất bại eKYC tạo việc kết luận cho Verifier, không tự duyệt chứng tử và không tự kết luận Owner chết.
- **ALIVE-05** [Must; MVP: Có]: Verifier phải ghi kết luận, bằng chứng/lý do; bác phản đối không đồng nghĩa phê duyệt chứng tử.
- **ALIVE-06** [Must; MVP: Có]: Khi xác nhận sống, cập nhật hồ sơ, lượt chưa phát hành, hold và kế hoạch trong giao dịch/quy trình chống lặp; reset điểm danh không hồi sinh grant đã hết hạn.
- **ALIVE-07** [Must; MVP: Có]: Grant đang có được chặn/thu hồi theo kết luận và phạm vi sự cố có audit; bản tải trước đó không thể bảo đảm thu hồi. Thông báo cho người đã được mời/nhận cần thiết.
- **ALIVE-08** [Must; MVP: Có]: Verifier quá hạn thì nhắc/điều phối người đủ điều kiện; không tự xóa yêu cầu hoặc tiếp tục F3. Ngày rà soát và lý do giữ phải hiển thị.
- **ALIVE-09** [Must; MVP: Có]: Báo lặp cùng phiên bản chứng tử gắn báo cáo đầu, không tạo hạn/hold mới chỉ từ nút bấm. Sau kết luận bác/chưa đủ căn cứ, mở lại cần bằng chứng mới được đánh giá hợp lệ, như phiên báo sống mới đạt; không cho người biết mật khẩu lặp nút để chặn vô hạn.

### 6.4. Phân công và dự phòng

- **ASSIGN-01** [Must; MVP: Có]: Verifier chọn từ pool staff đủ vai trò/trạng thái, đề xuất xoay vòng; Admin được điều chỉnh hợp lệ và ghi lý do. Executor do Owner mời phải chấp nhận.
- **ASSIGN-02** [Must; MVP: Có]: Người không khả dụng được thay theo phân công hợp lệ; Executor chỉ thay bằng người Owner đã cho phép/dự phòng chấp nhận, Admin không tự chọn người lạ.
- **ASSIGN-03** [Must; MVP: Có]: Người mới nhận phân công và tự kết luận hành động mới; không sửa quyết định lịch sử hoặc giả lập chấp thuận người mới.
- **ASSIGN-04** [Must; MVP: Có]: Việc chờ có người phụ trách, hạn và cảnh báo quá hạn; quá hạn không tự xác minh đạt/cấp quyền.
- **ASSIGN-05** [Must; MVP: Có]: Nếu không có Executor thay thế hợp lệ, ghi đình trệ và chính sách rà soát có hạn; không cấp quyền cho Admin để giải quyết bằng mở kho.

### 6.5. Ví dụ dòng thời gian

Ngày 0 nộp chứng tử và có bằng chứng giao thông báo Owner. Với cấu hình đề xuất, đến giờ thứ 72 mới có thể duyệt nếu không phản đối. Owner báo còn sống ở giờ 48: chặn ngay, có 7 ngày từ lần báo đó để xác minh; nếu chưa đủ thì Verifier kết luận trong 48 giờ đề xuất. Đồng hồ phản đối không trở thành lý do duyệt khi còn hold chưa giải quyết.

## 7. F3 — Xác minh người nhận và bàn giao tài sản

Luồng bắt đầu **sau khi chứng tử được duyệt**. Người nhận đăng nhập, eKYC, đặt lịch và video với Executor. Chỉ sau khi đúng danh tính và chủ động đồng ý nhận mới có quyền xem/tải. Các người cùng nhận một gói không phải đồng ý cùng lúc.

### 7.1. Lời mời và phản hồi

1. Backend kiểm tra hồ sơ đã duyệt, snapshot/phân công hợp lệ và không có hold ngăn F3.
2. Tạo một lượt cho mỗi chỉ định/gói; gửi link đến kênh Owner đã lưu, chưa chứa nội dung tài sản.
3. Bắt đầu 5 ngày phản hồi khi có bằng chứng giao ít nhất một kênh. Nhắc khi còn 2 ngày.
4. Người nhận mở link, đăng nhập/đăng ký và xác minh tài khoản theo F1. App quay về đúng lượt, cho bắt đầu eKYC ngay.
5. Bấm tiếp tục nhận và bắt đầu xác minh ghi phản hồi có xác thực. Phản hồi chưa chứng minh đúng người và không tự giữ cleanup.
6. Không phản hồi sau 5 ngày: kết thúc thời gian phản hồi ban đầu, chưa ghi từ chối; kho còn khóa và link còn dùng trong thời gian lưu nếu còn hiệu lực.

- **INVITE-01** [Must; MVP: Có]: Token ngẫu nhiên đủ mạnh chỉ gắn lượt/chỉ định, được lưu dạng giá trị kiểm tra bảo vệ; không chứa CCCD, nội dung tài sản hoặc khóa.
- **INVITE-02** [Must; MVP: Có]: Hết 5 ngày không tự thu hồi link; token còn hiệu lực theo trạng thái lượt, hạn lưu và dữ liệu. Gửi lại không đổi người nhận/đặt lại thời hạn.
- **INVITE-03** [Must; MVP: Có]: Click, quét email và mở URL không ghi phản hồi; trước xác thực không công khai tên Owner/tài sản từ token.
- **INVITE-04** [Must; MVP: Có]: Gửi lỗi có retry/sự cố; không ghi đã giao giả hoặc chạy hạn khi chưa có bằng chứng giao thành công.
- **CLAIM-01** [Must; MVP: Có]: Tài khoản đủ điều kiện được vào eKYC từ lời mời mà không có cổng khớp email/điện thoại chỉ định.
- **CLAIM-02** [Must; MVP: Có]: Link được chuyển tiếp, đăng nhập thành công hoặc tên giống nhau không gắn quyền; account, claim, designation và grant lưu riêng.
- **CLAIM-03** [Must; MVP: Có]: Tối đa một yêu cầu hoạt động của một tài khoản trên một chỉ định; có rate limit. Chỉ xung đột có bằng chứng danh tính đủ điều kiện mới giữ phạm vi liên quan; tài khoản bất kỳ mở claim không chặn toàn kho.
- **CLAIM-04** [Must; MVP: Có]: Bỏ trước xác minh ghi `WITHDRAWN_BY_CLAIMANT`, chỉ đóng claim đó; không ghi Beneficiary thật từ chối hoặc xóa kho.
- **CLAIM-05** [Must; MVP: Có]: Chỉ trả metadata cần cho bước hiện tại; không trả danh sách tài sản, số căn cước mong đợi hoặc điểm giúp dò hồ sơ cho người chưa xác minh.
- **CLAIM-06** [Must; MVP: Có]: Đề xuất claim đủ điều kiện có tối đa 30 ngày xử lý danh tính từ lần tiếp nhận đủ đầu tiên đến kết luận video; mở lại/bổ sung lặp không reset. Lỗi staff/hệ thống xác nhận chỉ tạm dừng theo TIME-04; hết hạn chưa đủ thì đóng chưa hoàn tất và tiếp tục thời gian lưu còn lại.

### 7.2. eKYC và đối chiếu chỉ định

1. Backend mở phiên `BENEFICIARY_CLAIM`, gắn tài khoản/claim/chỉ định/snapshot.
2. Người nhận đồng ý xử lý dữ liệu, chụp hai mặt căn cước, hoàn tất thử thách trực tiếp.
3. Backend đọc QR/OCR, kiểm tra giấy, PAD và so selfie–ảnh thẻ; so số căn cước, tên, ngày sinh với snapshot.
4. **Đạt và khớp:** chuyển đặt lịch, chưa có quyền tài sản.
5. **Cần xem xét:** Executor được phân công xem bằng chứng cần thiết; có thể yêu cầu chụp lại/bổ sung hoặc xác nhận đủ căn cứ đi video, chưa xác nhận đúng người cuối cùng.
6. **Không đạt:** nói rõ nhóm lỗi và bước thử lại phù hợp, giới hạn lần thử; khác số căn cước rõ ràng thì đóng sai người. Không sửa snapshot cho vừa người đang yêu cầu.
7. Phiên lỗi/hết hạn chưa có kết luận: thử lại có hạn hoặc hỗ trợ; không tự coi lừa đảo.

- **REVIEW-01** [Must; MVP: Có]: Hồ sơ cần xem xét phải có đủ dữ liệu/evidence và lý do; Executor chỉ xem claim được phân công, không Admin duyệt danh tính thay.
- **REVIEW-02** [Must; MVP: Có]: Executor chỉ xác nhận đủ căn cứ đi video khi số căn cước, tên, ngày sinh được đối chiếu đáng tin và không có dấu hiệu giả mạo chưa giải quyết; thiếu/sai căn cước không có đường bỏ qua.
- **REVIEW-03** [Must; MVP: Có]: Lỗi OCR có thể được sửa kết quả trích xuất từ ảnh gốc với audit; không sửa chỉ định Owner hoặc ghi model đã đạt khi thực tế chưa đạt.
- **REVIEW-04** [Must; MVP: Có]: Giữ xóa ngắn hạn cho hồ sơ xem xét chỉ khi backend đánh giá đủ bằng chứng liên quan đến đúng chỉ định; bắt đầu từ hồ sơ đủ đầu tiên, giới hạn 7 ngày đề xuất, yêu cầu lặp không kéo dài.
- **REVIEW-05** [Must; MVP: Có]: Thiếu bằng chứng sau hạn thì đóng không đủ căn cứ, tiếp tục hạn lưu còn lại; không tự cấp grant.

### 7.3. Đặt lịch và vào video trong app

1. Người đủ điều kiện chọn lịch trống của Executor; mỗi người nhận có lịch riêng.
2. Backend kiểm tra xung đột và lưu lịch nguyên tử. Không khả dụng thì chọn lại, không coi là từ chối nhận.
3. Gửi xác nhận hai bên; nhắc trước 5 giờ hoặc ngay khi đặt sát giờ.
4. Đến giờ, hai bên vào phòng trong app bằng quyền tham gia server cấp; mã/link phòng chỉ giúp định tuyến.
5. Chờ tối đa 15 phút đề xuất. Người nhận không vào: nhắc, chờ phản hồi/hẹn lại trong hạn; tối đa 2 lần hẹn lại do no-show người nhận.
6. Executor vắng/lỗi mạng/hệ thống: ghi đúng nguyên nhân, hỗ trợ hoặc thay đúng người; không tăng lượt lỗi người nhận do lỗi staff/hệ thống.
7. Không phản hồi quá hạn: đóng claim hết hạn, không kết luận sai người hoặc Beneficiary thật từ chối.

- **SCHEDULE-01** [Must; MVP: Có]: Mỗi claim có tối đa một lịch hiệu lực; đặt đồng thời/retry không tạo trùng; hủy/đổi thông báo hai bên và vô hiệu phòng cũ.
- **SCHEDULE-02** [Must; MVP: Có]: Không đặt được lịch không phải từ chối; phân biệt no-show người nhận với lỗi staff/kỹ thuật và quản lý hạn theo nguyên nhân.
- **SCHEDULE-03** [Must; MVP: Có]: Token video do server cấp cho đúng participant/phòng/thời hạn; người khác, phân công cũ và token hết hạn bị chặn; mã phòng không là quyền tài sản.
- **SCHEDULE-04** [Must; MVP: Có]: Hẹn lại có hạn phản hồi và giới hạn; sự cố được xác nhận chỉ tạm dừng đúng đồng hồ, không tự reset toàn bộ hạn lưu.
- **SCHEDULE-05** [Must; MVP: Có]: Đề xuất lịch video không quá 14 ngày từ lúc đặt và không vượt hạn claim còn lại; thiếu slot tạo việc điều phối, không cho tự đặt lịch nhiều năm sau để giữ dữ liệu.

### 7.4. Executor kết luận danh tính

1. Người nhận bật camera, xuất trình giấy đã dùng eKYC; Executor đối chiếu mặt trực tiếp, ảnh trên thẻ và dữ liệu chỉ định cần thiết.
2. Executor xác nhận hai việc riêng: **đủ điều kiện quan sát** và **đúng người được chỉ định**.
3. Mạng/ảnh không đủ quan sát: ghi sự cố và hẹn lại; không kết luận sai danh tính.
4. Bằng chứng thiếu nhưng có thể bổ sung: yêu cầu đúng nội dung và hạn; chưa mở kho.
5. Sai người/bằng chứng không hợp lệ rõ ràng: từ chối claim, ghi lý do; nếu nghi lạm dụng tạo F4. Không thay Beneficiary hoặc hủy phần của người khác.
6. Đúng người: Executor bấm **“Xác nhận đúng người”**; backend kiểm tra phân công, claim, phiên bản, thời hạn và hold, ghi kết luận.
7. Hệ thống gắn đúng tài khoản với chỉ định và gửi thông báo sẵn sàng nhận. Tài sản vẫn chưa được đọc.

- **IDENTITY-01** [Must; MVP: Có]: eKYC đạt hoặc được xét đủ căn cứ vẫn bắt buộc video thật với Executor; không thay bằng tự duyệt ảnh hoặc kết quả giả lập.
- **IDENTITY-02** [Must; MVP: Có]: “Đủ điều kiện quan sát” khác “Đúng người”; lỗi kỹ thuật không là bằng chứng sai người.
- **IDENTITY-03** [Must; MVP: Có]: Kết luận lưu người thực hiện, tài khoản, claim/chỉ định/snapshot, bằng chứng tham chiếu, thời điểm, kết quả/lý do; không nhúng ảnh/vectors trong log.
- **IDENTITY-04** [Must; MVP: Có]: Đúng danh tính chỉ chuyển `READY_TO_ACCEPT`; chưa tạo grant hoặc giải mã cho Beneficiary.
- **IDENTITY-05** [Must; MVP: Có]: Một chỉ định có tối đa một tài khoản được gắn hợp lệ trong một lượt; claim khác đủ bằng chứng tạo tranh chấp được xét trước grant, không tự ghi đè tài khoản.

### 7.5. Đồng ý hoặc từ chối nhận

1. Người đã xác minh thấy phạm vi gói ở mức phù hợp và hạn quyết định 7 ngày từ giao thông báo sẵn sàng; chưa đọc payload.
2. **Đồng ý nhận:** backend kiểm tra toàn bộ điều kiện trong giao dịch, tạo một commit bàn giao và một grant riêng; bắt đầu 7 ngày xem/tải.
3. **Từ chối:** xác nhận quyết định và ghi lượt `DECLINED`, thu hồi lời mời/quyền chưa tạo của người này; không chuyển sang người khác.
4. Hết hạn quyết định: lượt `DECISION_EXPIRED`; không tự xem là đã nhận hoặc tự bắt đầu hạn tải.

- **ACCEPT-01** [Must; MVP: Có]: Grant chỉ tạo cho đúng tài khoản đã xác minh, đúng gói/snapshot, chứng tử còn được duyệt, không hold và chấp thuận còn hạn; không cần Executor phê duyệt lần hai.
- **ACCEPT-02** [Must; MVP: Có]: Chấp thuận lặp và job hết hạn đồng thời chỉ cho một kết quả hợp lệ; grant/commit/mốc hạn chống lặp tại database.
- **ACCEPT-03** [Must; MVP: Có]: Nhận nguyên gói, không phần trăm/chọn phần; sau nhận được xem/tải từng tài sản thuộc gói.
- **ACCEPT-04** [Must; MVP: Có]: Không có suy nghĩ lại hai năm hoặc nút gia hạn; mở lại do sửa lỗi cần căn cứ và chính sách riêng, không reset tự động.
- **ACCEPT-05** [Must; MVP: Có]: Chỉ người đã gắn đúng danh tính mới được ghi từ chối của Beneficiary; người chưa xác minh chỉ rút claim.

### 7.6. Xem, giải mã và tải

1. Người có grant còn hạn chọn xem/tải; backend kiểm tra lại quyền và hold tại từng truy cập.
2. Backend lấy đúng phiên bản bản mã, mở DEK, giải mã AES-GCM và kiểm tra toàn vẹn; chỉ xuất plaintext cho người đủ quyền.
3. Hiển thị tiến trình/tải thành công theo kết quả thực tế. Lỗi mạng cho retry khi còn hạn; không khóa toàn bộ app.
4. Hết 7 ngày: chặn truy cập mới; tác vụ bàn giao có thể đã hoàn thành ngay khi commit, không cần giữ nhiệm vụ Executor mở để chờ tải.

- **DOWNLOAD-01** [Must; MVP: Có]: Beneficiary dùng quyền bàn giao trực tiếp; không tạo kho cá nhân/Free/Plus hoặc import tài sản.
- **DOWNLOAD-02** [Must; MVP: Có]: Hạn xem/tải 7 ngày từ commit thành công; login/retry/tải lại không reset và không có API gia hạn.
- **DOWNLOAD-03** [Must; MVP: Có]: Backend kiểm tra quyền ở từng request/chunk phù hợp giao thức; không cấp URL dài hơn hạn grant hoặc bỏ qua chặn đã có.
- **DOWNLOAD-04** [Must; MVP: Có]: Commit bàn giao khác tải hết file; đóng tác vụ Executor không thu hồi grant còn hạn.
- **DOWNLOAD-05** [Must; MVP: Có]: Sai tag/checksum hoặc phiên bản từ chối xuất plaintext, báo lỗi và tạo sự cố; không báo thành công giả.
- **JOINT-01** [Must; MVP: Có]: Nhiều người cùng gói có claim, lịch, quyết định và grant độc lập; A đạt/nhận không phải đợi B.
- **JOINT-02** [Must; MVP: Có]: B chờ/từ chối/hết hạn không hủy grant của A; không chuyển “phần B” sang A.
- **JOINT-03** [Must; MVP: Có]: Chỉ xóa tài sản/khóa khi mọi tham chiếu cần bảo vệ đã hết; không xóa cả kho chỉ từ quyết định của một người.

### 7.7. Không phản hồi, lưu và xóa

1. Hết 5 ngày không phản hồi: lượt không phản hồi ban đầu. Kho vẫn mã hóa/khóa; link có thể dùng tiếp nếu còn thời gian lưu.
2. Bắt đầu 30 ngày lưu khi không còn claim đủ điều kiện đang xử lý, grant hoặc tham chiếu cần bảo vệ trong phạm vi xét; công bố `retention_started_at/deadline` và gửi cảnh báo.
3. Người vào trong hạn vẫn đăng nhập → eKYC. Click/đăng nhập/chụp chưa đủ bằng chứng không dừng xóa. Nếu đủ bằng chứng đúng chỉ định để xử lý hoặc xét ngắn hạn thì giữ đúng dữ liệu theo chính sách và hạn từng giai đoạn.
4. Nếu claim kết thúc không nhận, tiếp tục **thời gian lưu còn lại**; không cộng thêm 30 ngày từ mỗi lần thử.
5. Nhắc lúc bắt đầu lưu, còn 7 ngày và 24 giờ. Lỗi gửi tạo việc xử lý có hạn, không giữ vô hạn.
6. Đến hạn, job kiểm tra lại mọi claim đủ điều kiện, grant, tham chiếu, tranh chấp/hold và chính sách; đủ điều kiện mới thu hồi link, xóa bản mã/khóa hết tham chiếu, ghi tombstone/audit.
7. Khi mọi tài sản hết điều kiện bảo vệ và đã xóa, đóng kho/quy trình. Audit và hồ sơ nghiệp vụ lưu theo mục 12, không phải giữ payload vĩnh viễn.

- **RETENTION-01** [Must; MVP: Có]: Đồng hồ 30 ngày chỉ bắt đầu khi phạm vi không còn xử lý đủ điều kiện/grant/tham chiếu; đồng hồ không bắt đầu từ ngày Owner mất hoặc ngày nộp chứng tử.
- **RETENTION-02** [Must; MVP: Có]: Điều kiện xóa được kiểm tra theo phiên bản dữ liệu và mọi tham chiếu; một lượt đóng không đủ để xóa cả kho còn người khác.
- **RETENTION-03** [Must; MVP: Có]: Chỉ bằng chứng đủ điều kiện liên quan đúng chỉ định hoặc hold được xác nhận mới giữ xóa; mở link/claim/phiên eKYC bất kỳ không phải điều kiện giữ.
- **RETENTION-04** [Must; MVP: Có]: Giữ do claim đến muộn có hạn giai đoạn, không reset 30 ngày; kết thúc claim thì tiếp tục phần thời gian còn lại đã lưu.
- **RETENTION-05** [Must; MVP: Có]: Thông báo mốc lưu/xóa có bằng chứng gửi; lỗi cần người/hạn rà soát, không tự giữ mãi.
- **RETENTION-06** [Must; MVP: Có]: Cleanup kiểm tra điều kiện trong giao dịch/khóa thích hợp, chặn claim/commit xung đột, thu hồi token và chỉ xóa bản mã/DEK không còn tham chiếu.
- **RETENTION-07** [Must; MVP: Có]: Mốc lưu là chính sách sản phẩm cần thỏa thuận, không được gọi là thời hiệu từ chối/thừa kế theo luật; giấy tờ nghiệp vụ có chính sách riêng.
- **RETENTION-08** [Must; MVP: Có]: Tất cả Beneficiary thật từ chối có thể đóng lượt; vẫn theo lưu/xóa và tham chiếu, không xóa ngay vì claimant chưa xác minh rút yêu cầu.
- **RETENTION-09** [Must; MVP: Có]: Hết grant thì vào lưu 30 ngày khi đủ điều kiện; không tự nhập tài sản vào kho khác hoặc cấp lại quyền hết hạn.

### 7.8. Ví dụ dòng thời gian

Không có claim/grant: ngày 0 giao lời mời → ngày 3 nhắc → ngày 5 hết phản hồi ban đầu và bắt đầu lưu → ngày 35 đủ điều kiện xét xóa. Ngày 20 người nhận vào, chỉ đăng nhập không giữ xóa; khi có bằng chứng đủ điều kiện và claim được tiếp nhận, lưu phần thời gian còn lại và xử lý trong hạn. Claim kết thúc không nhận thì tiếp tục phần còn lại. Ngày 35 là ví dụ của nhánh không phản hồi, không phải hạn chung cho mọi kho.

Gói có A và B: A nhận ngày 2, grant đến ngày 9; B chưa phản hồi. A được tải riêng. Chưa được xóa phiên bản còn grant A hoặc claim đủ điều kiện B; sau khi mọi tham chiếu hết, áp dụng lưu/xóa theo phạm vi.

## 8. Luồng P Thanh toán SePay

### 8.1. Gói Owner

Bảng giá/hạn mức LegacyVault dưới đây được giữ từ phạm vi dự án hiện hành; cần xác nhận trước vận hành thương mại, không phải bảng phí SePay.

| Gói | Giá | Thời hạn | Hạn mức | Chức năng |
| --- | --- | --- | --- | --- |
| Owner Free | 0 đồng | Không hết hạn theo kỳ gói | 3 tài sản / 20 MiB | Lưu trữ; chưa thiết lập kế hoạch bàn giao |
| Legacy XS | 199.000 đồng | 365 ngày | 20 tài sản / 200 MiB | Thiết lập, điểm danh, chứng tử và bàn giao |
| Legacy XS Max | 399.000 đồng | 365 ngày | 50 tài sản / 500 MiB | Như XS, thêm PDF tổng hợp kế hoạch |

Một file hoặc bản ghi tính một tài sản; byte tính theo nội dung trước mã hóa. Manifest gói không tính thêm tài sản. PDF XS Max chỉ chứa metadata an toàn và cấu hình, không có nội dung bí mật, CCCD, mật khẩu, khóa hoặc giấy chứng tử.

### 8.2. Quy trình

1. Owner chọn mua/gia hạn gói trên kho của mình. Backend kiểm tra quyền, mục đích và điều kiện đổi gói.
2. Hiển thị giá, hạn mức, thời hạn; Owner xác nhận.
3. Tạo đơn chứa người trả, kho đích, phiên bản gói và giá/hạn mức đã chốt, mã thanh toán duy nhất và hạn đơn.
4. Hiển thị QR và thông tin chuyển khoản. Giao diện đọc trạng thái đơn từ backend.
5. SePay gửi giao dịch đến webhook đã cấu hình. Backend xác thực, lưu giao dịch an toàn và xử lý đối chiếu.
6. Nếu khớp đơn còn đủ điều kiện, cập nhật thanh toán thành công và quyền gói trong cùng giao dịch.
7. Thông báo kết quả, lưu lịch sử; giữ cùng kho và dữ liệu khi mua/gia hạn.

- **PAY-01** [Must; MVP: Có]: Tích hợp SePay theo phương án QR/chuyển khoản. Cấu hình Test/Live được tách rõ; Test dùng để kiểm tra tích hợp, kết quả Test không được dùng cấp dịch vụ trong Live. Không có nút app tự giả lập thanh toán thành công cho người dùng.
- **PAY-02** [Must; MVP: Có]: Webhook phải xác thực bằng phương thức đã cấu hình. Ưu tiên HMAC-SHA256; nếu nhóm đã dùng API Key thì yêu cầu HTTPS và kiểm tra key tại server. Bí mật không đưa vào frontend, source hoặc log. [Tài liệu xác thực SePay](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).
- **PAY-03** [Must; MVP: Có]: Đối chiếu `transferType` là tiền vào, tài khoản nhận cấu hình, mã đơn và số tiền; lưu ID giao dịch SePay để chống xử lý lặp. Không dùng ảnh chuyển khoản hoặc nút “Tôi đã chuyển khoản” làm bằng chứng cấp gói. [Tài liệu webhook SePay](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).
- **PAY-04** [Must; MVP: Có]: Chỉ một đơn chờ cho cùng mục đích/kho; bấm lại trả cùng đơn. Free không tạo đơn 0 đồng. Giao dịch lặp không cấp gói/cộng kỳ thêm; hai giao dịch khác nhau trả cho cùng đơn thì giao dịch dư được ghi cần đối chiếu.
- **PAY-05** [Must; MVP: Có]: Backend lưu bền vững webhook đã xác thực trước khi trả phản hồi nhận thành công theo giao thức SePay. Xác nhận nhận webhook và xác nhận đơn đã thanh toán là hai trạng thái khác nhau; job đối chiếu lỗi được thử lại. [Tài liệu webhook SePay](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).
- **PAY-06** [Must; MVP: Có]: Sai mã/sai tiền/chuyển sau hạn, giao dịch dư hoặc không tìm thấy đơn: lưu `RECONCILIATION_REQUIRED`, chưa tự cấp gói. Webhook đến muộn nhưng giao dịch được xác nhận xảy ra trong hạn cần đối chiếu thời điểm giao dịch với hạn đơn, không chỉ dựa giờ nhận webhook.
- **PAY-07** [Must; MVP: Có]: Đơn hủy/hết hạn không có nghĩa tiền không thể đến. Giao dịch đến sau được giữ để xử lý, không bỏ qua hoặc yêu cầu người dùng trả lần nữa khi chưa kiểm tra. Hoàn tiền tự động qua ngân hàng ngoài phạm vi; kết quả xử lý đối chiếu phải có căn cứ và người phụ trách.
- **PAY-08** [Must; MVP: Có]: XS/XS Max có 365 × 24 giờ từ thời điểm backend ghi quyền dịch vụ đã xác nhận. Gia hạn sớm cộng từ hạn cũ, muộn tính từ mốc xác nhận mới. Kỳ còn hạn chỉ gia hạn cùng gói; đổi XS/XS Max khi kỳ cũ hết và phù hợp quota, không tự xóa tài sản để vừa gói.
- **PAY-09** [Must; MVP: Có]: Nhắc hết gói trước 30/7/1 ngày. Mua/gia hạn không thay điểm danh, xác nhận Owner còn sống, chứng tử, xác minh người nhận hoặc grant.
- **PAY-10** [Must; MVP: Có]: Beneficiary nhận/xem/tải trong hạn không phải trả phí. Không có dịch vụ Free/Plus, đơn hoặc import cho kho người nhận.

### 8.3. Hết gói Owner

- **OPLAN-01** [Must; MVP: Có]: Hết gói chặn thêm/sửa nội dung kế hoạch và xuất PDF, nhưng không tự hủy hồ sơ/những quyền bàn giao hợp lệ đã có. Trong khi hồ sơ đang xét hoặc bàn giao đang chạy, bảo vệ dữ liệu được tham chiếu.
- **OPLAN-02** [Must; MVP: Có]: Giữ mốc kỳ điểm danh/thời gian chờ đã cấu hình, không chạy sớm hoặc chuyển Free để bỏ nghĩa vụ bảo vệ. Nếu Owner xác thực còn sống sau hết gói, đề xuất cho 30 ngày xử lý dịch vụ: gia hạn, tải dữ liệu hoặc hủy kế hoạch và chọn tài sản vừa hạn Free.
- **OPLAN-03** [Must; MVP: Có]: Owner hủy kế hoạch và chuyển Free thì chỉ giữ tài sản đã chọn trong quota. Phần bỏ được dọn theo chính sách và kiểm tra tham chiếu; không ghi đè snapshot hoặc xóa nội dung người nhận còn quyền.
- **OPLAN-04** [Must; MVP: Có]: Chưa rõ tình trạng Owner/chứng tử thiếu căn cứ thì giữ khóa và tạo việc rà soát có người phụ trách/ngày tiếp theo. Không dùng hạn lưu F3 để xóa khi F3 chưa bắt đầu.
- **OPLAN-05** [Must; MVP: Có]: Thanh toán hợp lệ trước cleanup bảo vệ quyền dịch vụ mới; thao tác cleanup và gia hạn cùng lúc phải kiểm tra trạng thái trong một giao dịch. Dữ liệu đã thực sự xóa không được hứa phục hồi.

Không áp dụng tự động ân hạn 365 ngày sau hết gói. OPLAN-04 cần quy trình rà soát định kỳ và chính sách thương mại được xác nhận; đây là rủi ro chi phí lưu khi chưa rõ tình trạng Owner, không được quảng bá là có hạn xóa cố định cho mọi trường hợp.

## 9. Luồng 4 Quy trình tiếp nhận và quản lý sự cố

### 9.1. Mục tiêu và phạm vi

Admin tiếp nhận, phân loại, điều phối xử lý và đóng sự cố theo phân quyền của sản phẩm và quy trình nhóm đã chốt. Luồng bắt đầu từ lỗi/bất thường hoặc báo cáo, không bắt đầu bằng việc Admin tùy ý mở tài sản.

**Người tham gia:** hệ thống, Admin; Executor/Verifier tham gia khi cần kết luận trong phạm vi nghiệp vụ của họ. Người dùng có thể báo sự cố liên quan đến tài khoản/yêu cầu của mình.

**Điều kiện xử lý:** cảnh báo/báo cáo có nguồn và đối tượng xác định; Admin có tài khoản đang hoạt động và quyền phù hợp. Các API kiểm tra quyền vẫn chặn truy cập trái phép ngay khi có yêu cầu, không chờ Admin mở sự cố.

**Kết quả:** sự cố đóng với kết quả đã khắc phục hoặc không cần xử lý; nếu chưa giải quyết thì có trạng thái, người phụ trách và hạn tiếp theo. Kết thúc lượt thao tác Admin không đồng nghĩa đóng sự cố.

| Nhóm chức năng | Phạm vi triển khai |
| --- | --- |
| Quản lý tài khoản và RBAC | Bắt buộc: tra cứu, khóa/mở khóa theo căn cứ, cấp/thu hồi vai trò hợp lệ |
| Quản lý nhân sự xử lý | Giữ: nhóm Verifier/Executor hợp lệ, trạng thái và việc cần phân công lại |
| Audit và cảnh báo | Giữ: tra cứu sự kiện, lỗi xác thực, truy cập bị từ chối và cảnh báo bất thường |
| Thông báo và tích hợp | Giữ: trạng thái/lỗi email/SMS, Google, SePay, video và eKYC; theo dõi thử lại |
| Giao dịch cần đối chiếu | Giữ: tra cứu giao dịch/đơn và theo dõi xử lý; không tự đánh dấu đã thanh toán |
| Cấu hình điểm danh mặc định | Giữ ở mức đơn giản; chỉ áp dụng cho thiết lập mới/kỳ tiếp theo |
| Sao lưu | Theo dõi lần chạy/kết quả; tác vụ hạ tầng được kiểm soát riêng |
| Quản lý thuật toán, khóa và khôi phục qua UI | Ngoài phạm vi |
| Giám sát eKYC kỹ thuật | Trong phạm vi: tình trạng dịch vụ, lỗi, phiên bản cấu hình; không xem sinh trắc hoặc duyệt thay |
| Chữ ký số pháp lý, công chứng điện tử | Ngoài phạm vi |

### 9.2. Quy trình chính

1. **Tiếp nhận:** hệ thống phát hiện lỗi/bất thường hoặc nhận báo cáo từ người có quyền. Lưu loại, nguồn, đối tượng ảnh hưởng, thời gian và sự kiện liên quan.
2. **Kiểm tra trùng:** tìm sự cố đang mở cùng vấn đề/phạm vi. Có thì bổ sung sự kiện và số lần phát sinh; chưa có thì tạo mã sự cố mới ở trạng thái `OPEN`.
3. **Thông báo:** đưa vào danh sách chờ và thông báo Admin phụ trách. Gửi thông báo lỗi thì lưu tác vụ thử lại, không tạo lại cùng sự cố.
4. **Xác thực Admin:** Admin đăng nhập nếu chưa có phiên. Backend kiểm tra tài khoản, xác thực bổ sung và quyền; không hợp lệ thì từ chối thao tác, sự cố vẫn ở danh sách chờ.
5. **Xem chi tiết:** Admin mở sự cố, xem audit và metadata được phân quyền; kiểm tra thông tin, phạm vi và các hành động đã thực hiện.
6. **Xem xét cảnh báo:** quyết định có cần xử lý. Nếu không cần, ghi căn cứ và đóng với kết quả `NO_ACTION_REQUIRED`; không xóa sự kiện nguồn. Nếu cần, tiếp tục bước 7.
7. **Phân loại và giao việc:** xác định bảo mật, thông báo, video/nhân sự, thanh toán, lỗi eKYC, báo còn sống hoặc nghi vấn hồ sơ. Ghi người chịu trách nhiệm, việc cần làm và hạn; chuyển `ASSIGNED`/`IN_PROGRESS`.
8. **Thực hiện xử lý:** Admin dùng thao tác đúng quyền theo mục 9.4 hoặc giao Executor/Verifier xử lý phần nghiệp vụ. Backend kiểm tra quyền, điều kiện và phiên bản trước mỗi thay đổi; ghi hành động và kết quả.
9. **Kiểm tra kết quả:** hệ thống/người phụ trách kiểm tra vấn đề đã khắc phục và các việc phụ thuộc. Chưa khắc phục thì ghi nguyên nhân còn lại, chuyển `WAITING_FOR_RESPONSE` hoặc `WAITING_FOR_FIX`, có người phụ trách/hạn tiếp theo. Khi có kết quả mới quay lại bước 8 hoặc 9; không giữ phiên Admin mở để chờ.
10. **Ghi đã xử lý:** khi có căn cứ vấn đề đã được khắc phục hoặc hướng xử lý hợp lệ đã hoàn tất, lưu kết quả và chuyển `RESOLVED`. Đây chưa phải thao tác tự phê duyệt chứng tử hoặc cấp quyền bàn giao.
11. **Kiểm tra đóng:** Admin xác nhận đóng; backend kiểm tra kết quả, việc còn mở và những chặn liên quan. Nếu chưa đủ, thông báo lý do và giữ sự cố ở trạng thái tương ứng.
12. **Đóng và thông báo:** gỡ chặn kỹ thuật thuộc sự cố khi đủ điều kiện, ghi `CLOSED`, người/thời gian/kết quả đóng và tạo thông báo cho bên bị ảnh hưởng. Chặn từ sự cố khác hoặc chặn nghiệp vụ vẫn giữ. Thông báo lỗi được thử lại riêng, không áp dụng lại hành động xử lý.
13. **Kết thúc:** hiển thị kết quả. Một lượt xử lý có thể kết thúc ở trạng thái chờ; sự cố chỉ được ghi đóng khi qua bước 6 hoặc 11–12.

### 9.3. Nhánh quản lý tài khoản và vai trò

- **ADMIN-01** [Must; MVP: Có]: Admin tra cứu tài khoản, phương thức app/Google đã liên kết, trạng thái liên hệ và vai trò. Không xem mật khẩu/hash, OTP, token đăng nhập hoặc bí mật liên kết.
- **ADMIN-02** [Must; MVP: Có]: Khóa/mở khóa hoặc thu hồi phiên cần lý do. Khóa chặn đăng nhập/thao tác mới; mở khóa không tự bỏ chặn hồ sơ, cấp grant hoặc ghi nhận danh tính đã xác minh.
- **ADMIN-03** [Must; MVP: Có]: Cấp/thu hồi vai trò theo chính sách và kiểm tra điều kiện người xử lý. Người dùng không tự yêu cầu qua Google để thành Verifier/Admin. Thay vai trò không tự thêm họ vào chỉ định Owner hoặc phân công hồ sơ.
- **ADMIN-04** [Must; MVP: Có]: Không cho tự nâng quyền ngoài phạm vi quyền quản trị hoặc vô hiệu hóa tài khoản Admin khả dụng cuối cùng mà không có phương án quản trị thay thế. Kiểm tra tại server, không chỉ ẩn nút giao diện.
- **ADMIN-05** [Must; MVP: Có]: Khóa/thu hồi Executor hoặc Verifier đang có nhiệm vụ tạo việc phân công lại và chặn thao tác cũ. Người mới tiếp tục theo ASSIGN-02/03; không kế thừa xác nhận cho hành động mới.

### 9.4. Phân loại và hành động xử lý

| Nhóm | Điều kiện đưa vào luồng | Hành động cụ thể | Căn cứ kiểm tra kết quả |
| --- | --- | --- | --- |
| Bảo mật tài khoản | Đăng nhập thất bại/truy cập bị từ chối lặp vượt ngưỡng, hoặc báo cáo chiếm tài khoản có căn cứ | Admin xem audit, khóa tạm tài khoản hoặc thu hồi phiên đúng phạm vi và ghi lý do | Phiên bị thu hồi không còn dùng được; quyết định khóa/mở khóa có căn cứ; không còn việc kiểm tra chưa giải quyết |
| Lỗi thông báo | Gửi mời/xác nhận lịch thất bại sau các lần thử lại cần hỗ trợ | Admin xem lỗi, khắc phục phần cấu hình thuộc quyền hoặc giao xử lý, yêu cầu thử gửi lại | Dịch vụ ghi giao thành công hoặc có quyết định kết thúc gửi/đóng việc theo chính sách; hạn người nhận không bắt đầu từ lần gửi lỗi |
| Lỗi video hoặc nhân sự | Báo lỗi vào phòng, Executor vắng mặt/mất phân công, vấn đề lặp cần can thiệp | Admin kiểm tra trạng thái phòng/nhân sự; Executor đặt lại lịch; thay người theo ASSIGN nếu cần | Phòng có thể dùng, phân công hợp lệ và việc lịch đã xử lý; không ghi video đạt chỉ vì đã sửa lỗi |
| Thanh toán cần đối chiếu | Giao dịch sai mã/số tiền, đến sau hạn hoặc trùng thanh toán cho một đơn | Admin xem giao dịch/đơn, yêu cầu đối chiếu nguồn SePay đã xác thực và theo dõi xử lý | Có kết quả đối chiếu và hoàn tất hướng xử lý giao dịch; gói chỉ cập nhật qua dịch vụ hợp lệ; đóng sự cố không tự ghi đã trả tiền |
| Lỗi eKYC kỹ thuật | Dịch vụ/model lỗi, timeout hoặc chất lượng lỗi lặp cần hỗ trợ | Admin xem metadata lỗi; điều phối sửa, cho thử lại theo hạn; không sửa điểm kết luận | Dịch vụ hoạt động lại; người dùng thực hiện phiên mới hợp lệ, không tự ghi đạt |
| Nghi vấn chứng tử/danh tính | Verifier/Executor đánh dấu nghi vấn hoặc có báo cáo được tiếp nhận | Admin hỗ trợ chặn kỹ thuật và điều phối; Verifier xem lại chứng tử, Executor xem danh tính | Có kết luận của đúng vai trò trên đúng phiên bản và đã xử lý các chặn; Admin không kết luận thay |

Một lần nhập sai mật khẩu, một yêu cầu không có quyền hoặc một cuộc gọi mất mạng không mặc nhiên tạo ticket cho Admin. Hệ thống ghi sự kiện; chỉ mở sự cố khi đạt ngưỡng, cần hỗ trợ hoặc có báo cáo đủ điều kiện. Ngưỡng cảnh báo là cấu hình vận hành được lưu phiên bản.

- **ADMIN-06** [Must; MVP: Có]: Audit chỉ đọc, lọc theo thời gian/người/đối tượng/kết quả. Admin không sửa hoặc xóa lịch sử để hợp thức hóa thao tác.
- **ADMIN-07** [Must; MVP: Có]: Không cho replay trực tiếp yêu cầu cấp grant hoặc giả webhook thanh toán. Việc nhận lại dữ liệu SePay phải từ nguồn đã xác thực và đi qua cùng đối chiếu/chống trùng.
- **ADMIN-08** [Must; MVP: Có]: Không đánh dấu đúng người, nhận/từ chối hoặc chứng tử hợp lệ thay Executor/Beneficiary/Verifier. Khi Owner báo còn sống, Admin chặn kỹ thuật và điều phối; kết quả xác minh do vai trò nghiệp vụ ghi.
- **ADMIN-09** [Must; MVP: Có]: Trạng thái SePay hiển thị ID giao dịch, đơn, số tiền, kết quả xác thực/đối chiếu và lỗi cần xử lý; không hiển thị secret. Kết quả thanh toán thành công vẫn đi qua dịch vụ đối chiếu hợp lệ.
- **ADMIN-10** [Must; MVP: Có]: Sự cố và việc giữ dữ liệu có người phụ trách, lý do, ngày tạo và ngày rà soát. Cảnh báo quá hạn không tự xóa kho hoặc phê duyệt nghiệp vụ.
- **INC-01** [Must; MVP: Có]: Báo cáo từ người dùng phải qua tài khoản đã đăng nhập, gắn đối tượng họ được phép báo và có mô tả. Không dùng nội dung báo cáo tự khai để tự khóa người khác hoặc gán kết quả nghiệp vụ.
- **INC-02** [Must; MVP: Có]: Mỗi sự cố có mã, loại, nguồn, đối tượng/phạm vi, lần phát sinh đầu/gần nhất, số lần lặp, trạng thái, người phụ trách và hạn xử lý. Lưu sự kiện và lịch sử hành động theo sự cố.
- **INC-03** [Must; MVP: Có]: Gộp chỉ với sự cố đang mở có cùng vấn đề/phạm vi theo khóa nhận diện. Cảnh báo của người/kho khác không bị gộp chỉ vì cùng loại; phát sinh sau sự cố đã đóng tạo sự cố mới và liên kết lịch sử.
- **INC-04** [Must; MVP: Có]: Admin nhận/giao việc phải kiểm tra phiên bản để tránh hai người ghi đè phân công hoặc kết quả. Thử lại thao tác không tạo nhiều lần khóa/thu hồi/gửi lại giống nhau.
- **INC-05** [Must; MVP: Có]: Cảnh báo không cần xử lý được đóng với căn cứ và kết quả `NO_ACTION_REQUIRED`. Giữ audit nguồn, không ghi giả rằng đã sửa lỗi.
- **INC-06** [Must; MVP: Có]: Kết quả xử lý gồm hành động, người thực hiện, thời điểm, phạm vi và bằng chứng vận hành tối thiểu. Bản báo cáo hoặc ảnh chuyển khoản không thay kết luận chứng tử/danh tính/webhook hợp lệ.
- **INC-07** [Must; MVP: Có]: Chưa khắc phục có việc tiếp theo, người phụ trách và hạn. Hệ thống nhắc/cảnh báo theo SLA, không tự chuyển `RESOLVED`/`CLOSED` chỉ vì hết thời gian.
- **INC-08** [Must; MVP: Có]: Đóng yêu cầu đã khắc phục cần kết quả xác nhận và không còn việc bắt buộc chưa hoàn tất. Gỡ chặn phải kiểm tra từng nguyên nhân; đóng một sự cố không gỡ chặn khác hoặc mở grant đã hết hạn.
- **INC-09** [Must; MVP: Có]: Lỗi thông báo kết quả xử lý được lưu và thử lại riêng. Khi yêu cầu gửi lại lời mời thành công, mốc phản hồi theo INVITE/TIME; không đặt lại hạn đã bắt đầu hợp lệ.
- **INC-10** [Must; MVP: Có]: Admin không sửa nhật ký hoặc giả kết quả của người được giao việc. Lý do giữ dữ liệu do sự cố phải có phạm vi và ngày rà soát, không là cờ giữ vô thời hạn không có người phụ trách.

### 9.5. Nhánh cấu hình và theo dõi dịch vụ

- **ADMIN-11** [Must; MVP: Có]: Đổi mặc định chu kỳ/thời gian chờ điểm danh trong giới hạn được phê duyệt; lưu phiên bản và lý do. Không sửa kỳ/hạn lưu/grant đang chạy. Thay chính sách bàn giao cần phiên bản chính sách mới, không là nút tùy chỉnh riêng từng hồ sơ.
- **ADMIN-12** [Must; MVP: Có]: Hiển thị tình trạng email/SMS, Google, SePay, video, eKYC và sao lưu gần nhất. Bí mật tích hợp và khóa mã hóa do cấu hình server quản lý, không có chức năng xem/tải qua UI.
- **ADMIN-13** [Must; MVP: Có]: Sao lưu chứa dữ liệu được bảo vệ; khôi phục bởi quy trình hạ tầng riêng phải áp dụng trạng thái quyền, chặn và tombstone để không làm sống lại dữ liệu đã xóa.
- **ADMIN-14** [Should; MVP: Có]: Báo cáo chỉ dùng metadata cần thiết, hạn chế thông tin cá nhân và không chứa payload tài sản hoặc giấy tờ. Không công khai URL báo cáo/audit.

### 9.6. Các ngoại lệ Admin

| Tình huống | Xử lý |
| --- | --- |
| Phiên hết hạn hoặc vai trò bị thu hồi | Dừng thao tác, xác thực lại; backend không chấp nhận quyền cũ |
| Đối tượng đã bị người khác sửa | Trả xung đột phiên bản, tải lại trước khi xác nhận |
| Muốn gán người có xung đột làm nhân sự | Từ chối, chọn người hợp lệ theo chính sách |
| Gửi thông báo sau thay đổi bị lỗi | Lưu việc thử lại; không áp dụng thay đổi vai trò lần thứ hai |
| Yêu cầu đọc tài sản, tải giấy tờ toàn hệ thống hoặc mở khóa thủ công | Từ chối theo quyền; Admin xem metadata cần thiết |
| Sự cố chưa có căn cứ kết luận | Giữ chặn đúng phạm vi, phân công và đặt ngày rà soát |
| Cảnh báo trùng với sự cố đang mở | Bổ sung sự kiện, không tạo ticket và thông báo phân công trùng |
| Cảnh báo không cần xử lý | Ghi căn cứ, đóng với kết quả`NO_ACTION_REQUIRED`, giữ nhật ký |
| Chưa có người nhận xử lý hoặc quá SLA | Giữ trong danh sách chờ, cảnh báo và phân công lại đúng chính sách |
| Admin bấm đóng khi việc bắt buộc chưa xong | Backend từ chối, hiển thị việc còn thiếu; không gỡ chặn |
| Sự cố lặp lại sau khi đã đóng | Tạo sự cố mới liên kết sự cố trước để kiểm tra lại |

### 9.7. Kết quả kết thúc và dữ liệu lưu

- **Đã khắc phục và đóng:** trạng thái `CLOSED`, kết quả `FIXED`, có căn cứ khắc phục và người/thời điểm đóng.
- **Không cần xử lý và đóng:** trạng thái `CLOSED`, kết quả `NO_ACTION_REQUIRED`, có căn cứ xem xét.
- **Đang chờ:** `WAITING_FOR_RESPONSE` hoặc `WAITING_FOR_FIX`, có việc tiếp theo/người phụ trách/hạn; kết thúc lượt thao tác, không kết thúc sự cố.
- **Đã giải quyết nghiệp vụ bằng hướng xử lý khác:** có kết luận và việc liên quan đã hoàn tất, đóng với kết quả `HANDLED_WITH_DISPOSITION`; ví dụ dừng lời mời không còn hiệu lực hoặc giao dịch đã được đối chiếu và hoàn tất hướng xử lý, không ghi đã gửi/đã thanh toán nếu thực tế chưa đạt.

Admin xem mã sự cố, loại, đối tượng, trạng thái, người phụ trách, thời hạn, lịch sử và kết quả được phân quyền. Hồ sơ chứng tử/danh tính vẫn theo quyền riêng; dữ liệu bí mật tài sản không nằm trong màn hình hoặc audit sự cố.

**Ví dụ luồng thành công:** lời mời nhận không gửi được sau thử lại → tạo/gộp sự cố → thông báo Admin → Admin kiểm tra lỗi và điều phối khắc phục → yêu cầu gửi lại → hệ thống xác nhận giao thành công → Admin kiểm tra, ghi kết quả và đóng. Hạn phản hồi của người nhận bắt đầu theo lần giao thành công nếu chưa có mốc hợp lệ trước đó.

- **ADMIN-15** [Must; MVP: Có]: Cảnh báo lỗi eKYC chỉ cho Admin metadata kỹ thuật, phiên bản, mã lỗi và phân công; không cho tải hàng loạt ảnh/vectors hoặc thay ngưỡng riêng để cho một hồ sơ đạt.
- **INC-11** [Must; MVP: Có]: Xung đột nhiều claim chỉ giữ dữ liệu khi có bằng chứng đủ điều kiện; một người giữ link hoặc nộp sai căn cước không tự tạo chặn toàn kho.
- **INC-12** [Must; MVP: Có]: Cảnh báo gian lận cho Beneficiary chỉ gửi người đã được mời/gắn hồ sơ ở giai đoạn thích hợp và nội dung cần thiết; hồ sơ chứng tử chưa duyệt không tự tiết lộ chỉ định còn bí mật.

## 10. Thời hạn và chính sách thông báo

### 10.1. Các mốc bàn giao đã thống nhất

| Đồng hồ | Bắt đầu | Thời hạn | Khi hết hạn |
| --- | --- | --- | --- |
| Phản hồi lời mời ban đầu | Thông báo mời được giao thành công qua ít nhất một kênh | 5 × 24 giờ | Ghi chưa phản hồi; tiếp nhận muộn nếu còn trong hạn lưu |
| Quyết định sau xác minh | Thông báo sẵn sàng nhận được giao thành công | 7 × 24 giờ | Ghi chưa quyết định, đóng cửa nhận của lượt; xử lý theo lưu trữ |
| Quyền xem/tải | Commit bàn giao thành công | 7 × 24 giờ | Chặn đọc/tải theo grant; không có xin gia hạn |
| Lưu dữ liệu đủ điều kiện | RETENTION-01 được đáp ứng | 30 × 24 giờ | Kiểm tra quyền/tham chiếu/chặn/chính sách, rồi xóa nếu đạt |
| Gói XS/XS Max | Quyền dịch vụ được ghi sau đối chiếu thành công hoặc cộng từ hạn cũ khi gia hạn sớm | 365 × 24 giờ | Áp dụng hạn chế dịch vụ và OPLAN |

Hạn lưu không luôn tính từ ngày gửi lời mời đầu tiên. Trường hợp nhiều người hoặc có grant đang dùng phải tính theo điều kiện dữ liệu chung. Hết hạn lời mời, hết quyền tải và hết gói là ba sự kiện độc lập.

### 10.2. Giá trị mặc định đề xuất cho các bước vận hành

Các giá trị dưới đây làm rõ các nhánh chờ trong bản SRS mới; chúng là đề xuất triển khai để nhóm rà soát, không phải quy định pháp luật. Chỉ áp dụng cho tiến trình mới theo phiên bản cấu hình được lưu.

| Tham số | Mặc định đề xuất | Cách xử lý |
| --- | --- | --- |
| Chu kỳ điểm danh | 30 ngày; cho chọn 30/60/90 | Lưu từ F1, thay đổi áp dụng kỳ tiếp theo |
| Thời gian chờ điểm danh | 7 ngày; cho chọn 7/14/30 | Hết hạn tạo việc Executor, không tự bàn giao |
| Phản hồi lời mời nhiệm vụ nhân sự | 48 giờ | Nhắc/phân công theo chính sách; không tự chấp nhận |
| Xử lý danh tính claim đủ điều kiện | 30 ngày từ lần đầu tiếp nhận đủ | Hết hạn chưa kết luận thì đóng chưa hoàn tất; không reset bởi bổ sung/hẹn lại |
| Khoảng hẹn video | Trong 14 ngày từ đặt, đồng thời nằm trong hạn claim còn lại | Thiếu slot điều phối; không đặt vô thời hạn |
| Người nhận chọn lịch | 7 ngày từ khi được phép đặt lịch | Hết hạn đóng yêu cầu chưa hoàn tất; không ghi từ chối |
| Bổ sung hồ sơ nhận diện | 7 ngày từ thông báo yêu cầu giao thành công | Thiếu phản hồi thì đóng yêu cầu; không cấp quyền |
| Giữ xét bằng chứng danh tính đủ điều kiện trước hạn lưu | Tối đa 7 ngày từ yêu cầu đầu tiên đủ điều kiện | Executor xem xét trong SLA theo REVIEW-04; yêu cầu lặp không đặt lại mốc. Hết mốc mà chưa đủ căn cứ tiếp tục thì kết thúc giữ ngắn hạn và kiểm tra lại điều kiện xóa |
| Chờ trong phòng video | 15 phút sau giờ hẹn | Hết khoảng chờ ghi no-show, gửi hướng dẫn hẹn lại |
| Phản hồi yêu cầu hẹn lại | 48 giờ từ thông báo giao thành công | Không phản hồi thì đóng yêu cầu chưa hoàn tất |
| Số lần hẹn lại do người nhận vắng mặt | Tối đa 2 lần trong một yêu cầu | Quá số lần thì Executor đóng yêu cầu có lý do; không quy thành sai danh tính |
| Nhắc trước video | 5 giờ; lịch đặt sát giờ thì gửi ngay | Thông báo không có tài sản/giấy tờ |
| Hạn đơn thanh toán | 15 phút từ tạo đơn | Đơn hết hạn; giao dịch muộn vẫn được lưu cần đối chiếu |
| SLA việc thủ công | Nhắc sau 48 giờ, cảnh báo Admin sau 72 giờ | Giữ người phụ trách và bước tiếp theo; không tự duyệt |
| Rà soát sự cố/giữ dữ liệu | Không quá 7 ngày giữa hai lần rà soát | Ghi kết quả, căn cứ và ngày tiếp theo |
| Hồ sơ nhận diện của yêu cầu đã đóng | 30 ngày sau kết thúc, nếu không có lý do giữ | Dọn ảnh/tệp không còn cần; giữ kết quả tối thiểu trong audit |
| Cửa sổ phản đối chứng tử | 72 giờ từ giao thông báo hợp lệ của phiên bản | Chưa hết hoặc có phản đối thì không phê duyệt |
| Hoàn tất báo còn sống | 7 ngày từ báo cáo đầu tiên được tiếp nhận | Hết hạn chuyển Verifier kết luận, không tự duyệt |
| Kết luận phản đối của Verifier | 48 giờ từ có đủ kết quả hoặc hết hạn 7 ngày | Quá hạn điều phối, không tự tiếp tục F3 |
| Phiên thu thập eKYC | 15 phút từ tạo phiên | Hết hạn hủy challenge và kết quả chưa hoàn tất |
| Thử thách động tác | 90 giây từ phát hành challenge | Hết hạn tạo challenge mới theo giới hạn thử |
| Thử eKYC | Tối đa 3 lần kết luận thất bại trong 24 giờ/mục đích | Tạm hạn chế thử, có hỗ trợ; lỗi server không tính thất bại danh tính |
| Bản chứng tử | 365 ngày sau hồ sơ kết thúc, nếu không có lý do giữ | Dọn tệp theo chính sách; không xóa chứng cứ đang được dùng |

Thời gian đang chờ Executor hoặc lịch đã được đặt hợp lệ không bị tính như người nhận chậm chọn lịch/bổ sung. Không tính lỗi do Executor/hệ thống vào số lần no-show của người nhận. Việc đang chờ nhân sự có SLA và được điều phối, không giữ một phiên web chạy liên tục.

### 10.3. Quy tắc chung

- **TIME-01** [Must; MVP: Có]: Lưu mốc UTC ở server, hiển thị theo múi giờ Việt Nam. Mốc phía trình duyệt không quyết định hạn. Tại đúng thời điểm hết hạn, thao tác hết hiệu lực trừ khi đồng hồ đang tạm dừng hợp lệ.
- **TIME-02** [Must; MVP: Có]: Nhắc lời mời khi còn 2 ngày; nhắc quyết định khi còn 2 ngày/24 giờ; nhắc lưu khi bắt đầu và còn 7 ngày/24 giờ. Mỗi loại nhắc cho mỗi mốc chỉ gửi một lần thành công, retry không tạo thông báo trùng.
- **TIME-03** [Must; MVP: Có]: Link mới, refresh, đăng nhập lại, bấm thử lại, chọn lịch hoặc thanh toán không tự đặt lại các hạn khác. Mỗi lần mở lại hợp lệ có lý do, người thực hiện và mốc được công bố.
- **TIME-04** [Must; MVP: Có]: Sự cố dịch vụ/chặn bảo toàn đã được xác nhận có thể tạm dừng đúng đồng hồ/phạm vi. Lưu thời gian còn lại và tiếp tục khi gỡ chặn, không cấp lại toàn bộ hạn. Đây là xử lý sự cố, không có nút Beneficiary xin thêm thời gian tải.
- **TIME-05** [Must; MVP: Có]: Các job nhắc/hết hạn/cleanup chạy theo lịch và trạng thái lưu bền vững, không phụ thuộc phiên đăng nhập hoặc một tiến trình chờ liên tục.
- **TIME-06** [Must; MVP: Có]: Bản sao lưu của dữ liệu đã xóa được loại trong tối đa 7 ngày theo chính sách vận hành. Audit thường đề xuất tối thiểu 365 ngày và trong thời gian hồ sơ/sự cố còn mở; hồ sơ sự cố dữ liệu cá nhân áp dụng thời hạn riêng sau rà soát pháp lý ở mục 12; không lưu bí mật để đạt thời hạn audit.
- **TIME-07** [Must; MVP: Có]: Cửa sổ phản đối, hạn báo sống, hạn Verifier và hạn lưu là đồng hồ độc lập; thời hạn phản đối 72 giờ không phải thời hạn thông báo vi phạm dữ liệu theo luật.
- **TIME-08** [Must; MVP: Có]: Chế độ demo chỉ tăng tốc đồng hồ nghiệp vụ được cho phép trong môi trường riêng; không tăng tốc/giảm kiểm tra OTP, token, nonce, TLS hoặc giới hạn bảo mật của môi trường thật.
- **TIME-09** [Must; MVP: Có]: Hold phải có nguyên nhân/phạm vi/điều kiện kết thúc và ngày rà soát. Hết hạn claim không đủ căn cứ phải kết thúc hold đó; còn tranh chấp thực sự thì dùng hold có căn cứ riêng, không lặp claim để gia hạn.

## 11. Trạng thái, dữ liệu và ràng buộc API

### 11.1. Trạng thái độc lập

| Đối tượng | Trạng thái |
| --- | --- |
| Tài khoản | `ACTIVE`, `LOCKED`, `DISABLED`; email xác minh riêng |
| Kế hoạch | `DRAFT`, `ACTIVE`, `CHECKIN_OVERDUE`, `AWAITING_CHECK`, `DEATH_CASE_OPEN`, `HANDOVER_IN_PROGRESS`, `CLOSED`, `BLOCKED` |
| Chứng tử | `DRAFT`, `UNDER_REVIEW`, `SUPPLEMENT_REQUIRED`, `APPROVED_FOR_HANDOVER`, `REJECTED`, `SUSPENDED` |
| Phiên eKYC | `CREATED`, `CAPTURING`, `PROCESSING`, `COMPLETED`, `ERROR`, `EXPIRED`, `CANCELLED`; kết quả riêng `PASSED`, `REVIEW_REQUIRED`, `FAILED` |
| Báo còn sống | `OPEN`, `VERIFYING`, `AWAITING_VERIFIER`, `VERIFIED_ALIVE`, `OBJECTION_REJECTED`, `CLOSED_INSUFFICIENT` |
| Claim | `CREATED`, `EKYC_IN_PROGRESS`, `EKYC_REVIEW_PENDING`, `SCHEDULING_REQUIRED`, `SCHEDULED`, `SUPPLEMENT_REQUIRED`, `RESCHEDULE_REQUIRED`, `IDENTITY_VERIFIED`, `WITHDRAWN_BY_CLAIMANT`, `REJECTED_IDENTITY`, `CLOSED_INSUFFICIENT_EVIDENCE`, `EXPIRED_INCOMPLETE` |
| Lượt bàn giao | `INVITED`, `INITIAL_RESPONSE_EXPIRED`, `IDENTITY_IN_PROGRESS`, `READY_TO_ACCEPT`, `HANDOVER_COMMITTED`, `DECLINED`, `DECISION_EXPIRED`, `CANCELLED` |
| Grant | `ACTIVE`, `BLOCKED`, `EXPIRED`, `REVOKED` |
| Lưu dữ liệu | `NOT_STARTED`, `RETENTION_ACTIVE`, `DELETION_HELD`, `DELETION_ELIGIBLE`, `DELETED` |
| Đơn | `PENDING`, `PAID`, `CANCELLED`, `EXPIRED`, `RECONCILIATION_REQUIRED` |
| Sự cố | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_RESPONSE`, `WAITING_FOR_FIX`, `RESOLVED`, `CLOSED`; kết quả đóng riêng |

Gói dịch vụ, lịch, tiến độ tải và thông báo có trạng thái riêng. `BLOCKED` của kế hoạch lưu trạng thái nghiệp vụ trước và các nguyên nhân chặn; gỡ một hold không suy ra mọi chặn đều hết. Dịch vụ hết hạn là thuộc tính quyền dịch vụ, không phải trạng thái Owner đã chết. Đóng claim/lượt không xóa lịch sử nhận.

### 11.2. Chuyển trạng thái kế hoạch và chứng tử

| Trước | Sự kiện | Ai | Điều kiện | Sau/hiệu ứng |
| --- | --- | --- | --- | --- |
| Kế hoạch DRAFT | Kích hoạt | Owner/backend | SETUP-01 đủ | ACTIVE; kỳ điểm danh mới |
| ACTIVE | Đến hạn chưa điểm danh | Job | Đúng kỳ, chưa có hồ sơ chặn | CHECKIN_OVERDUE |
| ACTIVE/CHECKIN_OVERDUE/AWAITING_CHECK | Điểm danh | Owner | Đúng quyền, chưa có chứng tử mở | ACTIVE; kỳ tiếp theo |
| CHECKIN_OVERDUE | Hết thời gian chờ | Job | Chưa điểm danh | AWAITING_CHECK; việc Executor |
| Kế hoạch chưa đóng | Nộp chứng tử | Executor | Phân công, bản khai đủ, không trùng | DEATH_CASE_OPEN; ghim snapshot |
| Chứng tử DRAFT | Gửi xác nhận | Executor | Bản hiện hành đủ | UNDER_REVIEW; thông báo Owner |
| UNDER_REVIEW/SUPPLEMENT_REQUIRED | Cần bổ sung | Verifier | Đúng phân công/bản | SUPPLEMENT_REQUIRED; việc cụ thể |
| SUPPLEMENT_REQUIRED | Gửi bản mới | Executor | Xác nhận lại | UNDER_REVIEW; thông báo nếu thay trọng yếu |
| UNDER_REVIEW | Phê duyệt | Verifier | Hết cửa sổ, không hold, đủ xác nhận | APPROVED_FOR_HANDOVER; kế hoạch HANDOVER_IN_PROGRESS |
| UNDER_REVIEW/SUPPLEMENT_REQUIRED | Từ chối | Verifier | Lý do/căn cứ | REJECTED; chưa F3; kế hoạch về trạng thái còn phù hợp |
| Chứng tử đang xét/đã duyệt | Báo sống/nghi vấn cần chặn | Owner/vai trò hợp lệ | Báo cáo hợp lệ hoặc bằng chứng | SUSPENDED; lưu trạng thái trước; hold phạm vi |
| SUSPENDED | Xác nhận Owner sống | Verifier | ALIVE-05/06 | REJECTED; hủy lượt chưa commit, xử lý grant theo sự cố |
| SUSPENDED | Bác phản đối | Verifier | Đủ căn cứ, kiểm tra các hold khác | Khôi phục trạng thái trước nếu còn hợp lệ; chưa tự duyệt |
| SUSPENDED | Chưa đủ căn cứ | Verifier | Có lý do/việc/hạn | SUPPLEMENT_REQUIRED hoặc tiếp tục SUSPENDED với hold hồ sơ riêng |
| Kế hoạch HANDOVER_IN_PROGRESS | Mọi lượt xong | Backend | Không việc bắt buộc còn mở | CLOSED nghiệp vụ; grant hợp lệ có thể còn hạn |
| Kế hoạch bị chặn | Gỡ chặn | Backend | Từng nguyên nhân đã kết luận | Trạng thái trước nếu còn hợp lệ; không hồi sinh grant |

### 11.3. Phiên eKYC và phản đối

| Trước | Sự kiện | Ai | Điều kiện | Sau |
| --- | --- | --- | --- | --- |
| Chưa có phiên | Tạo | Backend | Đúng mục đích/quyền/consent/giới hạn | CREATED |
| CREATED | Thu thập | Người dùng/backend | Đúng chủ phiên | CAPTURING |
| CAPTURING | Gửi đủ bằng chứng | Backend | Challenge hợp lệ, không replay | PROCESSING |
| PROCESSING | Có kết quả | Dịch vụ/backend | Đúng job/phiên/model | COMPLETED + một outcome |
| CREATED/CAPTURING/PROCESSING | Timeout/lỗi/hủy | Backend | Xác định đúng nguyên nhân | EXPIRED/ERROR/CANCELLED; không dùng để đạt |
| Phiên đã kết thúc | Thử lại | Người dùng/backend | Còn quyền/hạn/lần thử | Phiên mới; không sửa kết quả cũ |
| Chưa có báo sống | Báo lần đầu | Owner | Đúng tài khoản/hồ sơ | OPEN; hold ngay; ghi hạn đầu |
| OPEN | Bắt đầu selfie | Owner/backend | Đúng mẫu đăng ký | VERIFYING |
| OPEN/VERIFYING | Đủ kết quả hoặc hết hạn | Backend | Không reset hạn | AWAITING_VERIFIER |
| AWAITING_VERIFIER | Kết luận | Verifier | Đúng phân công/bằng chứng | VERIFIED_ALIVE / OBJECTION_REJECTED / CLOSED_INSUFFICIENT |
| Báo cáo đã có | Báo lặp | Owner | Cùng phiên bản hồ sơ, chưa có bằng chứng mới hợp lệ | Bổ sung sự kiện; giữ hạn đầu/kết luận; không tạo hold mới |

Kết quả eKYC của phiên đã hoàn tất giữ nguyên. Executor ghi quyết định xem xét riêng, không sửa outcome model thành `PASSED`. Chủ tài khoản không thể lấy eKYC của người khác hoặc của mục đích khác gắn vào claim.

### 11.4. Claim, lượt, grant và lưu

| Trước | Sự kiện | Ai | Điều kiện | Sau/hiệu ứng |
| --- | --- | --- | --- | --- |
| INVITED | Hết 5 ngày | Job | Chưa phản hồi có xác thực | INITIAL_RESPONSE_EXPIRED; chưa thu hồi link chỉ vì 5 ngày |
| Lượt còn hiệu lực | Tiếp tục từ tài khoản | Người nhận | Token/tài khoản hợp lệ, dữ liệu còn | Claim CREATED rồi EKYC_IN_PROGRESS; ghi phản hồi |
| EKYC_IN_PROGRESS | eKYC và chỉ định đạt | Backend | Đủ bằng chứng đúng phiên | SCHEDULING_REQUIRED; lượt IDENTITY_IN_PROGRESS |
| EKYC_IN_PROGRESS | Cần xem xét | Backend | Lý do/evidence đủ | EKYC_REVIEW_PENDING; hold chỉ nếu REVIEW-04 đủ |
| EKYC_REVIEW_PENDING | Cho đi video | Executor | REVIEW-02 đủ, quyết định riêng | SCHEDULING_REQUIRED |
| Claim chưa gắn danh tính | Rút yêu cầu | Claimant | Đúng claim | WITHDRAWN_BY_CLAIMANT; không DECLINED lượt |
| Claim còn xử lý | Sai người/không đủ căn cứ | Executor/backend | Bằng chứng/kết luận phù hợp | REJECTED_IDENTITY/CLOSED_INSUFFICIENT_EVIDENCE |
| SCHEDULING_REQUIRED/RESCHEDULE_REQUIRED | Đặt lịch | Người nhận/backend | Slot trống, đúng phân công/hạn | SCHEDULED |
| SCHEDULED | Sự cố/no-show | Backend/Executor | Phân loại nguyên nhân | RESCHEDULE_REQUIRED hoặc EXPIRED_INCOMPLETE đúng hạn |
| Claim còn xử lý | Cần bổ sung | Executor | Mục cụ thể và hạn | SUPPLEMENT_REQUIRED; sau bổ sung quay bước đủ điều kiện |
| SCHEDULED | Video đúng người | Executor | Quan sát đủ, giấy/đối chiếu đủ, không hold | IDENTITY_VERIFIED; lượt READY_TO_ACCEPT |
| READY_TO_ACCEPT | Đồng ý | Beneficiary/backend | ACCEPT-01 đủ; kiểm tra trong commit | HANDOVER_COMMITTED; grant ACTIVE |
| READY_TO_ACCEPT | Từ chối | Beneficiary | Đúng tài khoản/hạn | DECLINED; không grant |
| READY_TO_ACCEPT | Hết hạn quyết định | Job | Không commit | DECISION_EXPIRED |
| Grant ACTIVE | Hết hạn tải | Backend/job | Server time >= deadline | EXPIRED; mọi API đọc chặn ngay |
| Grant ACTIVE | Chặn/thu hồi hợp lệ | Backend | Căn cứ và đúng phạm vi | BLOCKED/REVOKED; lịch sử commit giữ |
| Grant BLOCKED | Gỡ chặn | Backend | Không hold khác, còn hạn | ACTIVE; hết hạn thì EXPIRED |
| Lưu NOT_STARTED | Đủ điều kiện bắt đầu | Job | RETENTION-01 | RETENTION_ACTIVE; ghi mốc |
| RETENTION_ACTIVE | Claim đủ điều kiện/hold | Backend | REVIEW/RETENTION đủ | DELETION_HELD; lưu thời gian còn lại |
| DELETION_HELD | Kết thúc nguyên nhân giữ | Backend | Không nguyên nhân khác | RETENTION_ACTIVE với phần còn lại, không reset |
| RETENTION_ACTIVE | Đến hạn | Job | Kiểm tra mọi tham chiếu/hold | DELETION_ELIGIBLE hoặc DELETION_HELD có căn cứ |
| DELETION_ELIGIBLE | Cleanup | Backend/job | Kiểm tra lại nguyên tử | DELETED; revoke tokens, tombstone |

### 11.5. Thanh toán và sự cố

| Trước | Sự kiện | Ai | Điều kiện | Sau |
| --- | --- | --- | --- | --- |
| Đơn PENDING | Giao dịch khớp | Backend | PAY-02/03/04 đủ | PAID + quyền dịch vụ một lần |
| PENDING | Hủy/hết hạn | Owner/job | Chưa PAID | CANCELLED/EXPIRED; không bỏ tiền đến muộn |
| PENDING/CANCELLED/EXPIRED | Giao dịch lệch/muộn | Backend | Nguồn xác thực, cần đối chiếu | RECONCILIATION_REQUIRED; dịch vụ chưa cấp |
| RECONCILIATION_REQUIRED | Đối chiếu có căn cứ | Dịch vụ được phép | Nguồn giao dịch thật, chính sách đủ | PAID hoặc kết quả xử lý riêng; không nút giả paid |
| Sự cố OPEN | Phân công/bắt đầu | Admin | Vai trò/phiên bản đúng | ASSIGNED/IN_PROGRESS |
| OPEN/ASSIGNED/IN_PROGRESS | Không cần xử lý | Admin | Có căn cứ | CLOSED + NO_ACTION_REQUIRED |
| IN_PROGRESS | Chờ | Người phụ trách | Việc/hạn/người rõ | WAITING_FOR_RESPONSE/WAITING_FOR_FIX |
| Trạng thái chờ | Có phản hồi | Người phụ trách | Đúng việc | IN_PROGRESS |
| IN_PROGRESS | Có căn cứ đã xử lý | Người phụ trách | Kết quả/việc phù hợp | RESOLVED |
| RESOLVED | Đóng | Admin/backend | INC-08 đủ | CLOSED; chỉ gỡ hold thuộc sự cố |
| CLOSED | Tái diễn | Backend | Sự kiện mới | Sự cố mới OPEN liên kết cũ |

### 11.6. Dữ liệu và hợp đồng API

| Nhóm | Dữ liệu tối thiểu và ràng buộc |
| --- | --- |
| Tài khoản | user ID, phương thức app/Google, sub, email xác minh, phiên/vai trò/lịch sử; không làm ID từ CCCD |
| Kế hoạch | vault/owner, phiên bản cấu hình, trạng thái, kỳ điểm danh, đồng ý chính sách; dịch vụ riêng |
| Tài sản/gói | asset version, ciphertext, nonce/tag/AAD, DEK bọc, checksum, manifest phiên bản; snapshot giữ được nội dung cũ |
| Chỉ định | designation/version, expected ID/name/DOB bảo vệ, kênh liên lạc, phạm vi gói; gắn account sau video |
| Nhân sự | lời mời/chấp thuận, phạm vi, thời điểm, Executor dự phòng, phân công Verifier và thay người |
| Chứng tử | phiên bản tệp/trường, xác nhận Executor, quyết định Verifier, snapshot ID, thời gian giao/ phản đối |
| eKYC | session/job ID, user/purpose/object/reference version, consent, nonce/hạn, evidence private, parsed fields, quality/PAD/face scores, model/threshold version, outcome/reason |
| Mẫu Owner | enrollment ID/version, Owner ID, phiên gốc đạt, vector/ảnh cần thiết mã hóa, mục đích và hạn lưu; không cho đổi mẫu bằng endpoint generic |
| Báo sống | hồ sơ, báo đầu/hạn, phiên kiểm tra, kết luận/căn cứ Verifier, hold liên quan |
| Bàn giao | lượt/claim, lời mời token hash, phản hồi, lịch/phòng, kết luận, quyết định nhận, commit/grant, expiry, view/download event |
| Thanh toán | order purpose/price version, provider transaction ID, webhook receipt/processing, verified timestamp, entitlement, disposition giao dịch dư |
| Lưu/sự cố | retention scope/deadline/remaining, reference count/graph, holds, assignee/review date, audit/tombstone, incident events/results |

- **STATE-01** [Must; MVP: Có]: Backend chỉ cho chuyển trạng thái qua sự kiện, vai trò và điều kiện được định nghĩa; frontend không gửi trạng thái đích để ghi trực tiếp.
- **STATE-02** [Must; MVP: Có]: Chuyển liên quan nhiều đối tượng phải nguyên tử hoặc dùng outbox/idempotency và kiểm tra lại trước phát hành; không để duyệt/nhận/xóa một nửa.
- **STATE-03** [Must; MVP: Có]: Mọi quyết định ghi đúng phiên bản bằng chứng/tham chiếu; sửa dữ liệu không âm thầm đổi kết luận cũ.
- **DATA-01** [Must; MVP: Có]: Snapshot ghim content version bất biến và giữ tham chiếu bản mã/khóa; sao JSON trỏ vào nội dung bị ghi đè không đủ.
- **DATA-02** [Must; MVP: Có]: Số căn cước và dữ liệu sinh trắc được bảo vệ, phân quyền tối thiểu; không trả expected ID đầy đủ trước xác minh.
- **DATA-03** [Must; MVP: Có]: Quyền gắn account–designation phải từ kết luận hợp lệ; sửa contact account không đổi người chỉ định hoặc cấp lại grant.
- **DATA-04** [Must; MVP: Có]: Unique/ràng buộc tương đương chống nhiều active claim cùng account/designation, nhiều grant/commit cùng lượt và nhiều xử lý provider transaction ID; kiểm tra xung đột slot lịch ở database.
- **DATA-05** [Must; MVP: Có]: API eKYC công khai chỉ tạo phiên/gửi evidence/xem kết quả của mình; callback nội bộ cần xác thực và chống replay.
- **DATA-06** [Must; MVP: Có]: Evidence URL riêng, ngắn hạn và chỉ cấp đúng người/việc; lưu kết quả tối thiểu sau khi dọn ảnh theo chính sách.
- **DATA-07** [Must; MVP: Có]: Bản ghi consent, quyết định, phiên bản chính sách/ngưỡng và tombstone phải truy vết được; audit không sửa qua app.

Không có entity/API chuyển người nhận, ưu tiên, kho cá nhân Beneficiary, import hoặc gia hạn tải. Mô tả dữ liệu này phục vụ ERD/API; không ấn định tên bảng hoặc framework.

## 12. Bảo mật, dữ liệu cá nhân và yêu cầu phi chức năng

### 12.1. Bảo mật

- **SEC-01** [Must; MVP: Có]: Mật khẩu app được băm bằng thư viện chuẩn; đề xuất Argon2id tối thiểu memory 19 MiB, iterations 2, parallelism 1 và salt riêng, hiệu chỉnh theo server. Bí mật tài sản cần giải mã nên mã hóa, không dùng password hash. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- **SEC-02** [Must; MVP: Có]: Mỗi content version có DEK riêng và AES-256-GCM; nonce an toàn không lặp với cùng khóa, AAD gắn kho/asset/version; DEK bọc bằng KEK lưu tách database/source/log.
- **SEC-03** [Must; MVP: Có]: HTTPS; plaintext/khóa chỉ tồn tại trong bộ nhớ trong tác vụ cần thiết. Backend có thể giải mã nên không quảng bá server không đọc được theo E2EE.
- **SEC-04** [Must; MVP: Có]: Mọi API kiểm tra object permission, trạng thái/phân công/grant ở server; UI ẩn nút không đủ. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- **SEC-05** [Must; MVP: Có]: Verifier chỉ có giấy chứng tử/bằng chứng Owner phản đối được phân công; Executor chỉ có hồ sơ nhận cần xét. Admin không mặc nhiên tải ảnh giấy tờ/sinh trắc toàn hệ thống.
- **SEC-06** [Must; MVP: Có]: Link mời, phòng, evidence và tải có mục đích/hạn riêng; không đặt token vào analytics/log hoặc cấp URL dùng ngoài hạn quyền.
- **SEC-07** [Must; MVP: Có]: Audit ghi người/vai trò/thời gian/đối tượng/phiên bản/kết quả/lý do; không ghi password, OTP, full token, CCCD đầy đủ, ảnh/vector khuôn mặt, DEK/KEK, file/seed phrase.
- **SEC-08** [Must; MVP: Có]: Khôi phục phải áp dụng hold/grant/commit/tombstone hiện hành; backup cũ không hồi sinh quyền hoặc dữ liệu đã xóa.
- **SEC-09** [Must; MVP: Có]: Đề xuất TOTP cho thao tác Admin nhạy cảm; không dùng tài khoản chung, không lộ seed/recovery code trong UI quản trị/audit.
- **SEC-10** [Must; MVP: Có]: Đề xuất 5 lần đăng nhập sai trong 15 phút thì cooldown 15 phút theo chính sách đa tín hiệu; giới hạn OTP/lời mời/eKYC riêng, không khóa toàn kho vì người ngoài dò link.
- **SEC-11** [Must; MVP: Có]: Model API, storage giấy tờ và KEK chỉ ở backend/network được phép; environment secret có thể dùng cho MVP nhưng không commit `.env`, gửi KEK ra frontend hoặc cho Admin xem.
- **SEC-12** [Must; MVP: Có]: Cookie/session, CSRF, CORS và upload được cấu hình theo môi trường; kiểm tra MIME/nội dung, chống path traversal và không thực thi file người dùng tải lên.
- **SEC-13** [Should; MVP: Có]: Owner được xem nhật ký truy cập kho mình gồm hành động/thời điểm/kết quả phù hợp; không lộ bí mật đăng nhập hoặc dữ liệu sinh trắc của người khác.

### 12.2. Dữ liệu cá nhân và thời hạn lưu

Tại ngày lập bản này, cần rà soát theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP có hiệu lực từ 01/01/2026; Nghị định 356 thay Nghị định 13/2023. Dữ liệu sinh trắc thuộc nhóm nhạy cảm. Không ghi bản SRS này là chứng nhận tuân thủ pháp luật. [Cổng Chính phủ](https://chinhphu.vn/?classid=1&docid=216387&pageid=27160), [Nghị định 356, Điều 4 và 42](https://congbaocdn.chinhphu.vn/180507251028987904/2026/1/17/356signed-1768638052103952849513.pdf).

Owner cung cấp căn cước của Beneficiary trước khi Beneficiary biết kế hoạch: sự đồng ý của Owner không tự thay sự đồng ý/căn cứ xử lý của Beneficiary. Phải rà soát căn cứ xử lý và cách thông báo trước triển khai thực tế; nếu cần thay phương án thu thập thì phải đổi quy tắc đối chiếu tương ứng, không âm thầm bỏ số căn cước.

| Dữ liệu | Thời hạn đề xuất | Điều kiện |
| --- | --- | --- |
| Ảnh thẻ/selfie đăng ký Owner | 30 ngày sau enrollment hoàn tất | Xóa ảnh không còn cần; không xóa mẫu khi kế hoạch còn hoạt động |
| Mẫu đặc trưng Owner | Trong thời gian có kế hoạch/hồ sơ cần đối chiếu; xóa trong 30 ngày khi hết mọi mục đích/hold | Lưu hạn và lý do riêng, không giữ vô thời hạn sau đóng mọi kế hoạch |
| Phiên thất bại/hết hạn không có tranh chấp | Tối đa 7 ngày sau phiên đóng | Giữ metadata kết quả tối thiểu, không kéo dài bằng retry |
| Ảnh/bằng chứng claim hoặc báo sống | 30 ngày sau claim/báo cáo kết thúc | Tranh chấp hợp lệ có hold/phạm vi/ngày rà soát |
| Video | Không bắt buộc ghi hình/lưu | Metadata phòng/cuộc gọi đủ cho vận hành; nếu sau này ghi phải có yêu cầu/consent/hạn riêng |
| Tệp chứng tử | 365 ngày sau hồ sơ đóng | Đề xuất; hồ sơ đang dùng/hold được bảo vệ |
| Audit thông thường | 365 ngày hoặc đến hết hồ sơ đang mở, lấy mốc muộn hơn | Không giữ PII thô để đạt thời hạn |
| Hồ sơ sự cố dữ liệu cá nhân | Chính sách riêng theo nghĩa vụ áp dụng | Không dùng mặc định audit 365 ngày thay nghĩa vụ này |
| Bản mã tài sản/DEK | Theo grant/tham chiếu/retention 30 ngày của F3 và OPLAN | Xóa bản đang cần bị từ chối |
| Backup dữ liệu đã xóa | Loại trong tối đa 7 ngày | Cần thiết kế backup/tombstone đáp ứng được |

Nghị định 356 có quy định về thông báo vi phạm dữ liệu sinh trắc và lưu hồ sơ sự cố ở Điều 29; nhóm cần rà soát trường hợp áp dụng, thời hạn 72 giờ và lưu hồ sơ tối thiểu 5 năm với người phụ trách pháp lý trước vận hành. Đây là nghĩa vụ xử lý sự cố dữ liệu, không phải cửa sổ phản đối chứng tử. [Văn bản Điều 29](https://congbaocdn.chinhphu.vn/180507251028987904/2026/1/17/356signed-1768638052103952849513.pdf).

- **PRIV-01** [Must; MVP: Có]: Màn hình eKYC có thông báo riêng về mục đích, dữ liệu, bên xử lý, hạn lưu và cách liên hệ; lưu consent version/time/purpose trước thu thập.
- **PRIV-02** [Must; MVP: Có]: Chỉ thu trường cần cho nhận diện/đối chiếu và mẫu đối chiếu Owner; không thu dư nơi ở/người thân từ QR chỉ vì đọc được.
- **PRIV-03** [Must; MVP: Có]: Mẫu/ảnh sinh trắc được mã hóa, phân quyền và có hạn/job xóa; vector không được gọi là dữ liệu ẩn danh chỉ vì không phải ảnh.
- **PRIV-04** [Must; MVP: Có]: Yêu cầu xem/xóa/rút đồng ý tạo việc có quyền và căn cứ; ngừng xử lý mới khi cần, đánh giá hệ quả kế hoạch/hold; không bypass identity hoặc hứa xóa chứng cứ phải giữ hợp lệ.
- **PRIV-05** [Must; MVP: Có]: Thời hạn ảnh, mẫu, giấy, audit, tài sản và backup được quản lý riêng; job theo policy version và lưu bằng chứng dọn.
- **PRIV-06** [Must; MVP: Có]: Sự cố dữ liệu cá nhân được đánh dấu riêng, lưu hồ sơ/theo dõi nghĩa vụ thông báo theo chính sách pháp lý được phê duyệt; không gửi ảnh/CCCD qua kênh cảnh báo.
- **PRIV-07** [Must; MVP: Có]: Trước Live phải có căn cứ xử lý thông tin Beneficiary do Owner nhập và trách nhiệm các bên, bao gồm nhà cung cấp SMS/video/hosting; đánh dấu chưa hoàn tất nếu chưa được xác nhận.

### 12.3. Vận hành và trải nghiệm

- **OPS-01** [Must; MVP: Có]: eKYC, video, mã hóa, quyền, Google và SePay phải được tích hợp thực tế; không dùng nút/fake response mô tả đã xác minh/đã trả tiền.
- **OPS-02** [Must; MVP: Có]: Lỗi tích hợp có retry an toàn, người/hạn xử lý; không bỏ xác thực hoặc identity guard để demo.
- **OPS-03** [Must; MVP: Có]: Snapshot, lịch, duyệt, nhận/grant, webhook và cleanup chống thao tác lặp/xung đột.
- **OPS-04** [Must; MVP: Có]: Thông báo chỉ có metadata cần thiết; “giao thành công” theo bằng chứng kênh được chọn, không giả định đã đọc. Nếu provider chỉ có acceptance phải ghi đúng và xác nhận chính sách khởi chạy hạn.
- **OPS-05** [Must; MVP: Có]: UI hiển thị trạng thái, hạn còn lại, bước cần làm/lý do; tải có progress/retry, không khóa toàn ứng dụng.
- **OPS-06** [Must; MVP: Có]: Admin xem health metadata eKYC/model/video/jobs/notification/backup; cảnh báo hạ tầng không tiết lộ payload giấy tờ.
- **OPS-07** [Must; MVP: Có]: Giá trị đang chờ xác nhận phải có owner quyết định, version cấu hình và điều kiện bật Live; không hardcode ngưỡng prototype làm kết quả pháp lý.

### 12.4. Giới hạn file và NFR — giá trị đề xuất

Các mục này là mục tiêu cần đo và xác nhận, chưa phải kết quả kiểm thử đã đạt. Baseline đề xuất: server 4 vCPU/8 GiB RAM, CPU không GPU; phải ghi môi trường/model/runtime thực tế khi đo.

| Mã | Yêu cầu đo được | Ưu tiên | MVP |
| --- | --- | --- | --- |
| NFR-01 | Metadata API P95 ≤2 giây với 20 user đồng thời; không tính thời gian upload/camera/video hoặc giải mã file lớn | Should | Có |
| NFR-02 | eKYC xử lý server P95 ≤30 giây từ nhận đủ evidence, một phiên xử lý đồng thời/model warm; hàng chờ có timeout và trạng thái | Should | Có |
| NFR-03 | Job phát hiện mốc nghiệp vụ trong ≤60 giây khi healthy; API vẫn chặn ngay tại deadline dù job chưa chạy | Must | Có |
| NFR-04 | Mục tiêu khả dụng Live 99,5%/tháng, đo từ probe và downtime định nghĩa trước; không suy từ server demo | Should | Không |
| NFR-05 | Backup mục tiêu RPO ≤24 giờ, RTO ≤4 giờ; diễn tập khôi phục và áp dụng tombstone trước mở đọc | Should | Có |
| NFR-06 | Phiên user đề xuất idle 30 phút/max 12 giờ; Admin idle 15 phút và xác thực lại thao tác nhạy cảm; expiry kiểm tra server | Must | Có |
| NFR-07 | Asset file ≤20 MiB và quota gói; đề xuất PDF/JPG/PNG/WEBP/TXT/DOCX/XLSX/ZIP, lưu kín/không thực thi; file khác báo không hỗ trợ | Must | Có |
| NFR-08 | Ảnh eKYC JPEG/PNG/WEBP ≤8 MiB, ≤20 megapixel; đọc MIME thực, loại ảnh hỏng/thiếu thẻ/mặt không đủ rõ; ngưỡng quality được đo/version | Must | Có |
| NFR-09 | Chứng tử PDF/JPEG/PNG/WEBP ≤20 MiB/tệp, tối đa 10 tệp/hồ sơ đề xuất; xem toàn bộ trang, không tải public | Must | Có |
| NFR-10 | Báo cáo eKYC tách selfie–thẻ và selfie–selfie, QR/OCR từng trường, PAD theo loại tấn công; ghi mẫu số của từng tỷ lệ | Must | Có |
| NFR-11 | Bộ thử đề xuất ≥30 người trưởng thành đồng ý, có thẻ hỗ trợ, ≥100 cặp khác người; tách người hiệu chỉnh/đánh giá, báo camera/ánh sáng và giới hạn mẫu | Must | Có |
| NFR-12 | Ngưỡng chấp nhận nhận nhầm/từ chối nhầm, quality/PAD/face được duyệt từ báo cáo trước bật auto-pass; không tự coi chưa có false accept ở mẫu nhỏ là 0 rủi ro | Must | Có |
| NFR-13 | Trình duyệt mục tiêu Chrome/Edge có camera/WebRTC; chạy thử ít nhất một điện thoại Android và máy tính, báo thiết bị/mẫu thẻ chưa hỗ trợ | Should | Có |

- **FILE-01** [Must; MVP: Có]: Từ chối upload vượt giới hạn trước/ trong xử lý an toàn; giới hạn sau giải nén/giải mã ảnh và parser nếu có, không chỉ kiểm tra tên file.
- **MEASURE-01** [Must; MVP: Có]: Báo cáo đo lưu cấu hình, dữ liệu đồng ý và kết quả tổng hợp, không phát hành ảnh/căn cước thật; không dùng ảnh mẫu công khai làm minh chứng đúng người nhận.
- **MEASURE-02** [Must; MVP: Có]: Tách metric face matching/PAD/OCR và kết quả cuối; yêu cầu bắt buộc không được đổi thành đạt chỉ vì một metric cao.

## 13. Tiêu chí nghiệm thu và kế hoạch kiểm thử

Mỗi dòng là một nhóm ca; khi viết test phải tách các biến thể hợp lệ/không hợp lệ và giữ mã AC/yêu cầu. Dùng tài khoản các vai trò, snapshot nhiều người nhận, đồng hồ nghiệp vụ môi trường test, SePay Test và provider video thực. Đây là kế hoạch kiểm thử, không phải báo cáo phần mềm đã đạt.

| AC | Yêu cầu truy vết | Kịch bản/đầu vào | Kết quả cần quan sát |
| --- | --- | --- | --- |
| AC-01 | AUTH-04, SETUP-01 | Đăng ký app chưa xác minh email | Chưa kích hoạt kế hoạch; hướng dẫn xác minh |
| AC-02 | AUTH-01 | Google token sai/hết hạn | Không tạo phiên; không tin email/profile do frontend tự gửi |
| AC-03 | AUTH-02 | Email Google trùng tài khoản app | Xác thực tài khoản app trước liên kết; không tạo/gộp quyền tự động |
| AC-04 | SETUP-02, SETUP-07 | Tạo kho và người nhận chưa có tài khoản | Lưu chỉ định, không gửi thông báo di sản ở F1 |
| AC-05 | ASSET-01, ASSET-04, SEC-02 | Upload vượt quota hoặc hỏng | Từ chối có lý do; dữ liệu hợp lệ lưu bản mã |
| AC-06 | DMS-01, DMS-02, DMS-03 | Owner chưa điểm danh hết thời gian chờ | Chỉ tạo việc Executor, không mời Beneficiary hoặc mở tài sản |
| AC-07 | DEATH-01, ASSIGN-01 | Executor có giấy trước ngày điểm danh | Được mở F2B với phân công hợp lệ |
| AC-08 | DEATH-01, DEATH-02 | Nộp chứng tử thiếu/trang mờ | Yêu cầu đúng mục cần sửa/tải lại; không bắt “giấy tờ liên quan” |
| AC-09 | DEATH-04, STATE-03 | Sửa chứng tử sau xác nhận | Phiên bản mới cần xác nhận lại; Verifier xét đúng bản |
| AC-10 | DEATH-06, DEATH-09 | Chứng tử được duyệt | Có thể gửi lời mời F3, nhưng API tài sản vẫn chưa được đọc |
| AC-11 | INVITE-02, RETENTION-01 | Không phản hồi 5 ngày | Ghi chưa phản hồi; link còn dùng trong hạn lưu, không ghi từ chối |
| AC-12 | AUTH-06, INVITE-03 | Mở link trước/sau login hoặc Google | Quay về đúng lời mời; mở URL đơn thuần không ghi phản hồi |
| AC-13 | CLAIM-01, MATCH-07 | Tài khoản có email/điện thoại khác hoàn toàn hồ sơ Owner | Sau login và xác minh tài khoản, vào eKYC ngay; không buộc đổi contact, chưa có quyền payload |
| AC-14 | AUTH-04, CLAIM-01 | Đăng ký app từ lời mời nhưng email tài khoản chưa xác minh | Yêu cầu xác minh email của tài khoản theo AUTH-04; không yêu cầu xác minh kênh trùng chỉ định vì đã bỏ cổng đó |
| AC-15 | MATCH-01, MATCH-05, REVIEW-02 | eKYC thẻ thật của người khác, số căn cước khác chỉ định | Đóng sai người; không đặt lịch/cấp grant và không sửa chỉ định; eKYC kỹ thuật đạt không đủ nhận |
| AC-16 | CLAIM-04, ACCEPT-05 | Không tiếp tục trước video | Đóng yêu cầu tài khoản, không ghi người thật từ chối hoặc xóa kho |
| AC-17 | SCHEDULE-01, SCHEDULE-02 | Lịch đã có người đặt | Báo không khả dụng và chọn lại; không hủy bàn giao |
| AC-18 | SCHEDULE-02, SCHEDULE-04, IDENTITY-02 | No-show hoặc mất mạng video | Ghi đúng loại sự cố/hẹn lại; không kết luận sai người do lỗi kỹ thuật |
| AC-19 | IDENTITY-03, IDENTITY-04 | Executor xác minh đạt | Sẵn sàng nhận, chưa đọc tài sản trước chấp thuận |
| AC-20 | MATCH-05, IDENTITY-05 | Xác định sai người | Đóng đúng yêu cầu; giữ chỉ định và dữ liệu cần bảo vệ |
| AC-21 | ACCEPT-01, ACCEPT-02, DATA-04, OPS-03 | Nhận lặp hoặc nhận đồng thời job hết hạn | Một commit/grant/mốc tải hoặc một kết quả hết hạn hợp lệ |
| AC-22 | JOINT-01, JOINT-02, JOINT-03 | A nhận, B chờ/từ chối trên cùng gói | A truy cập riêng; B chưa có quyền; không chuyển phần B sang A |
| AC-23 | DOWNLOAD-02, DOWNLOAD-03, RETENTION-09 | Hết 7 ngày tải hoặc dùng link tải cũ | Backend chặn đọc/tải; không có gia hạn; khi mọi tham chiếu hết thì vào lưu 30 ngày đúng phạm vi |
| AC-24 | DOWNLOAD-05, OPS-05 | Tải lỗi hoặc checksum sai | Không báo hoàn tất giả; cho thử lại hợp lệ hoặc ghi sự cố |
| AC-25 | RETENTION-03, RETENTION-04, REVIEW-04 | Trong hạn lưu: click link, mở eKYC chưa đủ, rồi gửi hồ sơ đủ điều kiện | Hai thao tác đầu không giữ xóa; hồ sơ đủ được tiếp nhận/giữ đúng phạm vi trong hạn; không reset 30 ngày |
| AC-26 | RETENTION-01, RETENTION-02, JOINT-03 | Hết 30 ngày nhưng còn grant/yêu cầu/tham chiếu | Chưa xóa, ghi lý do và ngày rà soát |
| AC-27 | RETENTION-05, RETENTION-06, SEC-08 | Cleanup đủ điều kiện | Thu hồi link, xóa dữ liệu/khóa hết tham chiếu; audit/tombstone vẫn đúng |
| AC-28 | PAY-02, PAY-03, PAY-06 | Webhook SePay giả hoặc sai tài khoản/tiền/mã | Không cấp gói; request giả bị từ chối, giao dịch thật lệch được lưu đối chiếu |
| AC-29 | PAY-04, PAY-05 | Webhook lặp hoặc nhiều giao dịch cho một đơn | Cấp gói một lần; giao dịch dư được theo dõi |
| AC-30 | PAY-06, PAY-07 | Giao dịch đến sau đơn hết hạn | Không bỏ giao dịch; đối chiếu trước xử lý và không bắt trả lại ngay |
| AC-31 | ADMIN-02, ADMIN-03, ADMIN-05, ROLE-04 | Admin đổi vai trò/khóa nhân sự | Kiểm tra quyền/lý do; chặn thao tác cũ, giữ lịch sử, tạo việc thay người |
| AC-32 | ADMIN-07, ADMIN-08, ROLE-06 | Admin muốn duyệt chứng tử/mở tài sản/đánh dấu đã trả tiền | API từ chối; không có đường vòng qua vai trò quản trị |
| AC-33 | ADMIN-11, DMS-01 | Admin đổi mặc định điểm danh | Chỉ cấu hình mới/kỳ tiếp theo đổi; hạn đang chạy giữ nguyên |
| AC-34 | ALIVE-01, ALIVE-02, DEATH-07 | Owner báo còn sống trong lúc có claim sẵn sàng nhận | Chặn grant mới ngay; mở kiểm tra mẫu Owner và Verifier; accept đồng thời không được vượt chặn |
| AC-35 | DOWNLOAD-01, PAY-10, ACCEPT-03 | Tìm kho cá nhân/Plus/import/chuyển nhượng trong sản phẩm | Không có UI/API chức năng đã bỏ |
| AC-36 | DOWNLOAD-04, JOINT-01 | Đóng hồ sơ rồi người đã nhận còn hạn tải | Vẫn tải theo grant hợp lệ; không cần giữ nhiệm vụ Executor mở |
| AC-37 | INC-02, INC-03 | Nhiều cảnh báo cùng vấn đề/phạm vi khi sự cố đang mở | Gộp vào cùng sự cố, tăng số lần và lưu sự kiện; không tạo phân công trùng |
| AC-38 | INC-01, ROLE-02 | Báo cáo về đối tượng người dùng không có quyền | Từ chối liên kết trái phép; nội dung tự khai không tự khóa tài khoản khác |
| AC-39 | INC-05 | Admin kết luận cảnh báo không cần xử lý | Có căn cứ, đóng với`NO_ACTION_REQUIRED`, giữ sự kiện nguồn |
| AC-40 | INC-07, ADMIN-10, ASSIGN-04 | Chưa khắc phục hoặc quá hạn xử lý | Có người phụ trách/việc tiếp theo/hạn; nhắc và điều phối, không tự đóng |
| AC-41 | INC-08 | Bấm đóng khi việc bắt buộc chưa hoàn tất | Backend từ chối đóng và gỡ chặn; chỉ rõ mục còn thiếu |
| AC-42 | INC-08, INC-10, STATE-01 | Đóng một sự cố khi có chặn khác hoặc grant hết hạn | Chặn còn lại giữ nguyên; không tự mở quyền tải hoặc kết luận nghiệp vụ |
| AC-43 | INC-03 | Vấn đề tái diễn sau sự cố đã đóng | Tạo sự cố mới liên kết lịch sử, không sửa kết quả đóng cũ |
| AC-44 | INC-09 | Thông báo kết quả đóng gửi lỗi | Thử lại thông báo riêng; không lặp khóa/thu hồi/cấp quyền hoặc tạo lại sự cố |
| AC-45 | INC-04, STATE-03 | Hai Admin sửa phân công/kết quả cùng lúc | Kiểm tra phiên bản, một thay đổi hợp lệ; người còn lại tải lại trước khi tiếp tục |
| AC-46 | EKYC-01, EKYC-02, EKYC-17, EKYC-18, DATA-05 | Gọi API bằng phiên của user khác, mục đích khác, snapshot khác hoặc callback không xác thực | Từ chối; không dùng kết quả đó cho Owner/claim, giữ audit tối thiểu |
| AC-47 | EKYC-03, PRIV-01, DATA-07 | Chưa đồng ý hoặc client gửi consent version không còn được chấp nhận | Chưa thu thập; hiển thị thông báo đúng phiên bản; lưu mục đích và thời điểm khi đồng ý |
| AC-48 | EKYC-04, EKYC-05, EKYC-08, EKYC-09, NFR-08 | Hai mặt sai hồ sơ, ảnh lóa, ID có số 0 đầu, ngày sinh sai định dạng, thẻ hết hạn | Giữ chuỗi 12 số, yêu cầu chụp lại/báo mẫu thẻ phù hợp; không auto-pass thiếu trường |
| AC-49 | EKYC-06, EKYC-07, MATCH-04, REVIEW-03 | QR không đọc được hoặc QR/OCR mâu thuẫn căn cước/tên | Dự phòng OCR đủ chất lượng hoặc chuyển chụp lại/xem xét; quyết định căn cứ ảnh gốc có lịch sử, không chọn tùy tiện |
| AC-50 | EKYC-10, EKYC-11, EKYC-12, EKYC-13, EKYC-14 | Gửi ảnh in/ảnh trên màn hình, replay frame, sai nonce hoặc đổi người giữa challenge | Challenge/PAD/continuity phải bắt lỗi đã định nghĩa; không lấy selfie upload tùy ý thay capture; báo tỷ lệ mẫu chưa bắt được |
| AC-51 | EKYC-15, EKYC-16, MEASURE-02 | Frontend sửa threshold/parsed ID/outcome để đạt | Backend bỏ/từ chối input không được phép; chỉ kết quả server/version cấu hình tham gia quyết định |
| AC-52 | EKYC-19, EKYC-20, OPS-02, TIME-03 | Model timeout, retry và vượt số lần thất bại | Lỗi server là ERROR, không gian lận; giới hạn thử đúng scope; không giữ kho/reset thời hạn từ retry |
| AC-53 | EKYC-21, REVIEW-01, REVIEW-02, SETUP-11 | Không thực hiện được động tác hoặc dùng mẫu thẻ chưa hỗ trợ | Owner chưa kích hoạt, có hỗ trợ không bypass; Beneficiary chỉ đi xem xét/video khi đủ bằng chứng và không có giả mạo chưa giải quyết |
| AC-54 | EKYC-22, EKYC-23, EKYC-24, SETUP-01, SETUP-11 | Owner chưa đạt eKYC, thử Admin duyệt thay, rồi đăng ký kế hoạch mới bằng khuôn mặt khác | Tất cả nhánh không đủ điều kiện bị chặn; mẫu đầu chỉ từ phiên đạt và mẫu hiện có không bị ghi đè |
| AC-55 | EKYC-25, IDENTITY-01, IDENTITY-04, OPS-01 | Beneficiary eKYC đạt nhưng chưa video hoặc chưa đồng ý nhận | Không có grant, API payload từ chối; vẫn yêu cầu Executor video thật; không nút giả xác minh/thanh toán |
| AC-56 | MATCH-01, MATCH-02, MATCH-03, MATCH-06, SETUP-08 | ID trùng nhưng tên/ngày sinh khác; Owner nhập sai số; dữ liệu cũ thiếu CCCD | Không auto-pass; chỉ review lỗi trích xuất có căn cứ; không sửa snapshot/đổi Beneficiary; kế hoạch cũ cần Owner hoàn thiện trước kích hoạt |
| AC-57 | CLAIM-02, CLAIM-03, CLAIM-05, INC-11, IDENTITY-05 | Nhiều account giữ link, một claim sai ID và hai claim có bằng chứng tranh cùng designation | Mere attempt không chặn toàn kho; tranh chấp có căn cứ giữ đúng phạm vi; không lộ expected ID và không gắn hai account |
| AC-58 | REVIEW-01, REVIEW-02, REVIEW-04, REVIEW-05 | Review đủ căn cứ, hồ sơ thiếu và claim lặp ở cuối hạn lưu | Executor quyết định riêng để đi video; hold chỉ cho hồ sơ đủ và ≤7 ngày đề xuất từ lần đầu; thiếu hết hạn đóng, không cấp quyền |
| AC-59 | SCHEDULE-03, SEC-06 | Người ngoài dùng mã phòng, người bị thay Executor dùng token cũ, hoặc token hết hạn | Video server từ chối; chỉ participant có quyền vào; không thể lấy mã phòng dùng tải tài sản |
| AC-60 | SCHEDULE-01, SCHEDULE-04, ASSIGN-02, ASSIGN-03 | Hai người đặt cùng slot, Executor vắng hoặc mất quyền giữa lịch | Một slot thành công; hẹn lại/thay theo chỉ định đã chấp nhận; staff mới tự xác minh, không kế thừa kết luận cho hành động mới |
| AC-61 | ACCEPT-01, ACCEPT-04, ACCEPT-05, RETENTION-08 | Claim chưa xác minh bấm từ chối; Beneficiary đã xác minh từ chối; tìm chức năng mở lại/gia hạn | Claim đầu chỉ WITHDRAWN; quyết định thật DECLINED không chuyển người nhận; không có chức năng đã bỏ; xóa theo tham chiếu/lưu |
| AC-62 | INVITE-01, INVITE-04, OPS-04, TIME-02 | Token bị dò, gửi mọi kênh lỗi, retry gửi sau khi đã giao thành công | Không lộ PII; không chạy hạn từ lỗi; retry không reset mốc và nhắc thành công không gửi trùng |
| AC-63 | DEATH-08, DEATH-09, DEATH-10, DEATH-11 | Owner chưa nhận thông báo, chưa hết 72h, có check-in sau ngày mất, hoặc giấy đổi dữ liệu trọng yếu | Chưa duyệt khi bị chặn; có cờ/việc đúng phạm vi; bản đổi được xác nhận/thông báo và chạy cửa sổ của phiên bản đó |
| AC-64 | ALIVE-03, ALIVE-04, ALIVE-08, ALIVE-09, TIME-07 | Owner bấm báo sống nhiều lần, không hoàn tất 7 ngày, rồi bấm lại sau khi Verifier bác; Verifier quá hạn | Không reset deadline/tạo hold mới chỉ từ nút lặp; chuyển kết luận, nhắc/điều phối; không tự duyệt hoặc giữ chặn vô hạn |
| AC-65 | EKYC-26, EKYC-27, ALIVE-02, ALIVE-05 | Người nhà biết mật khẩu Owner dùng selfie của họ; chứng tử nhập sai Owner; Owner thật thực hiện challenge | Không khớp mẫu thì không xác nhận sống; không dùng hồ sơ người khác; kết quả đạt cũng cần kết luận Verifier về hồ sơ |
| AC-66 | ALIVE-05, ALIVE-06, ALIVE-07, DMS-04 | Verifier xác nhận sống, bác phản đối hoặc chưa đủ căn cứ khi đã có grant | Áp dụng đúng nhánh F2C; quyết định và hold tách biệt; xử lý grant có audit, không hứa thu hồi file đã tải |
| AC-67 | ROLE-01, ROLE-03, ROLE-05, ASSIGN-01, ASSIGN-05 | User tự xin staff, Executor và Verifier cùng người, thiếu dự phòng khi staff mất khả dụng | Không tự cấp/cho tự xét; nhân sự hợp lệ theo pool/Owner; đình trệ có việc và rà soát, không Admin mở kho |
| AC-68 | SETUP-03, SETUP-04, SETUP-05, DATA-01, ASSET-03 | Sửa nội dung sau nộp chứng tử, gom gói, hoặc tài sản chưa chỉ định | Snapshot còn content version cũ, không tự gom theo tập người nhận; tài sản ngoài kế hoạch không bàn giao |
| AC-69 | SETUP-06, SETUP-09, SETUP-10 | Thay Executor trước khi có hồ sơ và kích hoạt không có dự phòng | Người thay phải chấp nhận; Owner thấy policy và nguy cơ chưa có dự phòng; không bắt buộc dự phòng nếu theo đề xuất |
| AC-70 | ASSET-02, ASSET-05, FILE-01, NFR-07, NFR-09 | Upload file giả extension/quá lớn, bản ghi có seed phrase và di chúc Owner tự lưu | Từ chối theo MIME/giới hạn thực; bí mật chỉ trong payload; không bắt di chúc là giấy F2B |
| AC-71 | DEATH-03, DEATH-05, STATE-02 | Hai Executor gửi trùng hồ sơ hoặc Verifier xác nhận lại | Một hồ sơ hoạt động đúng phạm vi; một quyết định đúng version; xác nhận trong app không ghi là công chứng/chữ ký số pháp lý |
| AC-72 | DMS-05, DMS-06, OPLAN-04 | Owner chưa rõ tình trạng và gói hết hạn trước hồ sơ đủ điều kiện F3 | Nhắc/check-in theo cấu hình, có việc rà soát; không chạy cleanup F3 trước F3 và không tự chuyển Free để xóa snapshot |
| AC-73 | PAY-01, PAY-08, PAY-09, PAY-10 | Test webhook vào Live, gia hạn sớm/muộn, đổi gói và nhận di sản | Test không cấp Live; hạn/quota tính đúng; pay không reset check-in; Beneficiary không cần mua gói |
| AC-74 | OPLAN-01, OPLAN-02, OPLAN-03, OPLAN-05 | Gói hết khi grant còn hạn, Owner xác nhận sống chọn Free và gia hạn đồng thời cleanup | Không hủy quyền hiện có; lựa chọn/quota/30 ngày đề xuất đúng; race cho một kết quả, không hứa phục hồi dữ liệu đã xóa |
| AC-75 | ADMIN-01, ADMIN-04, ADMIN-06, ADMIN-09, ADMIN-14 | Admin xem secrets, sửa audit, vô hiệu Admin cuối hoặc export báo cáo public | API từ chối; chỉ metadata/đối chiếu được phép, báo cáo có quyền và không PII thô |
| AC-76 | ADMIN-12, ADMIN-13, ADMIN-15, OPS-06, INC-06 | eKYC/video lỗi, backup cũ được khôi phục, Admin thử đổi điểm hồ sơ | Health có metadata, evidence vận hành; restore áp dụng tombstone, không sửa điểm hay tải sinh trắc hàng loạt |
| AC-77 | INC-12, SETUP-02, PRIV-02 | Có nghi vấn chứng tử trước duyệt rồi nghi vấn sau khi Beneficiary đã được mời | Không tiết lộ chỉ định ở F1/F2; cảnh báo người được mời đúng scope, không đưa CCCD/ảnh |
| AC-78 | SEC-01, SEC-02, SEC-03, SEC-11 | Đọc storage/database, kiểm tra nonce/AAD và làm hỏng ciphertext | Không có plaintext/KEK trong DB/source/log; mật khẩu hash khác asset encryption; AEAD từ chối dữ liệu sai |
| AC-79 | SEC-04, SEC-05, ROLE-02, ROLE-06 | User/Executor/Verifier/Admin gọi endpoint tài sản hoặc giấy tờ ngoài quyền | Backend từ chối theo đối tượng, không chỉ ẩn UI; quyền đúng scope không bị cấp thêm từ vai trò |
| AC-80 | SEC-07, SEC-12, SEC-13, DATA-02, DATA-06 | Kiểm tra log/evidence URL/Owner audit và upload có path traversal | Không lộ secrets/PII/sinh trắc; URL riêng/hết hạn; Owner chỉ audit kho mình; file không thực thi |
| AC-81 | SEC-09, SEC-10, NFR-06 | Đăng nhập sai vượt ngưỡng, session idle/absolute hết, Admin thiếu xác thực bổ sung | Cooldown/expiry/MFA theo config đề xuất đã chọn; không khóa cả kho từ attacker; thao tác nhạy cảm bị chặn |
| AC-82 | PRIV-03, PRIV-04, PRIV-05, PRIV-06, PRIV-07, TIME-06 | Đến hạn xóa ảnh/mẫu, rút đồng ý, có incident dữ liệu cá nhân hoặc tombstone trong backup | Dọn đúng mục đích/hạn/hold; tạo việc pháp lý cần thiết; backup không khôi phục quyền đã xóa; mẫu không được coi ẩn danh |
| AC-83 | TIME-01, TIME-04, TIME-05, TIME-08, TIME-09, NFR-03 | Server restart, đổi giờ client, demo speed và sự cố xác nhận khi đồng hồ còn chạy | Job bền vững; deadline server chính xác; pause/resume phần còn lại đúng scope; demo không nới OTP/token; hold có hạn rà soát |
| AC-84 | NFR-01, NFR-02, NFR-04, NFR-05, NFR-13 | Đo API/eKYC, thiết bị và diễn tập restore theo baseline; triển khai mục tiêu Live sau này | Có báo cáo P95/tải/môi trường và RPO/RTO; không ghi số đo chưa chạy là đã đạt; Live availability ngoài MVP |
| AC-85 | NFR-10, NFR-11, NFR-12, MEASURE-01, MEASURE-02, OPS-07 | Hiệu chỉnh và đánh giá trên người độc lập, mẫu thẻ và tấn công đã chọn | Báo riêng QR/OCR/PAD/face và false accept/reject có mẫu số, ngưỡng version/chấp thuận; không dùng mẫu công khai chứng minh đúng người |
| AC-86 | AUTH-03, AUTH-05, DATA-03 | User Google thêm mật khẩu, bỏ phương thức cuối, đổi contact/profile hoặc khôi phục tài khoản | Xác thực lại trước thay; không mất phương thức cuối, không đổi designation/biometric/hold/grant chỉ từ profile hay recovery |
| AC-87 | RETENTION-07, SETUP-09 | Owner đọc màn hình thiết lập và cảnh báo lưu/xóa | Hiển thị hạn sản phẩm và điều kiện xóa, không gọi đó là thời hiệu luật thừa kế; lưu version chính sách đã đồng ý |
| AC-88 | CLAIM-06, SCHEDULE-05, TIME-03, TIME-04 | Đặt lịch hơn 14 ngày hoặc vượt hạn claim 30 ngày; bổ sung lặp/hẹn lại/lỗi kỹ thuật được xác nhận | Lịch vượt bị chặn; deadline đầu không reset; lỗi xác nhận pause đúng phần còn lại, hết claim không nhận thì đóng và tiếp tục lưu |

### 13.1. Thứ tự chạy và bằng chứng

1. **Quyền/trạng thái:** unit và integration test guard, claim/role/hold, bảng chuyển trạng thái; gọi trực tiếp API ngoài UI.
2. **Giao dịch:** integration với database thật cho nhận lặp, lịch trùng, webhook trùng, Owner báo sống đồng thời nhận và cleanup đồng thời claim/renew.
3. **eKYC:** thực hiện camera và model thật; bộ ảnh/thẻ được đồng ý, thử QR/OCR, replay/PAD/match; lưu báo cáo tổng hợp không chứa PII thô.
4. **Tích hợp:** Google token thật/invalid, webhook SePay có xác thực, email/SMS và video participant token; Test/Live tách rõ.
5. **E2E:** tạo kho đến bàn giao, chủ còn sống và giả mạo, đồng thụ hưởng, không phản hồi/cleanup; quan sát audit và dữ liệu sau restart.
6. **Vận hành:** đo các NFR đã chọn, restore/tombstone và dọn evidence; ghi điều kiện chưa đạt/ngoài MVP.

Bằng chứng mỗi lần chạy: build/config version, AC, dữ liệu mẫu không lộ bí mật, request/result tối thiểu, trạng thái trước/sau, audit ID và kết quả pass/fail. Nghiệm thu MVP cần các Must/MVP Có đạt với cấu hình đã chấp thuận và không còn lỗi vượt quyền/phát hành/xóa sai; Should chưa đạt phải ghi rõ đánh đổi, không âm thầm bỏ chức năng đã chốt.

## 14. Phụ lục

### 14.1. Liên hệ đề bài giáo viên

Số flow trong đề bài và số main flow của SRS là hai cách nhóm khác nhau. Bản này vẫn có F1–F4 và P, không đổi thành 11 main flow.

| Flow đề bài LegacyVault.docx    | Vị trí trong bản này                                                          |
| ------------------------------- | ----------------------------------------------------------------------------- |
| 1 — Tài khoản, vai trò, RBAC    | F1 và F4                                                                      |
| 2 — Tạo/mã hóa kho              | F1, SEC                                                                       |
| 3 — Chỉ định/ủy quyền           | F1; hồ sơ căn cước bắt buộc                                                   |
| 4 — Điểm danh                   | F2A                                                                           |
| 5 — Chứng tử/cấp phép tiếp tục  | F2B và F2C phản đối; duyệt chưa cấp grant                                     |
| 6 — Thông báo/xác minh/bàn giao | F3 với eKYC rồi video                                                         |
| 7 — Audit/cảnh báo              | F4, SEC, Owner audit                                                          |
| 8 — Tiến độ/đóng hồ sơ          | F3; task, grant, retention riêng                                              |
| 9 — Trao đổi tài liệu/chữ ký    | Bổ sung chứng tử/xác nhận điện tử/lịch sử; chữ ký số pháp lý ngoài phạm vi    |
| 10 — Cấu hình/sao lưu           | F4 theo dõi, cấu hình mặc định; restore hạ tầng kiểm soát riêng               |
| 11 — Tích hợp pháp lý           | Chưa triển khai công chứng/chữ ký số; eKYC cơ bản không thay tích hợp pháp lý |

### 14.2. Công nghệ và giấy phép

Không ấn định framework frontend/backend chính ngoài nhu cầu tích hợp. Model được ghim version/checksum trong manifest triển khai; giấy phép source không tự bao phủ mọi weights, dữ liệu huấn luyện hoặc dịch vụ nhà cung cấp. Bảng dưới dùng để nhóm kiểm tra bản cụ thể trước phát hành.

| Thành phần | Dùng ở đâu | Giấy phép/điểm cần kiểm tra | Nguồn chính thức |
| --- | --- | --- | --- |
| PaddleOCR | Detect vùng chữ; có thể recognizer nếu đo phù hợp | Repo Apache-2.0; kiểm tra đúng model/weights | [Repo](https://github.com/PaddlePaddle/PaddleOCR) |
| VietOCR | Nhận dạng vùng chữ tiếng Việt đã cắt | Repo Apache-2.0; không tự sửa dấu text OCR | [Repo](https://github.com/pbcquoc/vietocr) |
| QR decoder | Đọc dữ liệu mẫu căn cước hỗ trợ | Chưa chọn thư viện; ghi package/version/license khi chọn | [Thông tin mẫu thẻ Bộ Công an](https://bocongan.gov.vn/bai-viet/ban-hanh-mau-the-can-cuoc-mau-giay-chung-nhan-can-cuoc-su-dung-tu-0172024-d1-t1415) |
| MediaPipe FaceLandmarker | Hướng dẫn/đo landmarks, biểu cảm và động tác; backend xác minh evidence | Kiểm tra license runtime/model cụ thể; không dùng landmark như chứng nhận liveness | [Tài liệu](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker) |
| MiniFASNet | PAD RGB trên bằng chứng camera | Silent-Face repo Apache-2.0; có giới hạn thiết bị/domain, không bảo đảm chống deepfake | [License](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/master/LICENSE), [README](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/master/README_EN.md) |
| YuNet | Detect/crop khuôn mặt | Folder model OpenCV Zoo công bố MIT; kiểm tra bản weights sử dụng | [Model](https://github.com/opencv/opencv_zoo/blob/main/models/face_detection_yunet/README.md) |
| SFace | Embedding/so mặt selfie–thẻ và selfie–mẫu | Folder model Apache-2.0; ngưỡng cần hiệu chỉnh | [Model](https://github.com/opencv/opencv_zoo/blob/main/models/face_recognition_sface/README.md) |
| Google Identity | Đăng nhập/liên kết tài khoản | Điều khoản dịch vụ/SDK, cấu hình OAuth và token verify | [Tài liệu](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) |
| SePay | QR, webhook/đối chiếu | Dịch vụ đã chọn; xác nhận phương thức webhook/giới hạn của tài khoản | [Webhook](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook) |
| Video trong app | Room/participant token, audio/video | Chưa chọn provider; cần đáp ứng SCHEDULE-03. LiveKit là ví dụ, chưa quyết định sử dụng | [Ví dụ LiveKit](https://docs.livekit.io/frontends/reference/tokens-grants/) |
| Email/SMS | Mời/nhắc/phản đối | Chưa chốt provider SMS và bằng chứng delivery; email không gọi chung là Gmail | Hợp đồng/tài liệu provider khi chọn |

### 14.3. Prototype hiện có và việc phải bổ sung

Đã khảo sát thư mục `ekyc-prototype` khi lập SRS: có FastAPI OCR, face-match, PAD và liveness challenge; dùng model thực, chưa phải bộ xác minh nhận di sản hoàn chỉnh. Đây là ghi nhận mã nguồn, không chứng minh độ chính xác đạt nghiệm thu.

| Hiện có | Cần làm để đáp ứng bản này |
| --- | --- |
| OCR/PAD/face-match/liveness endpoints | Bọc thành API nội bộ xác thực; backend chính mở phiên theo user/purpose/object/version |
| Challenge server có nonce/hạn, kiểm tra một mặt, selfie từ phiên | Lưu trạng thái bền vững/điều phối khi nhiều worker; consume chống replay và binding với claim |
| Face-match nhận reference/selfie và threshold từ request | Loại quyền user chọn tham chiếu/ngưỡng; dùng evidence đúng phiên và cấu hình server |
| Parser/OCR ảnh thẻ | Bổ sung QR trước; kiểm thử từng mẫu thẻ và đối chiếu QR/OCR |
| Phiên/giới hạn trong RAM | Ràng buộc account/purpose, audit an toàn, giới hạn theo scope, cleanup/consent; restart không bypass guard |
| Model weights và ảnh mẫu | Manifest/giấy phép; dataset người đồng ý, tách calibration/evaluation, không dùng Lena/Messi thay ca danh tính thật |
| Tham số thử cosine/PAD | Hiệu chỉnh, đo false accept/reject và phiên bản cấu hình; chưa có threshold cuối |

Không sửa prototype trong công việc lập tài liệu này. Kế hoạch triển khai ưu tiên ràng buộc quyền/phiên trước khi đưa model vào quyết định cấp quyền.

### 14.4. Hướng dẫn nhãn swimlane

Lane F3: **LegacyVault / Beneficiary / Executor**. Verifier xuất hiện ở F2, không tham gia video người nhận. Có thể tách F3A mời–eKYC–lịch và F3B video–quyết định–tải/lưu.

- F1: “Kiểm tra file/quota” → “Mã hóa AES-256-GCM bằng DEK; bọc DEK bằng KEK” → “Lưu bản mã và phiên bản”.
- F3 trước video: “eKYC và đối chiếu căn cước/họ tên/ngày sinh với chỉ định” → quyết định “Đủ điều kiện đi video?”.
- Video: quyết định “Đủ điều kiện quan sát?” rồi “Đúng người được chỉ định?”; không dùng một nút “Cuộc gọi hoàn tất?” để suy ra đúng người.
- Sau chấp thuận: “Kiểm tra quyền và tạo grant nguyên tử” → “Kiểm tra grant/hold/hạn” → “Giải mã AES-GCM, kiểm tra toàn vẹn” → “Xem/tải”.
- Cleanup: “Hết hạn lưu?” → “Không còn claim đủ điều kiện/grant/tham chiếu/hold?” → “Thu hồi link, xóa bản mã/khóa hết tham chiếu, ghi tombstone”.
- F4: “Đã có sự cố mở?” → “Cần xử lý?” → “Đã khắc phục?” → “Đủ điều kiện đóng/gỡ đúng chặn?”.

Dùng hình chữ nhật cho xử lý, thoi cho điều kiện có nhãn nhánh, ellipse cho đầu/cuối; input/output và connector theo quy tắc giáo viên. Thông số crypto chi tiết để trong SRS; sơ đồ ghi thuật toán/mục đích và điều kiện quyền đủ để dev tra mã yêu cầu, không cần vẽ mọi bước SDK.

### 14.5. Kịch bản demo

| Kịch bản | Đường đi và kết quả cần chứng minh |
| --- | --- |
| Bình thường | F1 email/Google, Owner eKYC đạt, trả gói, mã hóa/gói/Executor nhận → F2 check-in/nộp chứng tử/thông báo/cửa sổ/Verifier → F3 account khác email chỉ định vẫn vào eKYC; đúng căn cước/video/đồng ý/grant/tải |
| Người nhà biết mật khẩu | Nộp chứng tử; account Owner bấm sống chặn ngay nhưng selfie người nhà không khớp; hết hạn Verifier kết luận, không chặn vô hạn chỉ từ nút |
| Owner thật còn sống | Selfie đúng mẫu; Verifier xác nhận, hồ sơ chết từ chối, kế hoạch/kỳ điểm danh trở lại điều kiện phù hợp |
| Link chuyển tiếp/sai người | Account khác có eKYC cá nhân đạt nhưng ID không khớp; chưa video/grant; không làm mất phần người thật |
| Cùng gói A/B | A đúng và nhận được tải ngay; B chờ/từ chối không khóa A; cleanup không xóa dữ liệu A còn quyền |
| Không phản hồi | 5 ngày → lưu 30 ngày → cảnh báo/xét tham chiếu → cleanup/tombstone; vào bằng link trong hạn không reset thời gian |
| Lỗi tích hợp | SePay trùng/sai, video no-show staff và eKYC timeout → F4; không giả paid/đúng người, có người/hạn và kết quả đóng |

Chế độ rút ngắn ngày chỉ dành nghiệp vụ trong môi trường demo. Các bước camera, crypto, API quyền và provider vẫn chạy thực tế. Dữ liệu demo được đồng ý và không dùng seed phrase/tài khoản thật có tài sản.

### 14.6. Lịch sử và chuyển đổi yêu cầu

| Phiên bản | Vai trò trong lịch sử |
| --- | --- |
| 3.5.4 | Nền nhóm từng chọn: Owner tự quản lý gói, không bắt ngày nhận chung |
| 3.11.x | Phương án gộp và ngày chung đã được nhóm xem xét lại; không dùng làm quy tắc hiện hành |
| 3.12.1 | Bốn main flow, Google/SePay/video, quyền người nhận độc lập, hạn nhận/tải/lưu và Admin sự cố |
| 3.13.0 | Bỏ đối chiếu contact trước eKYC; eKYC chung/đối chiếu căn cước bắt buộc; phản đối sống có hạn; trạng thái/AC/NFR/privacy rõ hơn |

Các mã trong bảng dưới chỉ để truy lịch sử, không là yêu cầu hiện hành cần nghiệm thu.

| Mã cũ v3.12.1 | Xử lý trong v3.13.0 |
| --- | --- |
| CONTACT-01 | Bỏ cổng khớp contact; thay bằng CLAIM-01, MATCH-07 và AUTH-04 cho xác minh tài khoản |
| CONTACT-02/03/04 | Di chuyển sang CLAIM-02/03/04; sửa điều kiện xung đột để tránh chặn toàn kho từ claim bất kỳ |
| EXCEPTION-01/02/03 | Bỏ ngoại lệ chỉ vì contact không khớp; dùng MATCH-01–06, REVIEW-01–05 cho bằng chứng danh tính |
| IDENTITY-01, SETUP-01, DEATH-07 | Mở rộng để có eKYC/đăng ký Owner/phản đối; video và phân quyền vẫn bắt buộc |
| AC-13/14/15/25/34 | Viết lại tương ứng gate mới, hold đủ điều kiện và báo sống |

Tài liệu nguồn nội bộ: `SRS/LegacyVault-SRS-v3.12.1.md`, `LegacyVault.docx`, các quyết định của nhóm trong phiên làm việc và prototype eKYC. Bản hiện tại tự mô tả quy tắc; đọc bản cũ chỉ cần khi truy lịch sử.
