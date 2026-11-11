import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { documentFixture } from "../../testing/documentFixture";
import { HandoverDocumentDetail, HandoverDocumentList } from "../HandoverDocumentList";

describe("HandoverDocumentList", () => {
  it("biên bản xong ghi Hoàn tất, biên bản đang làm ghi Chưa xong và có viền đứt xám nhạt", () => {
    render(
      <HandoverDocumentList
        viewer="recipient"
        emptyText="Trống"
        documents={[
          documentFixture(),
          documentFixture({
            id: "0199e7a4-4444-7c3e-9a51-3f0f5d2b8a10",
            status: "WAIT_VERIFIER",
            completedAt: null,
          }),
        ]}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]!).getByText("Hoàn tất")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Chưa xong")).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/Chờ Người xét duyệt/)).toBeInTheDocument();
    expect(rows[1]!.className).toContain("border-dashed");
    expect(rows[0]!.className).not.toContain("border-dashed");
  });

  it("mở một dòng thì hiện dòng thời gian ký và nút xem toàn văn", async () => {
    const user = userEvent.setup();
    render(
      <HandoverDocumentList viewer="recipient" emptyText="Trống" documents={[documentFixture()]} />,
    );

    await user.click(screen.getByRole("button", { name: /Biên bản đồng ý nhận/ }));

    expect(
      screen.getByText(/Thông tin về Chủ kho lấy từ hồ sơ chứng tử đã duyệt/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Người thực thi .* điền thông tin/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Người xét duyệt Luật sư Dũng kiểm tra thủ công và gửi/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xem toàn văn biên bản" }));
    const text = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(text).toHaveTextContent("Chủ kho Nguyễn Văn A");
    expect(text).toHaveTextContent("UBND phường Bến Thành, Thành phố Hồ Chí Minh");
    expect(text).not.toHaveTextContent("0456/2026");
    expect(text).toHaveTextContent("Gói gia đình (gồm 3 mục)");
    expect(text).toHaveTextContent("Đã ký điện tử");
    expect(text).not.toHaveTextContent("Người thực thi xác nhận");
  });

  it("bản thu gọn cho Người xét duyệt chỉ có một dòng tóm tắt và nút xem toàn văn", () => {
    render(
      <HandoverDocumentDetail
        compact
        document={documentFixture({
          status: "WAIT_VERIFIER",
          completedAt: null,
          verifier: { ...documentFixture().verifier, signedAt: null },
        })}
      />,
    );

    expect(screen.getByText(/^Người nhận chọn Chấp nhận · Ký lúc /)).toBeInTheDocument();
    expect(screen.queryByText(/Thông tin về Chủ kho lấy từ hồ sơ/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chờ Người xét duyệt/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem toàn văn biên bản" })).toBeInTheDocument();
  });

  it("văn bản từ chối có câu gửi cho Người thực thi và năm sinh cùng 4 số cuối căn cước", async () => {
    const user = userEvent.setup();
    render(
      <HandoverDocumentList
        viewer="executor"
        emptyText="Trống"
        documents={[documentFixture({ kind: "DECLINE" })]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Văn bản từ chối nhận/ }));
    await user.click(screen.getByRole("button", { name: "Xem toàn văn biên bản" }));

    const text = screen.getByRole("article", { name: "Văn bản từ chối nhận di sản thừa kế" });
    expect(text).toHaveTextContent("gửi đến Người thực thi của kho");
    expect(text).toHaveTextContent("Sinh năm: 1990");
    expect(text).toHaveTextContent("Số Căn cước/CCCD: 079190001234 do Bộ Công an cấp");
  });

  it("hồ sơ chứng tử thiếu số giấy và ngày thì in dòng chấm, phần người nhận chưa khai hiện chú thích, chưa ký ghi rõ", async () => {
    const user = userEvent.setup();
    render(
      <HandoverDocumentList
        viewer="recipient"
        emptyText="Trống"
        documents={[
          documentFixture({
            status: "WAIT_RECIPIENT",
            owner: {
              fullName: "Nguyễn Văn A",
              dateOfDeath: null,
              certificateNumber: "",
              certificateIssuedOn: null,
              deathRegistrationPlace: "",
              residenceAddress: "",
            },
            recipient: {
              fullName: "",
              birthYear: null,
              citizenId: "",
              citizenIdLast4: "",
              residenceAddress: "",
              signedAt: null,
            },
            completedAt: null,
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Biên bản đồng ý nhận/ }));
    await user.click(screen.getByRole("button", { name: "Xem toàn văn biên bản" }));

    const text = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(text).toHaveTextContent("do UBND ………………… đăng ký khai tử ngày");
    expect(text).toHaveTextContent("…/…/……");
    expect(text).toHaveTextContent("bạn điền sau");
    expect(text).toHaveTextContent("(chưa ký)");
  });

  it("không có biên bản thì nói rõ khi nào sẽ có", () => {
    render(
      <HandoverDocumentList viewer="recipient" emptyText="Chưa có biên bản nào." documents={[]} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Chưa có biên bản nào.");
  });
});
