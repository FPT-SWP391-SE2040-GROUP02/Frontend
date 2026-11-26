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
  ownerFullName: "Chủ tài sản thử",
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

function renderCard(planStatus: string, verifyPassword = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ExecutorReceivedKeyCard
      vaultId={VAULT_ID}
      planStatus={planStatus}
      verifyPassword={verifyPassword}
    />,
  );
  return verifyPassword;
}

/** Bấm Xem mã, nhập mật khẩu rồi xác nhận. */
async function revealWithPassword(password = "MatKhau123") {
  await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));
  await userEvent.type(screen.getByLabelText("Nhập lại mật khẩu để xem mã"), password);
  await userEvent.click(screen.getByRole("button", { name: "Xác nhận và xem mã" }));
}

describe("ExecutorReceivedKeyCard", () => {
  it.each(["ACTIVE", "HANDOVER_REQUESTED", "DRAFT"])(
    "kế hoạch %s: chỉ báo chờ bàn giao, không có nút Xem mã",
    (planStatus) => {
      renderCard(planStatus);

      expect(screen.getByText("Chờ bàn giao")).toBeInTheDocument();
      expect(screen.getByText(/sau khi luật sư chốt phương án chia/)).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it("kế hoạch đã đóng vẫn xem được mã", () => {
    renderCard("CLOSED");

    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
  });

  it("mặc định ẩn mã, không hỏi mật khẩu và không gọi Backend", () => {
    renderCard("HANDOVER_IN_PROGRESS");

    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nhập lại mật khẩu để xem mã")).not.toBeInTheDocument();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    expect(systemExecutorsService.getHandoverKey).not.toHaveBeenCalled();
  });

  it("bấm Xem mã chỉ mở ô nhập lại mật khẩu, chưa lấy mã; Hủy đóng ô lại", async () => {
    renderCard("HANDOVER_IN_PROGRESS");

    await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));
    expect(screen.getByLabelText("Nhập lại mật khẩu để xem mã")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận và xem mã" })).toBeDisabled();
    expect(systemExecutorsService.getHandoverKey).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(screen.queryByLabelText("Nhập lại mật khẩu để xem mã")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem mã" })).toBeInTheDocument();
  });

  it("nhập đúng mật khẩu thì hiện mã; Ẩn mã xóa mã và lần sau phải nhập lại mật khẩu", async () => {
    vi.mocked(systemExecutorsService.getHandoverKey).mockResolvedValue(KEY);
    const verifyPassword = renderCard("HANDOVER_IN_PROGRESS");

    await revealWithPassword();
    expect(await screen.findByText(KEY.shard)).toBeInTheDocument();
    expect(screen.getByText("Bản 2")).toBeInTheDocument();
    expect(verifyPassword).toHaveBeenCalledWith("MatKhau123");

    await userEvent.click(screen.getByRole("button", { name: "Ẩn mã" }));
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xem mã" }));
    expect(screen.getByLabelText("Nhập lại mật khẩu để xem mã")).toHaveValue("");
  });

  it("sai mật khẩu thì báo lỗi, không lấy mã và không hiện mã", async () => {
    const verifyPassword = vi.fn().mockRejectedValue(new Error("401"));
    renderCard("HANDOVER_IN_PROGRESS", verifyPassword);

    await revealWithPassword("sai-mat-khau");

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(systemExecutorsService.getHandoverKey).not.toHaveBeenCalled();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
  });

  it("lỗi từ Backend khi lấy mã hiện thông báo, không hiện mã", async () => {
    vi.mocked(systemExecutorsService.getHandoverKey).mockRejectedValue(new Error("boom"));
    renderCard("HANDOVER_IN_PROGRESS");

    await revealWithPassword();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(KEY.shard)).not.toBeInTheDocument();
  });
});

describe("SystemExecutorCard", () => {
  it("chọn được người thực thi đang nhận tài sản", async () => {
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

  it("người không nhận thêm tài sản bị khóa kèm lý do", () => {
    render(<SystemExecutorCard executor={executor(false)} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Chọn người này: Nhân viên Thử" })).toBeDisabled();
    expect(screen.getByText("Người này hiện chưa nhận thêm tài sản.")).toBeInTheDocument();
  });
});
