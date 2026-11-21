import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { systemExecutorsService } from "../../api/systemExecutorsService";
import type { SystemExecutor } from "../../model/systemExecutor.schema";
import { ExecutorReceivedKeyCard } from "../ExecutorReceivedKeyCard";
import { SystemExecutorCard } from "../SystemExecutorCard";

vi.mock("../../api/systemExecutorsService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../api/systemExecutorsService")>()),
  systemExecutorsService: { list: vi.fn(), getHandoverKey: vi.fn() },
}));

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const KEY = {
  vaultId: VAULT_ID,
  ownerFullName: "Chủ kho thử",
  version: 2,
  shard: "ABCD-EFGH-JKMN-PQRS",
  issuedAt: "2026-11-15T02:00:00Z",
  reissuedAt: null,
  status: "ACTIVE_ON_SYSTEM",
};

function executor(status: "VERIFIED" | "UNVERIFIED"): SystemExecutor {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: "Luật sư Thử",
    email: "thu@example.test",
    phoneMasked: null,
    executorRoleTitle: "Người thực thi",
    legalVerification: {
      status,
      lawyerCardNumber: null,
      practiceCertificateNumber: null,
      organization: null,
      verifiedAt: null,
    },
    assignedVaultsCount: 0,
    isAvailable: true,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("test-token");
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
});

describe("ExecutorReceivedKeyCard", () => {
  it("mặc định ẩn mã và không gọi Backend", () => {
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} />);

    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(systemExecutorsService.getHandoverKey).not.toHaveBeenCalled();
  });

  it("Xem mã hiện mã, Ẩn mã xóa mã khỏi màn hình", async () => {
    vi.mocked(systemExecutorsService.getHandoverKey).mockResolvedValue(KEY);
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} />);

    await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));
    expect(await screen.findByText(KEY.shard)).toBeInTheDocument();
    expect(screen.getByText("Bản 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ẩn mã" }));
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
  });

  it("lỗi từ Backend hiện thông báo, không hiện mã và cho thử lại", async () => {
    vi.mocked(systemExecutorsService.getHandoverKey).mockRejectedValue(new Error("boom"));
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} />);

    await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem mã" })).toBeEnabled();
  });
});

describe("SystemExecutorCard", () => {
  it("người đã xác minh chọn được", async () => {
    const onSelect = vi.fn();
    render(<SystemExecutorCard executor={executor("VERIFIED")} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Chọn người này: Luật sư Thử" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("người chưa có hồ sơ pháp lý bị khóa kèm lý do", () => {
    render(<SystemExecutorCard executor={executor("UNVERIFIED")} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Chọn người này: Luật sư Thử" })).toBeDisabled();
    expect(screen.getByText("Chưa có hồ sơ pháp lý nên chưa thể chọn.")).toBeInTheDocument();
  });
});
