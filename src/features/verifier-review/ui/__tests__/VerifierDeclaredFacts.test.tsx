import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { verifierReviewVersionSchema } from "../../model/verifierReview.schema";
import { VerifierDeclaredFacts, VerifierWarnings } from "../VerifierDeclaredFacts";

afterEach(cleanup);

const review: z.infer<typeof verifierReviewVersionSchema> = {
  versionNo: 1,
  ownerFullName: null,
  ownerCitizenId: null,
  ownerCitizenIdLast4: null,
  dateOfDeath: "2026-11-05",
  certificateNumber: null,
  issuedOn: "2026-11-07",
  issuedBy: null,
  deathRegistrationProvinceCode: "79",
  deathRegistrationWardCode: "26743",
  deathRegistrationPlace: "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
  submittedAt: null,
  files: [],
};

describe("khung Người thực thi khai", () => {
  it("hiện 3 dòng, mỗi dòng một ô đánh dấu, và dòng nhắc", () => {
    render(
      <VerifierDeclaredFacts
        review={review}
        checks={[false, false, false]}
        onToggle={() => undefined}
        disabled={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Người thực thi khai · đánh dấu nếu khớp với giấy" }),
    ).toBeInTheDocument();
    expect(screen.getByText("05/11/2026")).toBeInTheDocument();
    expect(screen.getByText("07/11/2026")).toBeInTheDocument();
    expect(
      screen.getByText("UBND phường Bến Thành, Thành phố Hồ Chí Minh"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(
      screen.getByText(
        "Đánh dấu đủ 3 dòng khớp với giấy mới duyệt được. Dòng nào lệch thì chọn Từ chối.",
      ),
    ).toBeInTheDocument();
  });

  it("dòng đã tick có nền xanh nhạt và chữ Khớp, dòng chưa tick thì không", () => {
    render(
      <VerifierDeclaredFacts
        review={review}
        checks={[true, false, false]}
        onToggle={() => undefined}
        disabled={false}
      />,
    );

    const first = screen.getByRole("checkbox", { name: "Ngày mất khớp với giấy" });
    expect(first).toBeChecked();
    const firstRow = first.closest("li");
    expect(firstRow).toHaveAttribute("data-matched", "true");
    expect(firstRow).toHaveClass("bg-[#E3F4EA]");
    expect(firstRow).toHaveTextContent("Khớp");
    const second = screen.getByRole("checkbox", { name: "Ngày đăng ký khai tử khớp với giấy" });
    expect(second.closest("li")).toHaveAttribute("data-matched", "false");
    expect(second.closest("li")).not.toHaveClass("bg-[#E3F4EA]");
  });

  it("bấm ô đánh dấu báo đúng chỉ số dòng; khóa thì không bấm được", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <VerifierDeclaredFacts
        review={review}
        checks={[false, false, false]}
        onToggle={onToggle}
        disabled={false}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Nơi đăng ký khai tử khớp với giấy" }));
    expect(onToggle).toHaveBeenCalledWith(2);

    rerender(
      <VerifierDeclaredFacts
        review={review}
        checks={[false, false, false]}
        onToggle={onToggle}
        disabled
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Ngày mất khớp với giấy" })).toBeDisabled();
  });
});

describe("cảnh báo khi đối chiếu", () => {
  it("hiện từng cảnh báo nền đỏ nhạt với câu Backend viết sẵn", () => {
    render(
      <VerifierWarnings
        warnings={[
          {
            code: "DEATH_BEFORE_LAST_CHECKIN",
            message: "Ngày mất trước lần điểm danh cuối (12/10/2026). Kiểm tra kỹ giấy trước khi duyệt.",
          },
        ]}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Ngày mất trước lần điểm danh cuối (12/10/2026). Kiểm tra kỹ giấy trước khi duyệt.",
    );
    expect(alert).toHaveClass("bg-[#F8E1DE]");
  });

  it("không có cảnh báo thì không vẽ gì", () => {
    const { container } = render(<VerifierWarnings warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
