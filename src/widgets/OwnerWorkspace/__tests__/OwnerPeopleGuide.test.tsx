import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OwnerPeopleGuide } from "../OwnerPeopleGuide";

afterEach(cleanup);

describe("hướng dẫn người nhận và người thực hiện", () => {
  it("giải thích hai vai trò kèm tên gọi thụ hưởng và thực thi, và có đường quay lại", () => {
    render(
      <MemoryRouter>
        <OwnerPeopleGuide />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: "Người nhận" })).toHaveTextContent("Người thụ hưởng");
    expect(screen.getByRole("region", { name: "Người thực hiện" })).toHaveTextContent(
      "Người thực thi",
    );
    expect(screen.getByText(/không đọc được nội dung kho/i)).toBeInTheDocument();
    expect(screen.getByText(/Người xét duyệt do hệ thống phân công/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quy trình bàn giao" })).toBeInTheDocument();
    expect(screen.getByText("Tải nội dung 7 ngày")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quay lại Người liên quan" })).toHaveAttribute(
      "href",
      "/dashboard/beneficiaries",
    );
  });
});
