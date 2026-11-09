import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { HandoverTerms } from "../HandoverTerms";
import { MailCheckPanel } from "../MailCheckPanel";

function httpError(status: number) {
  const headers = new AxiosHeaders();
  return new AxiosError("fail", "ERR", { headers }, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data: {},
  });
}

async function fill(user: ReturnType<typeof userEvent.setup>, code: string, last4: string) {
  await user.type(screen.getByLabelText("Mã hồ sơ"), code);
  await user.type(screen.getByLabelText("4 số cuối căn cước"), last4);
}

afterEach(() => vi.restoreAllMocks());

describe("MailCheckPanel", () => {
  it("nút Kiểm tra chỉ mở khi có mã hồ sơ và đủ 4 chữ số", async () => {
    const user = userEvent.setup();
    render(<MailCheckPanel token="tok" />);
    const button = screen.getByRole("button", { name: "Kiểm tra" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText("Mã hồ sơ"), "01A16CF1");
    await user.type(screen.getByLabelText("4 số cuối căn cước"), "12a3");
    expect(screen.getByLabelText("4 số cuối căn cước")).toHaveValue("123");
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText("4 số cuối căn cước"), "4");
    expect(button).toBeEnabled();
  });

  it("thư đúng: gửi đúng body lên API và hiện tên gói, tên Chủ kho", async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      verified: true,
      attemptsLeft: 5,
      containerName: "Gói gia đình",
      ownerFullName: "Nguyễn Văn Chủ",
    });
    render(<MailCheckPanel token="tok-1" />);

    await fill(user, "01A16CF1", "1234");
    await user.click(screen.getByRole("button", { name: "Kiểm tra" }));

    expect(post).toHaveBeenCalledWith("/handover/invitations/tok-1/check-mail", {
      caseCode: "01A16CF1",
      citizenIdLast4: "1234",
    });
    expect(await screen.findByText(/Thư là thật/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Gói “Gói gia đình”");
    expect(screen.getByRole("status")).toHaveTextContent("Chủ kho Nguyễn Văn Chủ");
  });

  it("thư sai: báo không khớp và số lần thử còn lại, không hiện thông tin gói", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockResolvedValue({ verified: false, attemptsLeft: 4 });
    render(<MailCheckPanel token="tok" />);

    await fill(user, "SAI", "0000");
    await user.click(screen.getByRole("button", { name: "Kiểm tra" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Không khớp. Còn 4 lần thử.");
    expect(screen.queryByText(/Thư là thật/)).not.toBeInTheDocument();
  });

  it("hết lượt thử (423) thì bảo gọi điện cho công ty, không hiện kết quả đúng", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValue(httpError(423));
    render(<MailCheckPanel token="tok" />);

    await fill(user, "01A16CF1", "1234");
    await user.click(screen.getByRole("button", { name: "Kiểm tra" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/quá số lần cho phép/);
  });

  it("lỗi khác (404, mất mạng) thì báo không kiểm tra được, không kết luận thư thật hay giả", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValue(httpError(404));
    render(<MailCheckPanel token="tok" />);

    await fill(user, "01A16CF1", "1234");
    await user.click(screen.getByRole("button", { name: "Kiểm tra" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không kiểm tra được lúc này/);
    expect(screen.queryByText(/Thư là thật/)).not.toBeInTheDocument();
  });
});

describe("HandoverTerms", () => {
  it("nói rõ hậu quả của từng lựa chọn, kèm căn cứ pháp luật", () => {
    render(<HandoverTerms groupName="Gói gia đình" />);

    expect(screen.getByRole("heading", { name: "Chấp nhận" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Từ chối" })).toBeInTheDocument();
    expect(screen.getByText(/coi như biến mất, không giao cho ai/)).toBeInTheDocument();
    expect(screen.getByText(/Điều 614, 615 và 621/)).toBeInTheDocument();
    expect(screen.getByText(/Điều 620/)).toBeInTheDocument();
    expect(screen.getAllByText(/Gói gia đình/).length).toBeGreaterThanOrEqual(2);
  });
});
