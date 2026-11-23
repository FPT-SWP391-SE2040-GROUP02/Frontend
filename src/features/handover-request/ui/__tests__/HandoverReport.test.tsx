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
    cancelledByOwner: false,
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
    const file = new File(["%PDF"], "chung-tu.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/^Giấy chứng tử/), file);
    const person = within(screen.getByRole("group", { name: "Người nhận 1" }));
    await user.type(person.getByLabelText("Họ tên"), "Trần Con");
    await user.type(person.getByLabelText("Email"), "con@example.com");
    await user.click(screen.getByRole("button", { name: "Nộp hồ sơ" }));

    expect(await screen.findByText("Đã tiếp nhận hồ sơ")).toBeInTheDocument();
    const form = post.mock.calls[0][1] as FormData;
    expect(form.get("deceasedCitizenId")).toBe("001099001234");
    expect(form.getAll("deathCertificates")).toHaveLength(1);
    expect(JSON.parse(form.get("recipients") as string)).toEqual([
      { fullName: "Trần Con", email: "con@example.com", phone: "" },
    ]);
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

describe("Luật sư xét hồ sơ báo tin", () => {
  it("chấp nhận thì mở biên bản vừa tạo", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([verifierReport()]);
    vi.spyOn(apiClient, "post").mockResolvedValue(
      verifierReport({ status: "ACCEPTED", recordId: RECORD_ID }),
    );
    const open = vi.fn();
    setup(<VerifierReportList onOpenRecord={open} />);
    await userEvent.click(await screen.findByRole("button", { name: "Chấp nhận và mở biên bản" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(RECORD_ID));
  });

  it("không có kho thì không chấp nhận được; từ chối phải có lý do", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      verifierReport({ vaultFound: false, ownerName: "", nameMatches: false }),
    ]);
    setup(<VerifierReportList onOpenRecord={() => undefined} />);
    expect(await screen.findByRole("button", { name: "Chấp nhận và mở biên bản" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Lý do/), "Giấy tờ không hợp lệ");
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeEnabled();
  });
});
