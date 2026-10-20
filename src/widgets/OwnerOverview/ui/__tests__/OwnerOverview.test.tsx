import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/entities/user/model/authSlice";
import { OwnerOverview } from "../OwnerOverview";
vi.mock("../OwnerDashboard", () => ({
  OwnerDashboard: () => <section aria-label="Server vault">Dữ liệu server</section>,
}));
let client: QueryClient;
afterEach(() => {
  cleanup();
  client.clear();
});
function setup(path: string) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <OwnerOverview />
        </MemoryRouter>
      </QueryClientProvider>
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
    expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent("Kho của bạn");
  });
  it("never restores fixture data on a retired preview URL", () => {
    setup("/preview/owner");
    expect(screen.getByRole("region", { name: "Server vault" })).toBeInTheDocument();
    expect(screen.queryByText("Mọi thứ đang ở đúng nơi.")).not.toBeInTheDocument();
  });
});
