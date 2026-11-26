import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetsManagementPage } from "../AssetsManagementPage";

vi.mock("@/features/vault-management/model/useVaultPageTitle", () => ({
  useVaultPageTitle: () => ({ title: "Tài sản của tôi", eyebrow: undefined }),
}));
vi.mock("@/widgets/OwnerWorkspace/OwnerSection", () => ({
  OwnerSection: () => <div>nội dung</div>,
}));
vi.mock("@/widgets/OwnerWorkspace/OwnerWorkspace", () => ({
  OwnerWorkspace: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

describe("AssetsManagementPage: phạm vi dịch vụ", () => {
  it("có dải lưu ý trước hai tab: chỉ nhận tài sản số, không xử lý giấy tờ nhà đất, xe", () => {
    render(
      <MemoryRouter>
        <AssetsManagementPage />
      </MemoryRouter>,
    );

    const notice = screen.getByText(/Chỉ nhận tài sản số/);
    expect(notice).toHaveTextContent("Không xử lý giấy tờ nhà đất, xe");
    const tabs = screen.getByRole("tablist");
    expect(notice.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
