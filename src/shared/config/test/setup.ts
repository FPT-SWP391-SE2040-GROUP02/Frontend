import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { setSuccessHoldMs } from "@/shared/lib/useSuccessHold";

// Test không phải chờ nhịp giữ dấu tích của ActionButton.
setSuccessHoldMs(0);

// findBy* và waitFor mặc định chờ 1 giây, dễ hụt khi nhiều jsdom chạy song song (hook trước commit, CI) dù test đúng;
// nới lên 5 giây. Test đúng vẫn xong ngay khi phần tử xuất hiện, chỉ test sai mới chờ hết.
configure({ asyncUtilTimeout: 5000 });
