import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ekycService } from "../../api/ekycService";
import { EkycStatusPanel } from "../EkycStatusPanel";

// Trạng thái cuối mà thử thách camera (giả lập) báo về khi người dùng bấm "Hoàn tất thử thách".
let finalStatus: unknown;

vi.mock("../../api/ekycService", () => ({
  ekycService: {
    getStatus: vi.fn(),
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
const TURN_ID = "22222222-2222-4222-8222-222222222222";

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
    purpose: "BENEFICIARY_CLAIM",
    identityMatch: "MATCHED",
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
  identityMatch: "MATCHED" as const,
  canMatchFace: true,
  expiresAt: null,
  warnings: [],
};

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("ekyc-beneficiary-fixture");
  vi.mocked(ekycService.getStatus).mockResolvedValue(
    statusFixture({
      status: "NOT_STARTED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: null,
      spoofCheckPassed: null,
      purpose: null,
      identityMatch: "NOT_CHECKED",
      backSideChecked: false,
    }) as never,
  );
  vi.mocked(ekycService.submitConsent).mockResolvedValue({
    purpose: "BENEFICIARY_CLAIM",
    noticeVersion: "v1",
    consentedAt: "2026-12-01T00:00:00Z",
    expiresAt: "2026-12-01T00:30:00Z",
  } as never);
  vi.mocked(ekycService.submitDocument).mockResolvedValue(document);
  vi.mocked(ekycService.confirmDocument).mockResolvedValue(statusFixture() as never);
  vi.mocked(ekycService.submitDocumentBack).mockResolvedValue({
    ...statusFixture({ status: "PENDING" }),
    residenceAddress: "",
  } as never);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
});

function setup(props: { canComplete?: boolean; onComplete?: () => void } = {}) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VERIFICATION_ID,
        email: "recipient@example.test",
        fullName: "Recipient",
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
        <MemoryRouter>
          <EkycStatusPanel
            purpose="BENEFICIARY_CLAIM"
            turnId={TURN_ID}
            canComplete={props.canComplete}
            onComplete={props.onComplete}
          />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

async function reachLiveness() {
  for (const box of await screen.findAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý và bắt đầu" }));
  const input = await screen.findByLabelText("Ảnh mặt trước giấy tờ");
  await userEvent.upload(input, new File(["x"], "front.jpg", { type: "image/jpeg" }));
  fireEvent.click(screen.getByRole("button", { name: "Đọc thông tin" }));
  await screen.findByLabelText("Họ và tên");
  await userEvent.upload(
    screen.getByLabelText("Ảnh mặt sau giấy tờ"),
    new File(["y"], "back.jpg", { type: "image/jpeg" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Đọc mặt sau" }));
  await screen.findByText(/Đã nhận ảnh mặt sau/);
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  await screen.findByRole("button", { name: "Hoàn tất thử thách" });
}

describe("người nhận xác minh eKYC thành công", () => {
  it("đạt và khớp người được chỉ định thì sang thẻ thành công, không còn khu tải ảnh", async () => {
    finalStatus = statusFixture();
    setup({ canComplete: true });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));

    expect(await screen.findByText("Danh tính đã được xác minh.")).toBeInTheDocument();
    expect(
      screen.getByText("Thông tin giấy tờ khớp với người được chỉ định nhận."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bắt đầu lại từ đầu" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ảnh mặt trước giấy tờ")).not.toBeInTheDocument();
  });

  it("nút hoàn tất danh tính nằm trên thẻ thành công và chỉ gọi khi bấm", async () => {
    finalStatus = statusFixture();
    const onComplete = vi.fn();
    setup({ canComplete: true, onComplete });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));

    const button = await screen.findByRole("button", { name: "Hoàn tất danh tính lượt nhận" });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("chưa đủ điều kiện hoàn tất thì chỉ báo đang chuẩn bị, không có nút", async () => {
    finalStatus = statusFixture();
    setup({ canComplete: false });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));

    expect(await screen.findByText("Danh tính đã được xác minh.")).toBeInTheDocument();
    expect(screen.getByText(/Đang chuẩn bị bước hoàn tất danh tính/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hoàn tất danh tính lượt nhận" }),
    ).not.toBeInTheDocument();
  });

  it("cần kiểm tra thêm thì không sang thẻ thành công", async () => {
    finalStatus = statusFixture({ identityMatch: "NEEDS_REVIEW" });
    setup({ canComplete: true });
    await reachLiveness();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thử thách" }));

    expect(await screen.findByText("Cần kiểm tra thêm")).toBeInTheDocument();
    expect(
      screen.queryByText("Thông tin giấy tờ khớp với người được chỉ định nhận."),
    ).not.toBeInTheDocument();
  });
});
