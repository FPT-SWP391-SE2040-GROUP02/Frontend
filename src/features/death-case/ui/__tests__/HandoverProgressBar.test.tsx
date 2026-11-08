import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HandoverProgressBar } from "../HandoverProgressBar";
import * as progressHook from "../../model/useHandoverProgress";
import type { DeathCase } from "../../model/deathCase.schema";

function renderBar(record: DeathCase | null, caseId: string | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HandoverProgressBar record={record} caseId={caseId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("HandoverProgressBar", () => {
  it("chưa có hồ sơ thì chỉ nói tiến trình chưa bắt đầu, không có 8 bước vòng đời", () => {
    renderBar(null, null);

    expect(screen.getByRole("heading", { name: "Tiến trình bàn giao" })).toBeInTheDocument();
    expect(screen.getByText(/bắt đầu sau khi bạn gửi hồ sơ/)).toBeInTheDocument();
    expect(screen.queryByText("Lập kế hoạch")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("hồ sơ đã duyệt: hiện số người nhận đã đồng ý và số tài sản đã được tải", () => {
    vi.spyOn(progressHook, "useHandoverProgress").mockReturnValue({
      data: {
        caseId: "c",
        handoverStarted: true,
        serverTime: "2026-11-08T08:00:00+00:00",
        summary: {
          totalTurns: 2,
          waitingResponse: 1,
          inVerification: 0,
          accepted: 1,
          declined: 0,
          ended: 0,
        },
        turns: [
          {
            status: "HANDOVER_COMMITTED",
            totalItems: 4,
            downloadedItems: 3,
          },
          { status: "INVITED", totalItems: 2, downloadedItems: 0 },
        ],
      },
    } as unknown as ReturnType<typeof progressHook.useHandoverProgress>);
    const record = { status: "APPROVED_FOR_HANDOVER" } as DeathCase;

    renderBar(record, "11111111-1111-4111-8111-111111111111");

    expect(screen.getByText(/1\/2 người nhận đã đồng ý nhận/)).toBeInTheDocument();
    expect(screen.getByText(/3\/4 tài sản đã được tải/)).toBeInTheDocument();
  });
});
