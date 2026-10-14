import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OtpVerificationModal } from "../OtpVerificationModal";
import { OTP_PREVIEW_CONTENT as content } from "../../model/otpPreview.constants";

afterEach(cleanup);

describe("OTP preview", () => {
  it.each(["cancel", "escape"])(
    "clears the code and feedback on %s without authenticating",
    async (method) => {
      const onClose = vi.fn();
      const onVerifySuccess = vi.fn();
      const props = { onClose, onVerifySuccess };
      const view = render(<OtpVerificationModal isOpen {...props} />);
      const input = await screen.findByLabelText(content.label);
      fireEvent.change(input, { target: { value: "123" } });
      fireEvent.click(screen.getByRole("button", { name: content.submit }));
      expect(await screen.findByRole("alert")).toHaveTextContent(content.invalid);

      fireEvent.change(input, { target: { value: "123456" } });
      fireEvent.click(screen.getByRole("button", { name: content.submit }));
      expect(await screen.findByRole("status")).toHaveTextContent(content.valid);
      expect(onVerifySuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: content.resend })).toBeDisabled();

      if (method === "cancel") {
        fireEvent.click(screen.getByRole("button", { name: content.cancel }));
      } else {
        fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
      }
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      view.rerender(<OtpVerificationModal isOpen={false} {...props} />);
      view.rerender(<OtpVerificationModal isOpen {...props} />);
      expect(await screen.findByLabelText(content.label)).toHaveValue("");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(onVerifySuccess).not.toHaveBeenCalled();
    },
  );
});
