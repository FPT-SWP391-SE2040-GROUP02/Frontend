import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerifierReportList } from "@/entities/handoverRecord";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { ReportPanel } from "../ReportPanel";

const REPORT_ID = "11111111-1111-4111-8111-111111111111";
const RECORD_ID = "33333333-3333-4333-8333-333333333333";
const AT = "2026-11-24T03:00:00+00:00";

function report(extra: Record<string, unknown> = {}) {
  return {
    id: REPORT_ID,
    deceasedFullName: "Nguyễn Văn Mất",
    status: "SUBMITTED",
    cancelReason: null,
    note: "",
    reviewReason: null,
    createdAt: AT,
    reviewedAt: null,
    recipients: [{ fullName: "Trần Con", email: "con@example.com", phone: "" }],
    files: [
      {
        id: "55555555-5555-4555-8555-555555555555",
        kind: "DEATH_CERTIFICATE",
        fileName: "chung-tu.pdf",
        contentType: "application/pdf",
        sizeBytes: 2048,
        createdAt: AT,
      },
    ],
    ...extra,
  };
}

function verifierReport(extra: Record<string, unknown> = {}) {
  return report({
    deceasedCitizenId: "001099001234",
    submitterName: "Lê Nộp",
    submitterEmail: "nop@example.com",
    submitterPhone: "",
    vaultFound: true,
    ownerName: "Nguyễn Văn Mất",
    nameMatches: true,
    acceptNote: null,
    recordId: null,
    ...extra,
  });
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("report-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(children: ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Điền phần người mất, giấy tờ và cam đoan để chỉ còn phần người nhận cần kiểm. */
async function fillReportBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Họ tên người mất"), "Nguyễn Văn Mất");
  await user.type(screen.getByLabelText("Số căn cước người mất (12 số)"), "001099001234");
  await user.click(screen.getByRole("checkbox", { name: /Tôi cam đoan/ }));
  await user.upload(
    screen.getByLabelText(/^Giấy chứng tử/),
    new File(["%PDF"], "chung-tu.pdf", { type: "application/pdf" }),
  );
  await user.upload(
    screen.getByLabelText(/^Di chúc/),
    new File(["%PDF"], "di-chuc.pdf", { type: "application/pdf" }),
  );
}

describe("Người thân nộp hồ sơ báo tin", () => {
  it("thiếu thông tin thì báo lỗi và không gửi", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    const post = vi.spyOn(apiClient, "post");
    setup(<ReportPanel />);
    await userEvent.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    await userEvent.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    expect(screen.getByText("Vui lòng nhập họ tên người mất.")).toBeInTheDocument();
    expect(screen.getByText("Số căn cước gồm 12 chữ số.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng đính kèm giấy chứng tử.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng đính kèm di chúc.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng cam đoan giấy tờ là thật.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("đủ thông tin thì gửi đúng dữ liệu và chỉ báo đã tiếp nhận", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(report());
    setup(<ReportPanel />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    await user.type(screen.getByLabelText("Họ tên người mất"), "Nguyễn Văn Mất");
    await user.type(screen.getByLabelText("Số căn cước người mất (12 số)"), "001099001234");
    await user.click(screen.getByRole("checkbox", { name: /Tôi cam đoan/ }));
    const file = new File(["%PDF"], "chung-tu.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/^Giấy chứng tử/), file);
    const will = new File(["%PDF"], "di-chuc.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/^Di chúc/), will);
    const person = within(screen.getByRole("group", { name: "Người nhận 1" }));
    await user.type(person.getByLabelText("Họ tên"), "Trần Con");
    await user.type(person.getByLabelText("Email"), "con@example.com");
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(await screen.findByText("Đã tiếp nhận hồ sơ")).toBeInTheDocument();
    const form = post.mock.calls[0][1] as FormData;
    expect(form.get("deceasedCitizenId")).toBe("001099001234");
    expect(form.getAll("deathCertificates")).toHaveLength(1);
    expect(form.get("attested")).toBe("true");
    expect(form.getAll("wills")).toHaveLength(1);
    expect(JSON.parse(form.get("recipients") as string)).toEqual([
      { fullName: "Trần Con", citizenId: "", dateOfBirth: "", email: "con@example.com", phone: "" },
    ]);
  });

  it("người nhận khai căn cước, ngày sinh và số điện thoại đúng thì gửi kèm đủ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(report());
    setup(<ReportPanel />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    await fillReportBasics(user);
    const person = within(screen.getByRole("group", { name: "Người nhận 1" }));
    await user.type(person.getByLabelText("Họ tên"), "Trần Con");
    await user.type(person.getByLabelText("Số căn cước"), "001099000222");
    await user.type(person.getByLabelText("Ngày sinh"), "1990-02-28");
    await user.type(person.getByLabelText("Số điện thoại"), "091 234 5678");
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(await screen.findByText("Đã tiếp nhận hồ sơ")).toBeInTheDocument();
    const form = post.mock.calls[0][1] as FormData;
    expect(JSON.parse(form.get("recipients") as string)).toEqual([
      {
        fullName: "Trần Con",
        citizenId: "001099000222",
        dateOfBirth: "1990-02-28",
        email: "",
        phone: "091 234 5678",
      },
    ]);
  });

  it("căn cước, ngày sinh, số điện thoại sai thì báo lỗi ngay dưới từng ô và không gửi", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    const post = vi.spyOn(apiClient, "post");
    setup(<ReportPanel />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    await fillReportBasics(user);
    const person = within(screen.getByRole("group", { name: "Người nhận 1" }));
    await user.type(person.getByLabelText("Họ tên"), "Trần Con");
    await user.type(person.getByLabelText("Số căn cước"), "123");
    await user.type(person.getByLabelText("Ngày sinh"), "2015-05-05");
    await user.type(person.getByLabelText("Số điện thoại"), "3232");
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(await person.findByText("Số căn cước gồm 12 chữ số.")).toBeInTheDocument();
    expect(person.getByText("Người nhận phải đủ 18 tuổi.")).toBeInTheDocument();
    expect(person.getByText(/Số điện thoại không đúng định dạng/)).toBeInTheDocument();
    expect(person.getByLabelText("Số căn cước")).toHaveAttribute("aria-invalid", "true");
    expect(post).not.toHaveBeenCalled();
  });

  it("hai người nhận khai trùng số căn cước thì báo ở người sau", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    const post = vi.spyOn(apiClient, "post");
    setup(<ReportPanel />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    await fillReportBasics(user);
    const first = within(screen.getByRole("group", { name: "Người nhận 1" }));
    await user.type(first.getByLabelText("Họ tên"), "Trần Con");
    await user.type(first.getByLabelText("Số căn cước"), "001099000222");
    await user.type(first.getByLabelText("Email"), "con@example.com");
    await user.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const second = within(screen.getByRole("group", { name: "Người nhận 2" }));
    await user.type(second.getByLabelText("Họ tên"), "Trần Cháu");
    await user.type(second.getByLabelText("Số căn cước"), "001099000222");
    await user.type(second.getByLabelText("Email"), "chau@example.com");
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(await second.findByText("Số căn cước này đã khai cho người khác.")).toBeInTheDocument();
    expect(first.queryByText("Số căn cước này đã khai cho người khác.")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("luật sư yêu cầu bổ sung thì hiện lý do và form nộp thêm", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      report({ status: "SUPPLEMENT_REQUESTED", reviewReason: "Ảnh mờ" }),
    ]);
    setup(<ReportPanel />);
    expect(await screen.findByText("Ảnh mờ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nộp bổ sung" })).toBeInTheDocument();
  });
});

describe("Form báo tin: người nhận và cam đoan", () => {
  it("có sẵn Người nhận 1; thanh Thêm người nhận mở thêm khối, bỏ thì khối thu lại", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup(<ReportPanel />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(screen.getByRole("group", { name: "Người nhận 1" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Người nhận 2" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    expect(screen.getByRole("group", { name: "Người nhận 2" })).toBeInTheDocument();
    // Thanh nằm dưới khối mới nhất, không đổi chỗ.
    const bar = screen.getByRole("button", { name: "Thêm người nhận" });
    expect(bar).toHaveClass("w-full");

    await user.click(screen.getByRole("button", { name: "Bỏ người nhận 2" }));
    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "Người nhận 2" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("group", { name: "Người nhận 1" })).toBeInTheDocument();
  });

  it("khối đang thu lại không còn nằm trong dữ liệu gửi đi", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(report());
    setup(<ReportPanel />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));
    await user.type(screen.getByLabelText("Họ tên người mất"), "Nguyễn Văn Mất");
    await user.type(screen.getByLabelText("Số căn cước người mất (12 số)"), "001099001234");
    await user.upload(
      screen.getByLabelText(/^Giấy chứng tử/),
      new File(["%PDF"], "chung-tu.pdf", { type: "application/pdf" }),
    );
    await user.upload(
      screen.getByLabelText(/^Di chúc/),
      new File(["%PDF"], "di-chuc.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const second = within(screen.getByRole("group", { name: "Người nhận 2" }));
    await user.type(second.getByLabelText("Họ tên"), "Trần Con");
    await user.type(second.getByLabelText("Email"), "con@example.com");
    await user.click(screen.getByRole("button", { name: "Bỏ người nhận 2" }));
    await user.click(screen.getByRole("checkbox", { name: /Tôi cam đoan/ }));
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(await screen.findByText("Đã tiếp nhận hồ sơ")).toBeInTheDocument();
    const form = post.mock.calls[0][1] as FormData;
    expect(JSON.parse(form.get("recipients") as string)).toEqual([]);
  });
});

describe("Hồ sơ báo tin bị từ chối", () => {
  it("hiện lý do và nút Nộp hồ sơ mới mở lại form", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      report({ status: "REJECTED", reviewReason: "Chứng tử không hợp lệ" }),
    ]);
    setup(<ReportPanel />);
    const user = userEvent.setup();

    expect(await screen.findByText("Chứng tử không hợp lệ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ mới" }));

    expect(screen.getByLabelText("Họ tên người mất")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nộp hồ sơ mới" })).toBeDisabled();
  });
});

describe("Luật sư xét hồ sơ báo tin", () => {
  it("chấp nhận thì mở biên bản vừa tạo", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([verifierReport()]);
    vi.spyOn(apiClient, "post").mockResolvedValue(
      verifierReport({ status: "ACCEPTED", recordId: RECORD_ID }),
    );
    const open = vi.fn();
    setup(<VerifierReportList onOpenRecord={open} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Xem hồ sơ / }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Chấp nhận và lập phương án" }),
    );
    await waitFor(() => expect(open).toHaveBeenCalledWith(RECORD_ID));
  });

  it("có cảnh báo thì phải tick đối chiếu và ghi lý do mới chấp nhận được", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([verifierReport({ nameMatches: false })]);
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(verifierReport({ status: "ACCEPTED", recordId: RECORD_ID }));
    setup(<VerifierReportList onOpenRecord={() => undefined} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Xem hồ sơ / }));
    const accept = await screen.findByRole("button", { name: "Chấp nhận và lập phương án" });
    expect(accept).toBeDisabled();
    expect(screen.getByText(/Họ tên khai không khớp/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: /Tôi đã đối chiếu/ }));
    expect(accept).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Lý do/), "Đã kiểm với phường");
    await userEvent.click(accept);
    expect(post.mock.calls[0][1]).toEqual({
      decision: "ACCEPT",
      reason: "Đã kiểm với phường",
      confirmDocuments: true,
    });
  });

  it("không có tài sản thì không chấp nhận được; từ chối phải có lý do", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      verifierReport({ vaultFound: false, ownerName: "", nameMatches: false }),
    ]);
    setup(<VerifierReportList onOpenRecord={() => undefined} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Xem hồ sơ / }));
    expect(
      await screen.findByRole("button", { name: "Chấp nhận và lập phương án" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Lý do/), "Giấy tờ không hợp lệ");
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeEnabled();
  });

  it("từ chối phải xác nhận rồi mới gửi", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([verifierReport()]);
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(verifierReport({ status: "REJECTED", reviewReason: "Chứng tử mờ" }));
    setup(<VerifierReportList onOpenRecord={() => undefined} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Xem hồ sơ / }));
    await userEvent.type(await screen.findByLabelText(/^Lý do/), "Chứng tử mờ");
    await userEvent.click(screen.getByRole("button", { name: "Từ chối" }));
    expect(
      screen.getByText("Từ chối sẽ đóng yêu cầu này. Người gửi có thể gửi lại yêu cầu mới."),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Xác nhận từ chối" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({ decision: "REJECT", reason: "Chứng tử mờ" });
  });
});
