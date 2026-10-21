import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ekycService } from "../../api/ekycService";
import { EkycUploads } from "../EkycUploads";

// Trạng thái cuối mà thử thách camera (giả lập) báo về khi người dùng bấm "Hoàn tất thử thách".
let finalStatus: unknown;

vi.mock("../../api/ekycService", () => ({
  ekycService: {
    submitConsent: vi.fn(),
    submitDocument: vi.fn(),
    submitDocumentBack: vi.fn(),
    confirmDocument: vi.fn(),
  },
}));
vi.mock("../LivenessPanel", () => ({
  LivenessPanel: ({ onCompleted }: { onCompleted: (status: unknown) => void }) => (
    <button type="button" onClick={() => onCompleted(finalStatus)}>
      Hoàn tất thử thách
    </button>
  ),
}));

const VERIFICATION_ID = "11111111-1111-4111-8111-111111111111";

function statusFixture(overrides: Record<string, unknown> = {}) {
  return {
    status: "PASSED",
    verificationId: VERIFICATION_ID,
    citizenIdLast4: "5608",
    faceMatchScore: 0.52,
    matchThreshold: 0.363,
    spoofCheckPassed: true,
    createdAt: null,
    completedAt: null,
    purpose: "OWNER_ENROLLMENT",
    identityMatch: "NOT_CHECKED",
    backSideChecked: true,
    ...overrides,
  };
}

const document = {
  verificationId: VERIFICATION_ID,
  idNumber: "079206015608",
  fullName: "NGUYEN VAN A",
  dateOfBirth: "11/11/2000",
  residenceAddress: "12 Đường Thử",
  identityMatch: "NOT_CHECKED" as const,
  canMatchFace: true,
  expiresAt: null,
  warnings: [],
};

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("ekyc-flow-fixture");
  vi.mocked(ekycService.submitConsent).mockResolvedValue({
    purpose: "OWNER_ENROLLMENT",
    noticeVersion: "v1",
    consentedAt: "2026-12-01T00:00:00Z",
    expiresAt: "2026-12-01T00:30:00Z",
  } as never);
  vi.mocked(ekycService.submitDocument).mockResolvedValue(document);
  vi.mocked(ekycService.confirmDocument).mockResolvedValue(statusFixture() as never);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
});

function setup() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VERIFICATION_ID,
        email: "owner@example.test",
        fullName: "Owner",
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: false,
        createdAt: "2026-10-01T00:00:00Z",
      },
    }),
  );
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <EkycUploads purpose="OWNER_ENROLLMENT" canComplete={false} onComplete={() => undefined} />
      </QueryClientProvider>
    </Provider>,
  );
}

async function reachLiveness() {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Tôi đồng ý và tiếp tục" }));
  const input = await screen.findByLabelText("Ảnh mặt trước giấy tờ");
  await userEvent.upload(input, new File(["x"], "front.jpg", { type: "image/jpeg" }));
  fireEvent.click(screen.getByRole("button", { name: "Đọc thông tin" }));
  await screen.findByLabelText("Họ và tên");
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  await screen.findByRole("button", { name: "Hoàn tất thử thách" });
}

describe("luồng eKYC theo thiết kế", () => {
  it("bắt đầu ở bước Đọc căn cước và hiện đủ ba bước theo thứ tự Backend yêu cầu", () => {
    setup();
    const steps = screen.getByRole("list", { name: "Các bước xác minh" });
    const items = within(steps).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Đọc căn cước");
    expect(items[1]).toHaveTextContent("Kiểm tra camera");
    expect(items[2]).toHaveTextContent("So khớp khuôn mặt");
    expect(items[0]).toHaveAttribute("aria-current", "step");
  });

  it("sau khi xác nhận bản khai chuyển sang bước camera", async () => {
    await reachLiveness();
    const items = within(screen.getByRole("list", { name: "Các bước xác minh" })).getAllByRole(
      "listitem",
    );
    expect(items[1]).toHaveAttribute("aria-current", "step");
  });

  it("kết quả đạt: hiện điểm cosine thật, không đổi thành phần trăm", async () => {
    finalStatus = statusFixture();
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));
    expect(await screen.findByText("Khuôn mặt khớp với căn cước")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Điểm khớp 0.52" })).toBeInTheDocument();
    expect(screen.getByText("Điểm khớp đạt ngưỡng (0.52 / 0.36)")).toBeInTheDocument();
    expect(screen.getByText("Qua kiểm tra chống giả mạo")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Đã hoàn tất bước xác minh.");
    expect(screen.queryByRole("button", { name: "Đọc lại căn cước" })).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("kết quả không đạt: báo Chưa đủ độ khớp và cho đọc lại căn cước từ đầu", async () => {
    finalStatus = statusFixture({ status: "FAILED", faceMatchScore: 0.2, spoofCheckPassed: true });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));
    expect(await screen.findByText("Chưa đủ độ khớp")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Lần xác minh chưa đạt yêu cầu.");
    fireEvent.click(screen.getByRole("button", { name: "Đọc lại căn cước" }));
    expect(
      await screen.findByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).toBeInTheDocument();
  });

  it("sai người thì nói rõ không hoàn tất được lượt này", async () => {
    finalStatus = statusFixture({
      status: "FAILED",
      identityMatch: "WRONG_PERSON",
      purpose: "BENEFICIARY_CLAIM",
    });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Khuôn mặt không khớp với giấy tờ. Không thể hoàn tất lượt này.",
    );
    expect(screen.getByText("Khớp hồ sơ người nhận được chỉ định")).toBeInTheDocument();
  });

  it("cần kiểm tra thêm thì không báo đạt", async () => {
    finalStatus = statusFixture({ identityMatch: "NEEDS_REVIEW" });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));
    expect(await screen.findByText("Cần kiểm tra thêm")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Cần kiểm tra thêm trước khi hoàn tất");
    expect(screen.queryByText("Khuôn mặt khớp với căn cước")).not.toBeInTheDocument();
  });
});

describe("ô chọn ảnh giấy tờ", () => {
  async function reachFront() {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Tôi đồng ý và tiếp tục" }));
    return screen.findByLabelText("Ảnh mặt trước giấy tờ");
  }

  it("khóa nút Đọc thông tin tới khi chọn ảnh, rồi hiện tên tệp đã chọn", async () => {
    const input = await reachFront();
    expect(screen.getByRole("button", { name: "Đọc thông tin" })).toBeDisabled();
    await userEvent.upload(input, new File(["x"], "can-cuoc.jpg", { type: "image/jpeg" }));
    expect(screen.getByText("can-cuoc.jpg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đọc thông tin" })).toBeEnabled();
  });

  it("nhận ảnh kéo thả", async () => {
    await reachFront();
    const zone = screen.getByText("Chọn ảnh mặt trước").closest("div") as HTMLElement;
    const file = new File(["x"], "keo-tha.png", { type: "image/png" });
    // Giả lập FileList: trình duyệt thật đưa vào dataTransfer.files có phương thức item().
    fireEvent.drop(zone, { dataTransfer: { files: { item: () => file, length: 1 } } });
    await waitFor(() => expect(screen.getByText("keo-tha.png")).toBeInTheDocument());
  });

  it("từ chối tệp không phải ảnh và không gửi lên máy chủ", async () => {
    const input = await reachFront();
    // fireEvent bỏ qua lọc accept của trình duyệt, giống người dùng kéo thả tệp lạ.
    fireEvent.change(input, {
      target: { files: [new File(["x"], "ghi-chu.txt", { type: "text/plain" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đọc thông tin" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Chỉ chấp nhận ảnh JPEG hoặc PNG.");
    expect(ekycService.submitDocument).not.toHaveBeenCalled();
  });

  it("mặt sau là tùy chọn: chưa đọc mặt trước thì tab mặt sau bị khóa", async () => {
    await reachFront();
    fireEvent.click(screen.getByRole("tab", { name: /Mặt sau/ }));
    expect(screen.getByLabelText("Ảnh mặt sau giấy tờ")).toBeDisabled();
    expect(screen.getByText(/Đọc mặt trước trước/)).toBeInTheDocument();
  });
});
