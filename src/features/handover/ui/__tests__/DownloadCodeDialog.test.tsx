import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { handoverService } from "../../api/handoverService";
import { DownloadCodeDialog } from "../DownloadCodeDialog";

const GRANT = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  vi.restoreAllMocks();
  accessTokenMemory.clear();
});

describe("DownloadCodeDialog", () => {
  it("chỉ cho tải khi nhập đủ 6 số và bỏ ký tự không phải số", () => {
    const onSubmit = vi.fn();
    render(<DownloadCodeDialog grantId={GRANT} onSubmit={onSubmit} onClose={() => undefined} />);
    const input = screen.getByLabelText("Mã 6 số");
    const submit = screen.getByRole("button", { name: "Tải" });
    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: "12ab34" } });
    expect(input).toHaveValue("1234");
    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: "123456" } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("gửi mã qua email theo yêu cầu và báo đã gửi", async () => {
    accessTokenMemory.set("test-token");
    const request = vi.spyOn(handoverService, "requestDownloadCode").mockResolvedValue();
    render(<DownloadCodeDialog grantId={GRANT} onSubmit={vi.fn()} onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Gửi mã qua email" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith(GRANT));
    expect(await screen.findByText("Đã gửi mã. Kiểm tra hộp thư của bạn.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi lại mã" })).toBeInTheDocument();
  });
});
