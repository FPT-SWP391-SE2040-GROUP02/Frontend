import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { documentFixture } from "../../testing/documentFixture";
import { HandoverDocumentText } from "../HandoverDocumentText";

afterEach(cleanup);

const PLACE = "UBND phường Bến Thành, Thành phố Hồ Chí Minh";

/** Chuẩn hóa khoảng trắng để so câu, vì chữ trong biên bản bị ngắt dòng theo JSX. */
function text(node: HTMLElement): string {
  return (node.textContent ?? "").replace(/\s+/g, " ");
}

describe("câu về người mất trong biên bản", () => {
  it("biên bản đồng ý in nơi đăng ký khai tử và không còn phần số giấy", () => {
    render(<HandoverDocumentText document={documentFixture({ kind: "ACCEPT" })} />);

    const article = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(text(article)).toContain(
      `Chủ kho Nguyễn Văn A, chết ngày 05/11/2026 theo giấy chứng tử do ${PLACE} đăng ký khai tử ngày 07/11/2026.`,
    );
    expect(text(article)).toContain(
      "Thông tin này đã được Người xét duyệt thẩm định trên hệ thống.",
    );
    // Số giấy 0456/2026 vẫn nằm trong dữ liệu nhưng không còn được in.
    expect(text(article)).not.toContain("0456/2026");
    expect(text(article)).not.toMatch(/giấy chứng tử số/);
  });

  it("văn bản từ chối in đúng câu đã chốt", () => {
    render(<HandoverDocumentText document={documentFixture({ kind: "DECLINE" })} />);

    const article = screen.getByRole("article", { name: "Văn bản từ chối nhận di sản thừa kế" });
    expect(text(article)).toContain(
      `Ông/bà Nguyễn Văn A chết ngày 05/11/2026 theo giấy chứng tử do ${PLACE} đăng ký khai tử ngày 07/11/2026.`,
    );
    expect(text(article)).not.toContain("0456/2026");
    expect(text(article)).not.toMatch(/giấy chứng tử số/);
  });

  it("hồ sơ chưa có nơi đăng ký hoặc ngày thì in dòng chấm", () => {
    const base = documentFixture({ kind: "DECLINE" });
    render(
      <HandoverDocumentText
        document={{
          ...base,
          owner: {
            ...base.owner,
            dateOfDeath: null,
            certificateIssuedOn: null,
            deathRegistrationPlace: "",
          },
        }}
      />,
    );

    const article = screen.getByRole("article", { name: "Văn bản từ chối nhận di sản thừa kế" });
    expect(text(article)).toContain(
      "chết ngày …/…/…… theo giấy chứng tử do UBND ………………… đăng ký khai tử ngày …/…/……",
    );
  });
});

describe("câu báo khi người nhận từ chối", () => {
  const NOTICE =
    "Nếu một người nhận từ chối nhận, phần tài sản của gói bàn giao đó sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục.";

  it("biên bản đồng ý in câu báo của Admin ở mục 8", () => {
    render(
      <HandoverDocumentText
        document={documentFixture({ kind: "ACCEPT", declineNotice: NOTICE })}
      />,
    );

    const article = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(text(article)).toContain(`8. Tôi đã được thông báo: ${NOTICE}`);
  });

  it("Backend cũ chưa có câu báo thì không in mục 8, văn bản từ chối không có mục này", () => {
    render(<HandoverDocumentText document={documentFixture({ kind: "ACCEPT" })} />);
    expect(text(screen.getByRole("article"))).not.toContain("8. Tôi đã được thông báo");
    cleanup();

    render(
      <HandoverDocumentText
        document={documentFixture({ kind: "DECLINE", declineNotice: NOTICE })}
      />,
    );
    expect(text(screen.getByRole("article"))).not.toContain("8. Tôi đã được thông báo");
  });
});

describe("biên bản dựng theo mẫu từ Backend", () => {
  const paragraphs = [
    { text: "TIÊU ĐỀ MẪU", align: "center" as const, bold: true },
    {
      text: "Tôi là {HO_TEN_NGUOI_NHAN}, ngày {NGAY} tháng {THANG} năm {NAM}; sinh năm {NAM_SINH}.",
      align: "justify" as const,
      bold: false,
    },
    { text: "Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}", align: "left" as const, bold: false },
    {
      text: "Di sản: {DI_SAN}. Trường lạ giữ nguyên: {KHONG_CO}.",
      align: "justify" as const,
      bold: false,
    },
    { text: "Lưu ý: {CAU_BAO_TU_CHOI}", align: "justify" as const, bold: false },
  ];
  const withTemplate = (over: Parameters<typeof documentFixture>[0] = {}) =>
    documentFixture({
      kind: "ACCEPT",
      declineNotice: "Câu báo của Admin.",
      templateParagraphs: paragraphs,
      ...over,
    });

  it("điền các trường từ dữ liệu biên bản và giữ nguyên trường lạ", () => {
    render(<HandoverDocumentText document={withTemplate()} />);

    const article = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(text(article)).toContain("TIÊU ĐỀ MẪU");
    expect(text(article)).toContain(
      "Chủ kho Nguyễn Văn A chết ngày 05/11/2026 theo giấy chứng tử do",
    );
    expect(text(article)).toContain(`${PLACE} đăng ký khai tử ngày 07/11/2026.`);
    expect(text(article)).toContain("Di sản:");
    expect(text(article)).toContain("{KHONG_CO}");
    expect(text(article)).toContain("Lưu ý: Câu báo của Admin.");
  });

  it("đoạn đậm và căn giữa có kiểu tương ứng", () => {
    render(<HandoverDocumentText document={withTemplate()} />);

    const title = screen.getByText("TIÊU ĐỀ MẪU").closest("p");
    expect(title).toHaveClass("text-center");
    expect(title).toHaveClass("font-bold");
  });

  it("phần người nhận chưa khai hiện chú thích khi blank, dòng chấm khi không", () => {
    const empty = {
      fullName: "",
      birthYear: null,
      citizenId: "",
      citizenIdLast4: "",
      residenceAddress: "",
      signedAt: null,
    };
    render(<HandoverDocumentText blank document={withTemplate({ recipient: empty })} />);
    expect(text(screen.getByRole("article"))).toContain("Tôi là (bạn điền sau)");
    cleanup();

    render(<HandoverDocumentText document={withTemplate({ recipient: empty })} />);
    expect(text(screen.getByRole("article"))).toContain("Tôi là ..............................");
  });

  it("không có mẫu từ Backend thì vẫn dùng chữ cố định cũ", () => {
    render(<HandoverDocumentText document={documentFixture({ kind: "ACCEPT" })} />);

    expect(text(screen.getByRole("article"))).toContain("1. Người để lại di sản: Chủ kho");
  });
});
