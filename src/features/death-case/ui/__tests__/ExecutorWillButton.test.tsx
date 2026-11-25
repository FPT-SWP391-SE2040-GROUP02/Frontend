import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { afterEach, expect, it } from "vitest";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { ExecutorWillButton } from "../ExecutorWillButton";

const AT = "2026-11-24T03:00:00+00:00";
afterEach(cleanup);

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
  render(
    <Provider store={store}>
      <ExecutorWillButton
        vault={{
          vaultId: "22222222-2222-4222-8222-222222222222",
          ownerFullName: "Nguyễn Chủ Kho",
          planStatus: "ACTIVE",
          handoverRecordStatus: "",
          acceptedAt: AT,
          ...extra,
        }}
      />
    </Provider>,
  );
}

it("mở biên bản có tên hai bên, phiên bản và hai chữ ký", async () => {
  setup({ willVersionNo: 2, willSignedAt: AT, confirmedWillVersionNo: 2, willConfirmedAt: AT });
  await userEvent.click(screen.getByRole("button", { name: "Xem biên bản với Chủ kho" }));
  const paper = await screen.findByRole("article", { name: "Tờ Biên bản phân chia" });
  expect(paper).toHaveTextContent("Nguyễn Chủ Kho");
  expect(paper).toHaveTextContent("Trần Thực Thi");
  expect(paper).toHaveTextContent("Phiên bản 2");
  expect(paper.textContent?.match(/Đã ký điện tử/g)).toHaveLength(2);
});

it("chưa đồng ý phiên bản mới thì chưa in chữ ký Người thực thi", async () => {
  setup({ willVersionNo: 2, willSignedAt: AT, confirmedWillVersionNo: 1, willConfirmedAt: AT });
  await userEvent.click(screen.getByRole("button", { name: "Xem biên bản với Chủ kho" }));
  const paper = await screen.findByRole("article", { name: "Tờ Biên bản phân chia" });
  expect(paper.textContent?.match(/Đã ký điện tử/g)).toHaveLength(1);
});

it("Chủ kho chưa ký thì ghi chờ Chủ kho ký", async () => {
  setup({ willVersionNo: null, willSignedAt: null });
  await userEvent.click(screen.getByRole("button", { name: "Xem biên bản với Chủ kho" }));
  expect(await screen.findByRole("article")).toHaveTextContent("Chờ Chủ kho ký");
});
