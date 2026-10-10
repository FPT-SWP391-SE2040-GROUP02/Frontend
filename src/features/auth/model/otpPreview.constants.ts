/** Nội dung modal OTP mẫu; không đại diện kết quả xác thực từ máy chủ. */
export const OTP_PREVIEW_CONTENT = {
  title: "Bản xem trước nhập mã OTP",
  description: "Chưa gửi mã hoặc xác thực với máy chủ.",
  emailContext: "Email ngữ cảnh:",
  label: "Mã xác thực gồm 6 chữ số",
  placeholder: "1 2 3 4 5 6",
  invalid: "Vui lòng nhập đầy đủ 6 chữ số mã OTP.",
  valid: "Mã có đúng 6 chữ số. Chưa được xác thực với máy chủ.",
  resendHint: "Không nhận được mã?",
  resend: "Gửi lại mã — chưa tích hợp",
  cancel: "Hủy bỏ",
  submit: "Kiểm tra định dạng",
} as const;
