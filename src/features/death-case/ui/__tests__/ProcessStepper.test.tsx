import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { ExecutorVault } from "../../model/deathCase.schema";
import { ProcessStepper } from "../ProcessStepper";

const baseVault: ExecutorVault = {
  vaultId: "11111111-1111-4111-8111-111111111111",
  ownerFullName: "Anh Nam",
  planStatus: "AWAITING_CHECK",
  checkInOverdue: true,
  openDeathCaseId: null,
};

function setup(vault: ExecutorVault = baseVault) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/executor"]}>
        <Routes>
          <Route path="/executor" element={<ProcessStepper vault={vault} record={null} />} />
          <Route path="/executor/report" element={<p>Trang Báo tin</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("ProcessStepper", () => {
  it("tô đúng bước hiện tại và có đủ 8 nút bước", () => {
    setup();
    expect(screen.getAllByRole("button", { name: /^Bước \d: .*xem chi tiết$/ })).toHaveLength(8);
    const items = screen.getAllByRole("listitem");
    expect(items[3]).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Điểm danh thay hoặc nộp giấy chứng tử")).toBeInTheDocument();
  });

  it("bấm một bước mở cửa sổ với người làm và nút đi tới màn của bước", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /^Bước 5: .*xem chi tiết$/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Bước 5: Nộp giấy chứng tử")).toBeInTheDocument();
    expect(within(dialog).getByText("Chưa tới")).toBeInTheDocument();
    expect(within(dialog).getByText("Người làm: Bạn")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("link", { name: "Mở Báo tin" }));
    expect(await screen.findByText("Trang Báo tin")).toBeInTheDocument();
  });

  it("bài hướng dẫn mở ngay trong cửa sổ và quay lại được", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /^Bước 4: .*xem chi tiết$/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Đang ở bước này")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("link", { name: /Nộp giấy chứng tử/ }));
    expect(await within(dialog).findByText("Xin giấy")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "‹ Quay lại" }));
    expect(
      await within(dialog).findByText(/Liên lạc với Chủ kho hoặc người nhà/),
    ).toBeInTheDocument();
  });

  it("bài Điểm danh thay có nút điểm danh khi Chủ kho quá hạn", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /^Bước 4: .*xem chi tiết$/ }));
    await userEvent.click(await screen.findByRole("link", { name: "Điểm danh thay" }));
    expect(
      await screen.findByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).toBeInTheDocument();
  });

  it("đã có hồ sơ chứng tử thì bài Điểm danh thay không có nút điểm danh", async () => {
    setup({ ...baseVault, planStatus: "DEATH_CASE_OPEN", openDeathCaseId: "x" });
    await userEvent.click(screen.getByRole("button", { name: /^Bước 4: .*xem chi tiết$/ }));
    await userEvent.click(await screen.findByRole("link", { name: "Điểm danh thay" }));
    expect(await screen.findByText("Chỉ điểm danh thay khi Chủ kho vẫn ổn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
  });

  it("kho đóng băng không tô bước nào và không hiện thẻ việc cần làm", () => {
    setup({ ...baseVault, planStatus: "BLOCKED", checkInOverdue: false });
    expect(screen.queryByText(/Việc cần làm/)).not.toBeInTheDocument();
    screen.getAllByRole("listitem").forEach((item) => {
      expect(item).not.toHaveAttribute("aria-current");
    });
  });
});
