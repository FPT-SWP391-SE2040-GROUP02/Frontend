import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { ownerVaultService } from "../../api/ownerVaultService";
import { WillClausesSection } from "../WillClausesEditor";

vi.mock("../../api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn(), updateMine: vi.fn() },
}));

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WillClausesSection />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  accessTokenMemory.set("test-token");
  vi.mocked(ownerVaultService.getMine).mockResolvedValue({
    ...vaultFixture,
    willClauses: ["Không bán nhà"],
  } as never);
});

afterEach(() => {
  accessTokenMemory.clear();
  cleanup();
  vi.clearAllMocks();
});

describe("WillClausesSection", () => {
  it("hiện điều khoản đã lưu, thêm điều mới rồi lưu cả danh sách kèm etag", async () => {
    vi.mocked(ownerVaultService.updateMine).mockResolvedValue({
      ...vaultFixture,
      etag: "vault-v2",
      willClauses: ["Không bán nhà", "Chia đều cho hai con"],
    } as never);
    renderSection();

    const first = await screen.findByLabelText("Điều khoản 1");
    expect(first).toHaveValue("Không bán nhà");
    const save = screen.getByRole("button", { name: "Lưu điều khoản" });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Thêm điều khoản" }));
    fireEvent.change(screen.getByLabelText("Điều khoản 2"), {
      target: { value: "  Chia đều cho hai con  " },
    });
    fireEvent.click(save);

    await waitFor(() => {
      expect(ownerVaultService.updateMine).toHaveBeenCalledWith(vaultFixture.id, {
        etag: "vault-v1",
        willClauses: ["Không bán nhà", "Chia đều cho hai con"],
      });
    });
    expect(await screen.findByText("Đã lưu điều khoản.")).toBeInTheDocument();
  });

  it("xóa điều khoản và bỏ qua điều để trống khi lưu", async () => {
    vi.mocked(ownerVaultService.updateMine).mockResolvedValue({
      ...vaultFixture,
      etag: "vault-v2",
      willClauses: [],
    } as never);
    renderSection();

    await screen.findByLabelText("Điều khoản 1");
    fireEvent.click(screen.getByRole("button", { name: "Xóa điều khoản 1" }));
    expect(screen.getByText("Chưa có điều khoản nào.")).toBeInTheDocument();

    // Thêm một ô rồi để trống: không tính là thay đổi so với danh sách rỗng đã xóa, nhưng khác bản đã lưu.
    fireEvent.click(screen.getByRole("button", { name: "Thêm điều khoản" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu điều khoản" }));

    await waitFor(() => {
      expect(ownerVaultService.updateMine).toHaveBeenCalledWith(vaultFixture.id, {
        etag: "vault-v1",
        willClauses: [],
      });
    });
  });

  it("hoàn tác trả về danh sách đã lưu và không hiện khi kế hoạch đã kích hoạt", async () => {
    renderSection();
    const first = await screen.findByLabelText("Điều khoản 1");
    fireEvent.change(first, { target: { value: "Đã sửa" } });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(screen.getByLabelText("Điều khoản 1")).toHaveValue("Không bán nhà");
    cleanup();

    vi.mocked(ownerVaultService.getMine).mockResolvedValue({
      ...vaultFixture,
      planStatus: "ACTIVE",
      willClauses: ["Không bán nhà"],
    } as never);
    renderSection();
    await waitFor(() => {
      expect(ownerVaultService.getMine).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByRole("heading", { name: "Điều khoản của bạn" })).not.toBeInTheDocument();
  });
});
