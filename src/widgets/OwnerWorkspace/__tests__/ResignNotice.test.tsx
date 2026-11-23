import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { ROUTES } from "@/shared/config/routes.config";
import { ResignNotice } from "../ResignNotice";

vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));

const VAULT_ID = "11111111-1111-4111-8111-111111111111";

interface Changes {
  addedAssignments: number;
  removedAssignments: number;
  affectedRecipientCount: number;
}

function changes(overrides: Partial<Changes>): Changes {
  return {
    addedAssignments: 0,
    removedAssignments: 0,
    affectedRecipientCount: 0,
    ...overrides,
  };
}

function mockPlan(data: unknown) {
  vi.mocked(usePlanSetup).mockReturnValue({ data } as never);
}

function renderNotice() {
  return render(
    <MemoryRouter>
      <ResignNotice vaultId={VAULT_ID} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  cleanup();
});

describe("ResignNotice", () => {
  it("không hiện gì khi chưa có dữ liệu kế hoạch", () => {
    mockPlan(undefined);
    renderNotice();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("không hiện khi kế hoạch còn nháp dù cờ chưa ký lại bật", () => {
    mockPlan({ planStatus: "DRAFT", hasUnsignedChanges: true, unsignedChanges: null });
    renderNotice();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("không hiện khi bản ký còn khớp cấu hình", () => {
    mockPlan({ planStatus: "ACTIVE", hasUnsignedChanges: false, unsignedChanges: null });
    renderNotice();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("hiện số đếm, hệ quả của phần đã gỡ gán và đường dẫn sang màn Bàn giao", () => {
    mockPlan({
      planStatus: "ACTIVE",
      hasUnsignedChanges: true,
      unsignedChanges: changes({ removedAssignments: 1 }),
    });
    renderNotice();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Có thay đổi chưa ký lại")).toBeTruthy();
    expect(screen.getByText(/Đã gỡ 1 lượt gán tài sản cho người nhận/)).toBeTruthy();
    expect(screen.getByText(/Phần đã gỡ gán không còn được bàn giao\./)).toBeTruthy();
    expect(screen.queryByText(/chưa được bàn giao cho tới khi/)).toBeNull();
    const link = screen.getByRole("link", { name: "Đi tới Bàn giao để ký lại" });
    expect(link.getAttribute("href")).toBe(ROUTES.WILLS.ROOT);
  });

  it("nói phần gán thêm chưa được bàn giao", () => {
    mockPlan({
      planStatus: "ACTIVE",
      hasUnsignedChanges: true,
      unsignedChanges: changes({ addedAssignments: 2, affectedRecipientCount: 1 }),
    });
    renderNotice();
    expect(
      screen.getByText(/Phần gán thêm chưa được bàn giao cho tới khi bạn ký lại\./),
    ).toBeTruthy();
    expect(screen.queryByText(/Phần đã gỡ gán không còn được bàn giao/)).toBeNull();
  });

  it("không có số đếm thì vẫn nói phần đã gỡ gán không còn được bàn giao", () => {
    mockPlan({ planStatus: "ACTIVE", hasUnsignedChanges: true, unsignedChanges: null });
    renderNotice();
    expect(screen.getByText(/Phần đã gỡ gán không còn được bàn giao\./)).toBeTruthy();
  });
});
