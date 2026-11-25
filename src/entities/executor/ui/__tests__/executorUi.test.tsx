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

function executor(isAvailable = true): SystemExecutor {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: "Nhân viên Thử",
    email: "thu@example.test",
    phoneMasked: null,
    executorRoleTitle: "Người thực thi",
    assignedVaultsCount: 0,
    isAvailable,
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
  it.each(["ACTIVE", "HANDOVER_REQUESTED", "DRAFT"])(
    "kế hoạch %s: chỉ báo chờ bàn giao, không có nút Xem mã",
    (planStatus) => {
      render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} planStatus={planStatus} />);

      expect(screen.getByText("Chờ bàn giao")).toBeInTheDocument();
      expect(screen.getByText(/sau khi luật sư chốt biên bản bàn giao/)).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it("kế hoạch đã đóng vẫn xem được mã", () => {
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} planStatus="CLOSED" />);

    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
  });

  it("mặc định ẩn mã và không gọi Backend", () => {
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} planStatus="HANDOVER_IN_PROGRESS" />);

    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(systemExecutorsService.getHandoverKey).not.toHaveBeenCalled();
  });

  it("Xem mã hiện mã, Ẩn mã xóa mã khỏi màn hình", async () => {
    vi.mocked(systemExecutorsService.getHandoverKey).mockResolvedValue(KEY);
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} planStatus="HANDOVER_IN_PROGRESS" />);

    await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));
    expect(await screen.findByText(KEY.shard)).toBeInTheDocument();
    expect(screen.getByText("Bản 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ẩn mã" }));
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
  });

  it("lỗi từ Backend hiện thông báo, không hiện mã và cho thử lại", async () => {
    vi.mocked(systemExecutorsService.getHandoverKey).mockRejectedValue(new Error("boom"));
    render(<ExecutorReceivedKeyCard vaultId={VAULT_ID} planStatus="HANDOVER_IN_PROGRESS" />);

    await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem mã" })).toBeEnabled();
  });
});

describe("SystemExecutorCard", () => {
  it("chọn được người thực thi đang nhận kho", async () => {
    const onSelect = vi.fn();
    render(<SystemExecutorCard executor={executor()} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Chọn người này: Nhân viên Thử" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("thẻ không còn chữ xác minh pháp lý hay hồ sơ luật sư", () => {
    render(<SystemExecutorCard executor={executor()} onSelect={vi.fn()} />);

    expect(screen.queryByText(/pháp lý/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/thẻ luật sư|chứng chỉ hành nghề/i)).not.toBeInTheDocument();
  });

  it("người không nhận thêm kho bị khóa kèm lý do", () => {
    render(<SystemExecutorCard executor={executor(false)} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Chọn người này: Nhân viên Thử" })).toBeDisabled();
    expect(screen.getByText("Người này hiện chưa nhận thêm kho.")).toBeInTheDocument();
  });
});
