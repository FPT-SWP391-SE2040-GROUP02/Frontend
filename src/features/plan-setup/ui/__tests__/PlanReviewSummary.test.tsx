import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PlanReviewSummary } from "../PlanReviewSummary";

afterEach(cleanup);

const ID_PREFIX = "aaaaaaaa-aaaa-4aaa-8aaa-";

function id(index: number): string {
  return `${ID_PREFIX}${String(index).padStart(12, "0")}`;
}

function readyContainer(index: number) {
  return {
    id: id(index),
    name: `Gói sẵn sàng ${index}`,
    status: "READY" as const,
    assetCount: 4,
    designationCount: 2,
    missingRequirements: [],
  };
}

function draftContainer(index: number, missing: string[]) {
  return {
    id: id(index),
    name: `Gói nháp ${index}`,
    status: "DRAFT" as const,
    assetCount: 0,
    designationCount: 0,
    missingRequirements: missing,
  };
}

function outsideAsset(index: number, kind: "FILE" | "TEXT") {
  return { id: id(index), name: `Tài sản lẻ ${index}`, kind };
}

function renderSummary(props: Parameters<typeof PlanReviewSummary>[0]) {
  return render(
    <MemoryRouter>
      <PlanReviewSummary {...props} />
    </MemoryRouter>,
  );
}

describe("PlanReviewSummary", () => {
  it("hiện đủ 3 nhóm: gói sẽ bàn giao, gói chưa đủ và tài sản chưa thuộc gói", () => {
    renderSummary({
      containers: [readyContainer(1), draftContainer(2, ["NO_ASSET"])],
      assetsOutsideContainer: [outsideAsset(3, "FILE"), outsideAsset(4, "TEXT")],
      showActivationNote: true,
    });

    expect(screen.getByRole("heading", { name: "Sẽ bàn giao · 1 gói" })).toBeInTheDocument();
    expect(screen.getByText("Gói sẵn sàng 1")).toBeInTheDocument();
    expect(screen.getByText(/4 tài sản/)).toBeInTheDocument();
    expect(screen.getByText(/2 người nhận/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gói chưa đủ, sẽ không bàn giao · 1 gói" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Tài sản chưa thuộc gói nào, sẽ không bàn giao · 2 tài sản",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tệp/)).toBeInTheDocument();
    expect(screen.getByText(/Ghi chú/)).toBeInTheDocument();
    expect(screen.getByText(/Bạn vẫn kích hoạt được khi còn gói chưa đủ/)).toBeInTheDocument();
  });

  it("ẩn nhóm 2 và 3 khi rỗng", () => {
    renderSummary({ containers: [readyContainer(1)], assetsOutsideContainer: [] });

    expect(screen.getByRole("heading", { name: "Sẽ bàn giao · 1 gói" })).toBeInTheDocument();
    expect(screen.queryByText(/Gói chưa đủ/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tài sản chưa thuộc gói nào/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bạn vẫn kích hoạt được/)).not.toBeInTheDocument();
  });

  it("gói nháp ghi lý do NO_DESIGNATION và có link Hoàn thiện gói", () => {
    renderSummary({
      containers: [draftContainer(5, ["NO_DESIGNATION"])],
      assetsOutsideContainer: [],
    });

    expect(screen.getByText(/chưa có người nhận/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hoàn thiện gói" })).toHaveAttribute(
      "href",
      `/dashboard/assets/groups/${id(5)}`,
    );
    expect(screen.getByText("Chưa có gói nào sẵn sàng để bàn giao.")).toBeInTheDocument();
  });

  it("tài sản lẻ có link Thêm vào gói dẫn tới màn Tài sản", () => {
    renderSummary({
      containers: [readyContainer(1)],
      assetsOutsideContainer: [outsideAsset(6, "FILE")],
    });

    expect(screen.getByRole("link", { name: "Thêm vào gói" })).toHaveAttribute(
      "href",
      "/dashboard/assets",
    );
  });

  it("quá 3 phần tử thì chỉ hiện 3 và mở rộng bằng Xem tất cả", async () => {
    const ready = [1, 2, 3, 4, 5].map((index) => readyContainer(index));
    renderSummary({ containers: ready, assetsOutsideContainer: [] });

    expect(screen.getByText("Gói sẵn sàng 3")).toBeInTheDocument();
    expect(screen.queryByText("Gói sẵn sàng 4")).not.toBeInTheDocument();
    const more = screen.getByRole("button", { name: "Xem tất cả (5)" });
    expect(more).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(more);
    expect(screen.getByText("Gói sẵn sàng 5")).toBeInTheDocument();
    const collapse = screen.getByRole("button", { name: "Thu gọn" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(collapse);
    expect(screen.queryByText("Gói sẵn sàng 4")).not.toBeInTheDocument();
  });

  it("không hiện nút Xem tất cả khi đúng 3 phần tử", () => {
    const ready = [1, 2, 3].map((index) => readyContainer(index));
    renderSummary({ containers: ready, assetsOutsideContainer: [] });

    const group = screen.getByRole("heading", { name: "Sẽ bàn giao · 3 gói" }).parentElement;
    expect(group).not.toBeNull();
    if (group !== null) {
      expect(within(group).queryByRole("button")).not.toBeInTheDocument();
    }
  });
});
