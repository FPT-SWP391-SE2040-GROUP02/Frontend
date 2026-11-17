import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { EkycReviewForm } from "../EkycReviewForm";
import { ekycReviewSchema, ocrDateForInput } from "../../model/ekyc.schema";

const verificationId = "11111111-1111-4111-8111-111111111111";
const document = {
  verificationId,
  idNumber: "012345678901",
  fullName: "Tên OCR",
  dateOfBirth: "01/02/2000",
  residenceAddress: "Địa chỉ OCR",
  canMatchFace: true,
  expiresAt: null,
  warnings: [],
};
const status = {
  status: "PENDING",
  verificationId,
  citizenIdLast4: "8901",
  faceMatchScore: null,
  matchThreshold: 0.363,
  spoofCheckPassed: null,
  createdAt: null,
  completedAt: null,
  backSideChecked: false,
};
beforeEach(() => accessTokenMemory.set("test-only-ocr"));
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});
function setup() {
  function Harness() {
    const [confirmed, setConfirmed] = useState(false);
    return (
      <EkycReviewForm
        document={document}
        confirmed={confirmed}
        disabled={false}
        backSent
        onConfirmed={() => setConfirmed(true)}
        onEdit={() => setConfirmed(false)}
      />
    );
  }
  render(<Harness />);
}
it("Owner sửa được họ tên, ngày sinh; số căn cước luôn khóa; gửi bản đã sửa khi xác nhận", async () => {
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(status);
  setup();
  expect(screen.getByLabelText("Ngày sinh")).toHaveValue("01/02/2000");
  expect(screen.getByLabelText("Số căn cước")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("Số căn cước")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("Họ và tên")).not.toHaveAttribute("readonly");
  expect(screen.getByLabelText("Ngày sinh")).not.toHaveAttribute("readonly");
  fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "  Tên đã sửa  " } });
  fireEvent.change(screen.getByLabelText("Ngày sinh"), { target: { value: "03/04/2001" } });
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  await screen.findByRole("status");
  expect(post).toHaveBeenCalledExactlyOnceWith("/ekyc/document/confirm", {
    verificationId,
    purpose: "OWNER_ENROLLMENT",
    idNumber: document.idNumber,
    fullName: "Tên đã sửa",
    dateOfBirth: "2001-04-03",
    residenceAddress: document.residenceAddress,
  });
  expect(screen.getByLabelText("Họ và tên")).toHaveAttribute("readonly");
  fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa lại" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Họ và tên")).not.toHaveAttribute("readonly");
  fireEvent.click(screen.getByRole("button", { name: "Khôi phục thông tin máy đọc" }));
  expect(screen.getByLabelText("Họ và tên")).toHaveValue(document.fullName);
});
it("keeps edits on failure and resubmits the edited address on retry", async () => {
  const post = vi
    .spyOn(apiClient, "post")
    .mockRejectedValueOnce(new Error("test failure"))
    .mockResolvedValue(status);
  setup();
  fireEvent.change(screen.getByLabelText("Nơi cư trú / địa chỉ thường trú"), {
    target: { value: "Địa chỉ đã sửa" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Nơi cư trú / địa chỉ thường trú")).toHaveValue("Địa chỉ đã sửa");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  await screen.findByRole("status");
  expect(post).toHaveBeenLastCalledWith(
    "/ekyc/document/confirm",
    expect.objectContaining({ purpose: "OWNER_ENROLLMENT", residenceAddress: "Địa chỉ đã sửa" }),
  );
});
it("rejects invalid input without posting and guards duplicate submits while pending", async () => {
  let resolve!: (value: unknown) => void;
  const post = vi.spyOn(apiClient, "post").mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  setup();
  fireEvent.change(screen.getByLabelText("Số căn cước"), { target: { value: "abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("CCCD cần đủ 12 chữ số.");
  expect(post).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Số căn cước"), { target: { value: document.idNumber } });
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  const pending = screen.getByRole("button", { name: "Đang xác nhận…" });
  expect(pending).toBeDisabled();
  fireEvent.click(pending);
  expect(post).toHaveBeenCalledTimes(1);
  resolve(status);
  await screen.findByRole("status");
});
it("validates real ISO dates, limits, and safely maps only known OCR date formats", () => {
  const values = { ...document, dateOfBirth: "2000-02-01" };
  expect(ekycReviewSchema.safeParse(values).success).toBe(true);
  for (const bad of [
    { dateOfBirth: "2000-02-30" },
    { dateOfBirth: "2999-01-01" },
    { fullName: " " },
    { fullName: "x".repeat(201) },
    { residenceAddress: "x".repeat(1001) },
    { idNumber: "１２３４５６７８９０１２" },
  ])
    expect(ekycReviewSchema.safeParse({ ...values, ...bad }).success).toBe(false);
  expect(ocrDateForInput("29/02/2000")).toBe("29/02/2000");
  expect(ocrDateForInput("29/02/2001")).toBe("");
  expect(ocrDateForInput("unknown")).toBe("");
});

it("số căn cước ẩn mặc định, có nút Hiện/Ẩn ngay trong ô để người dùng đối chiếu với thẻ", () => {
  setup();
  const field = screen.getByLabelText("Số căn cước");
  expect(field).toHaveAttribute("type", "password");
  const toggle = screen.getByRole("button", { name: "Hiện số căn cước" });
  expect(toggle).toHaveTextContent("Hiện");
  fireEvent.click(toggle);
  expect(field).toHaveAttribute("type", "text");
  expect(field).toHaveValue(document.idNumber);
  const hide = screen.getByRole("button", { name: "Ẩn số căn cước" });
  expect(hide).toHaveTextContent("Ẩn");
  fireEvent.click(hide);
  expect(field).toHaveAttribute("type", "password");
});

it("không còn ô Có giá trị đến / Date of expiry vì máy đọc không đọc được dòng này", () => {
  render(
    <EkycReviewForm
      document={document}
      confirmed={false}
      disabled={false}
      backSent
      onConfirmed={() => {}}
      onEdit={() => {}}
    />,
  );
  expect(screen.queryByLabelText(/Có giá trị đến/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Date of expiry/i)).not.toBeInTheDocument();
});
