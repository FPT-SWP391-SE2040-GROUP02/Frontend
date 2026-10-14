import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/entities/user/model/authSlice";
import { OwnerOverview } from "../OwnerOverview";
vi.mock("../OwnerVaultPanel", () => ({
  OwnerVaultPanel: () => <section aria-label="Server vault">Dữ liệu server</section>,
}));
afterEach(cleanup);
function setup(path: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <OwnerOverview />
      </MemoryRouter>
    </Provider>,
  );
}
describe("OwnerOverview data boundaries", () => {
  it("shows the server panel without fixture names, counters or healthy state on live dashboard", () => {
    setup("/dashboard");
    expect(screen.getByRole("region", { name: "Server vault" })).toBeInTheDocument();
    expect(screen.queryByText("Anh Nam")).not.toBeInTheDocument();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    expect(screen.queryByText("Mọi thứ đang ở đúng nơi.")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Kho của bạn");
  });
  it("keeps fixture UI on the declared development preview only", () => {
    setup("/preview/owner");
    expect(screen.queryByRole("region", { name: "Server vault" })).not.toBeInTheDocument();
    expect(screen.getByText("Mọi thứ đang ở đúng nơi.")).toBeInTheDocument();
  });
});
