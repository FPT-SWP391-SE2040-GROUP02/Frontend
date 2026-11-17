/**
 * Mở hộp thoại in của trình duyệt cho một đoạn HTML đã dựng sẵn; người dùng chọn "Lưu thành PDF" để lưu lại.
 * Dùng iframe ẩn và chép các stylesheet của trang vào để giữ nguyên kiểu chữ, không mở thêm cửa sổ.
 *
 * @param html Nội dung (outerHTML) cần in.
 * @param title Tiêu đề tài liệu; trình duyệt dùng làm tên tệp gợi ý khi lưu PDF.
 */
export function printHtml(html: string, title: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const frameDocument = frame.contentDocument;
  const frameWindow = frame.contentWindow;
  if (!frameDocument || !frameWindow) {
    document.body.removeChild(frame);
    return;
  }

  let styles = "";
  const nodes = document.querySelectorAll('link[rel="stylesheet"], style');
  nodes.forEach((node) => {
    styles += node.outerHTML;
  });

  frameDocument.open();
  frameDocument.write(
    "<!doctype html><html><head><meta charset='utf-8'><title></title>" +
      styles +
      "<style>@page{size:A4;margin:14mm 0}body{background:#fff;margin:0;padding:0}" +
      // Lề trái phải đặt bằng đệm của tờ in, không nhờ vào lề trang của trình duyệt (có máy đặt sẵn "Margins: None" làm chữ sát mép bị cắt).
      ".print-slip{box-sizing:border-box!important;padding:0 18mm!important}" +
      // Cho nội dung tràn hết bề ngang tờ giấy: bỏ khung viền, giới hạn bề ngang và đệm của khung đọc trên màn hình.
      ".print-slip article{max-width:none!important;width:100%!important;border:0!important;border-radius:0!important;padding:0!important;font-size:13pt!important;line-height:1.55!important}" +
      "</style></head><body></body></html>",
  );
  frameDocument.close();
  frameDocument.title = title;
  // Lớp print-slip của trang: CSS in của app ẩn mọi thứ trong body ngoài phần tử này, nên phải bọc vào.
  frameDocument.body.innerHTML = '<div class="print-slip">' + html + "</div>";

  const cleanup = () => {
    if (frame.parentNode) {
      frame.parentNode.removeChild(frame);
    }
  };
  frameWindow.addEventListener("afterprint", cleanup);
  // Chờ stylesheet nạp xong rồi mới in, nếu không bản in bị mất kiểu.
  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 60000);
  }, 400);
}
