import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ekycBackSchema } from "../../model/ekyc.schema";
import { ekycService } from "../../api/ekycService";
import { EkycUploads } from "../EkycUploads";

vi.mock("../../api/ekycService", () => ({
  ekycService: {
    submitConsent: vi.fn(),
    submitDocument: vi.fn(),
    submitDocumentBack: vi.fn(),
    confirmDocument: vi.fn(),
  },
}));
vi.mock("../LivenessPanel", () => ({
  LivenessPanel: () => <p>Thử thách camera đang mở</p>,
}));

const VERIFICATION_ID = "11111111-1111-4111-8111-111111111111";
const status = {
  status: "PENDING" as const,
  verificationId: VERIFICATION_ID,
  citizenIdLast4: "5608",
  faceMatchScore: null,
  matchThreshold: 0.363,
  spoofCheckPassed: null,
  createdAt: null,
  completedAt: null,
  purpose: "OWNER_ENROLLMENT" as const,
  identityMatch: "NOT_CHECKED" as const,
  backSideChecked: true,
};
const front = (residenceAddress: string) => ({
  verificationId: VERIFICATION_ID,
  idNumber: "079206015608",
  fullName: "NGUYEN VAN A",
  dateOfBirth: "11/11/2000",
  residenceAddress,
  identityMatch: "NOT_CHECKED" as const,
  canMatchFace: true,
  expiresAt: null,
  warnings: [],
});
const image = (name: string) => new File(["x"], name, { type: "image/jpeg" });

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("ekyc-fixture");
  vi.mocked(ekycService.submitConsent).mockResolvedValue({
    purpose: "OWNER_ENROLLMENT",
    noticeVersion: "v1",
    expiresAt: "2026-12-01T00:00:00Z",
  } as never);
  vi.mocked(ekycService.confirmDocument).mockResolvedValue(status);
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
        <MemoryRouter>
          <EkycUploads
            purpose="OWNER_ENROLLMENT"
            canComplete={false}
            onComplete={() => undefined}
          />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

/** Đồng ý và gửi mặt trước với địa chỉ OCR cho trước. */
async function reachReview(frontAddress: string) {
  vi.mocked(ekycService.submitDocument).mockResolvedValue(front(frontAddress));
  setup();
  for (const box of screen.getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý và bắt đầu" }));
  const input = await screen.findByLabelText("Ảnh mặt trước giấy tờ");
  await userEvent.upload(input, image("front.jpg"));
  fireEvent.click(screen.getByRole("button", { name: "Đọc thông tin" }));
  await screen.findByLabelText("Họ và tên");
}

async function sendBack() {
  await userEvent.upload(screen.getByLabelText("Ảnh mặt sau giấy tờ"), image("back.jpg"));
  fireEvent.click(screen.getByRole("button", { name: "Đọc mặt sau" }));
}

const address = () => screen.getByLabelText("Nơi cư trú / địa chỉ thường trú") as HTMLInputElement;

describe("EkycUploads: mặt sau trước khi xác nhận (BR-88)", () => {
  it("cho gửi mặt sau ngay khi chưa xác nhận và gợi ý khi mặt trước thiếu địa chỉ", async () => {
    await reachReview("");
    expect(screen.getByText(/Thêm ảnh mặt sau thật nét ở tab Mặt sau/)).toBeInTheDocument();
    expect(screen.getByLabelText("Ảnh mặt sau giấy tờ")).toBeEnabled();
  });

  it("điền địa chỉ đọc từ mặt sau, ở lại để đối chiếu rồi mới sang camera sau khi xác nhận", async () => {
    await reachReview("");
    vi.mocked(ekycService.submitDocumentBack).mockResolvedValue({
      ...status,
      residenceAddress: "12 Đường Thử, Quận 1",
    });
    await sendBack();

    await waitFor(() => expect(address().value).toBe("12 Đường Thử, Quận 1"));
    // Chưa xác nhận thì chưa sang bước camera.
    expect(screen.queryByText("Thử thách camera đang mở")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
    expect(await screen.findByText("Thử thách camera đang mở")).toBeInTheDocument();
    expect(ekycService.confirmDocument).toHaveBeenCalledWith(
      expect.objectContaining({ residenceAddress: "12 Đường Thử, Quận 1" }),
    );
  });

  it("không đọc được địa chỉ mặt sau thì giữ ô trống, báo rõ và vẫn bắt nhập tay", async () => {
    await reachReview("");
    vi.mocked(ekycService.submitDocumentBack).mockResolvedValue({
      ...status,
      residenceAddress: "",
    });
    await sendBack();

    expect(await screen.findByText(/Chưa đọc được địa chỉ từ mặt sau/)).toBeInTheDocument();
    expect(address().value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
    expect(await screen.findByText("Nhập địa chỉ cư trú.")).toBeInTheDocument();
    expect(ekycService.confirmDocument).not.toHaveBeenCalled();
    expect(screen.queryByText("Thử thách camera đang mở")).not.toBeInTheDocument();
  });

  it("không ghi đè địa chỉ người dùng đã có từ mặt trước", async () => {
    await reachReview("Địa chỉ mặt trước");
    vi.mocked(ekycService.submitDocumentBack).mockResolvedValue({
      ...status,
      residenceAddress: "Địa chỉ mặt sau",
    });
    await sendBack();

    await screen.findByText(/Đã nhận ảnh mặt sau/);
    expect(address().value).toBe("Địa chỉ mặt trước");
  });

  it("mặt sau là tùy chọn: xác nhận bản khai xong là sang camera, không đòi gửi mặt sau", async () => {
    await reachReview("Địa chỉ mặt trước");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
    expect(await screen.findByText("Thử thách camera đang mở")).toBeInTheDocument();
    expect(ekycService.submitDocumentBack).not.toHaveBeenCalled();
  });

  it("gửi mặt trước mới thì bỏ địa chỉ mặt sau cũ", async () => {
    await reachReview("");
    vi.mocked(ekycService.submitDocumentBack).mockResolvedValue({
      ...status,
      residenceAddress: "Địa chỉ mặt sau cũ",
    });
    await sendBack();
    await waitFor(() => expect(address().value).toBe("Địa chỉ mặt sau cũ"));

    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu lại từ đầu" }));
    expect(screen.getByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Địa chỉ mặt sau cũ")).not.toBeInTheDocument();
  });
});

describe("ekycBackSchema", () => {
  it("coi BE cũ không trả residenceAddress là chưa đọc được", () => {
    expect(ekycBackSchema.parse(status).residenceAddress).toBe("");
  });

  it("giữ địa chỉ BE trả về", () => {
    expect(ekycBackSchema.parse({ ...status, residenceAddress: "Số 1" }).residenceAddress).toBe(
      "Số 1",
    );
  });
});
