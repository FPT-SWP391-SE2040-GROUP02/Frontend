import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { afterEach, expect, it, vi } from "vitest";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { executorWillService } from "@/entities/will/api/executorWillService";
import { ExecutorWillButton } from "../ExecutorWillButton";

const AT = "2026-11-24T03:00:00+00:00";
const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const PERSON = "33333333-3333-4333-8333-333333333333";
const PAPER = {
  versionNo: 2,
  signedAt: AT,
  ownerName: "Nguyễn Chủ Kho",
  ownerEmail: "chu@example.test",
  recipients: [
    {
      beneficiaryId: PERSON,
      fullName: "Lê Người Nhận",
      hasMessage: false,
      assets: [{ id: "a1", name: "Sổ tiết kiệm", kind: "FILE" as const, sharedWithCount: 1 }],
    },
  ],
  unassignedAssetCount: 1,
  identity: {
    owner: {
      fullName: "Nguyễn Chủ Kho",
      dateOfBirth: "1975-03-12",
      citizenId: "000000000001",
      residenceAddress: "12 Đường Thử",
    },
    recipients: [
      {
        beneficiaryId: PERSON,
        fullName: "Lê Người Nhận",
        dateOfBirth: "1990-05-20",
        citizenId: "000000000002",
      },
    ],
  },
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup(extra: Record<string, unknown>) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "thuc.thi@example.test",
        fullName: "Trần Thực Thi",
        role: "EXECUTOR",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: true,
        createdAt: AT,
      },
    }),
  );
  const onOpen = vi.fn();
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <ExecutorWillButton
          onOpen={onOpen}
          vault={{
            vaultId: VAULT_ID,
            ownerFullName: "Nguyễn Chủ Kho",
            planStatus: "ACTIVE",
            handoverRecordStatus: "",
            acceptedAt: AT,
            ...extra,
          }}
        />
      </QueryClientProvider>
    </Provider>,
  );
  return onOpen;
}

async function openPaper(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole("button", { name: "Xem biên bản với Chủ tài sản" }));
  return screen.findByRole("article", { name: "Tờ Biên bản phân chia" });
}

it("tờ giống bên Chủ tài sản: danh tính, tài sản, người nhận và hai chữ ký", async () => {
  const get = vi.spyOn(executorWillService, "get").mockResolvedValue(PAPER);
  const onOpen = setup({
    willVersionNo: 2,
    willSignedAt: AT,
    confirmedWillVersionNo: 2,
    willConfirmedAt: AT,
  });
  expect(get).not.toHaveBeenCalled();

  const paper = await openPaper();
  await screen.findAllByText("Sổ tiết kiệm");

  expect(get).toHaveBeenCalledWith({ kind: "vault", id: VAULT_ID }, expect.anything());
  expect(paper).toHaveTextContent("000000000001");
  expect(paper).toHaveTextContent("12 Đường Thử");
  expect(paper).toHaveTextContent("Sinh 20/05/1990 · CCCD 000000000002");
  expect(paper).toHaveTextContent("Còn 1 tài sản chưa chọn người nhận");
  expect(paper).toHaveTextContent("Trần Thực Thi");
  expect(paper).not.toHaveTextContent("Phiên bản");
  expect(paper.textContent?.match(/Đã ký điện tử/g)).toHaveLength(2);
  expect(onOpen).toHaveBeenCalledTimes(1);
});

it("chưa đồng ý phiên bản mới thì chưa in chữ ký Người thực thi", async () => {
  vi.spyOn(executorWillService, "get").mockResolvedValue(PAPER);
  setup({ willVersionNo: 2, willSignedAt: AT, confirmedWillVersionNo: 1, willConfirmedAt: AT });

  const paper = await openPaper();
  await screen.findAllByText("Sổ tiết kiệm");

  expect(paper.textContent?.match(/Đã ký điện tử/g)).toHaveLength(1);
});

it("tải lỗi thì chưa tính là đã đọc, khóa nút in và cho thử lại", async () => {
  vi.spyOn(executorWillService, "get").mockRejectedValue(new Error("down"));
  const onOpen = setup({ willVersionNo: 2, willSignedAt: AT });

  await openPaper();

  expect(await screen.findAllByText("Không tải được biên bản phân chia.")).not.toHaveLength(0);
  expect(screen.getByRole("button", { name: "In / Lưu PDF" })).toBeDisabled();
  expect(onOpen).not.toHaveBeenCalled();
});

it("Chủ tài sản chưa ký thì chỉ báo, không gọi Backend", async () => {
  const get = vi.spyOn(executorWillService, "get");
  setup({ willVersionNo: null, willSignedAt: null });

  expect(await openPaper()).toHaveTextContent("Chủ tài sản chưa ký biên bản phân chia.");
  expect(get).not.toHaveBeenCalled();
});
