import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { ownerVaultKeys } from "../../model/useOwnerVault";
import { CreateVaultForm } from "../CreateVaultForm";
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});
it("posts only the confirmed DTO and publishes the returned vault after success", async () => {
  accessTokenMemory.set("fixture");
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(vaultFixture);
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateVaultForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Tên kho"), {
    target: { value: "Kho gia đình" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
  await vi.waitFor(() => expect(client.getQueryData(ownerVaultKeys.mine)).toEqual(vaultFixture));
  expect(post).toHaveBeenCalledWith("/vaults", { name: "Kho gia đình", description: "" });
  client.clear();
});
it("keeps failures out of the owner cache and provides email recovery", async () => {
  accessTokenMemory.set("fixture");
  vi.spyOn(apiClient, "post").mockRejectedValue({
    isAxiosError: true,
    response: { status: 403, data: { code: "EMAIL_NOT_VERIFIED" } },
  });
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CreateVaultForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("xác minh email");
  expect(client.getQueryData(ownerVaultKeys.mine)).toBeUndefined();
  client.clear();
});
