import { PACKAGE_FIELD_LABELS } from "@/entities/package/model/package.types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PACKAGE_FORM_CONTENT as content } from "../../model/packageForm.constants";
import { CreatePackageForm } from "../CreatePackageForm";

afterEach(cleanup);

describe("CreatePackageForm preview", () => {
  it("chỉ báo tên không hợp lệ sau khi rời ô", async () => {
    render(<CreatePackageForm />);

    const nameInput = screen.getByLabelText(PACKAGE_FIELD_LABELS.NAME);

    fireEvent.change(nameInput, {
      target: { value: "   " },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.blur(nameInput);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(nameInput, {
      target: { value: "Tài liệu gia đình" },
    });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    expect(nameInput).toHaveAttribute("aria-invalid", "false");
  });

  it("hiện feedback khi hợp lệ và bỏ feedback sau lần submit không hợp lệ", async () => {
    render(<CreatePackageForm />);

    const nameInput = screen.getByLabelText(PACKAGE_FIELD_LABELS.NAME);
    const submitButton = screen.getByRole("button", {
      name: content.submit,
    });

    fireEvent.change(nameInput, {
      target: { value: "Tài liệu gia đình" },
    });
    fireEvent.click(submitButton);

    expect(await screen.findByRole("status")).toHaveTextContent(content.validationPassed);

    fireEvent.change(nameInput, {
      target: { value: "" },
    });
    fireEvent.click(submitButton);

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
