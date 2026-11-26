import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import authReducer from "@/entities/user/model/authSlice";
import { executorWillService } from "@/entities/will/api/executorWillService";
import { deathCaseService } from "../../api/deathCaseService";
import { ExecutorWillConsent } from "../ExecutorWillConsent";

const AT = "2026-11-24T03:00:00+00:00";
const VAULT_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  accessTokenMemory.set("will-consent-fixture");
  vi.spyOn(deathCaseService, "respondWill").mockResolvedValue(undefined);
  vi.spyOn(executorWillService, "get").mockResolvedValue({
    versionNo: 2,
    signedAt: AT,
    ownerName: "Nguyễn Chủ Kho",
    ownerEmail: "chu@example.test",
    recipients: [],
    unassignedAssetCount: 0,
    identity: { owner: null, recipients: [] },
  });
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(extra: Record<string, unknown>) {
  render(
    <Provider store={configureStore({ reducer: { auth: authReducer } })}>
      <QueryClientProvider client={new QueryClient()}>
        <ExecutorWillConsent
          vault={{
            vaultId: VAULT_ID,
            ownerFullName: "Nguyễn Chủ Kho",
            planStatus: "ACTIVE",
            handoverRecordStatus: "",
            acceptedAt: AT,
            willVersionNo: 2,
            willSignedAt: AT,
            confirmedWillVersionNo: 1,
            ...extra,
          }}
        />
      </QueryClientProvider>
    </Provider>,
  );
}

/** Mở biên bản, đợi tờ hiện ra rồi đóng: lúc đó mới tính là đã đọc. */
async function readPaper(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: "Xem biên bản với Chủ tài sản" }));
  expect(await screen.findAllByText("III. Người thực thi")).not.toHaveLength(0);
  await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
}

it("phải mở biên bản rồi mới đồng ý và ký được", async () => {
  setup({ willConsentRequired: true });
  expect(screen.getByRole("button", { name: "Không đồng ý" })).toBeDisabled();
  await readPaper();
  await userEvent.type(screen.getByLabelText("Mật khẩu tài khoản"), "mat-khau-thu");
  await userEvent.click(screen.getByRole("button", { name: "Đồng ý và ký" }));
  await waitFor(() =>
    expect(deathCaseService.respondWill).toHaveBeenCalledWith(VAULT_ID, true, 2, "mat-khau-thu"),
  );
});

it("không đồng ý thì hỏi lại; chỉ gửi khi xác nhận", async () => {
  setup({ willConsentRequired: true });
  await readPaper();
  await userEvent.click(screen.getByRole("button", { name: "Không đồng ý" }));
  await userEvent.click(await screen.findByRole("button", { name: "Quay lại" }));
  expect(deathCaseService.respondWill).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Không đồng ý" }));
  await userEvent.click(await screen.findByRole("button", { name: "Xác nhận không đồng ý" }));
  await waitFor(() =>
    expect(deathCaseService.respondWill).toHaveBeenCalledWith(VAULT_ID, false, 2, ""),
  );
});

it("đã không đồng ý thì chỉ nhắc lại", () => {
  setup({ willConsentRequired: false, declinedWillVersionNo: 2 });
  expect(screen.getByText("Bạn không đồng ý biên bản phiên bản 2")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Đồng ý và ký" })).not.toBeInTheDocument();
});

it("không có gì cần trả lời thì không hiện", () => {
  setup({ willConsentRequired: false, confirmedWillVersionNo: 2 });
  expect(screen.queryByText(/phiên bản mới/)).not.toBeInTheDocument();
});
