import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { CameraCheckPage } from "@/pages/ekyc/CameraCheckPage";
import type { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";

// Isolate page orchestration; camera/OCR interactions have their own integration tests.
vi.mock("@/features/ekyc/ui/EkycStatusPanel", () => ({
  EkycStatusPanel: (props: ComponentProps<typeof EkycStatusPanel>) => (
    <>
      <button onClick={() => props.onVerificationBound?.(VAULT_ID)}>Bind verification</button>
      <button disabled={!props.canComplete} onClick={props.onComplete}>
        Complete identity
      </button>
      {props.completeResult?.succeeded && <p>Completion succeeded</p>}
    </>
  ),
}));

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

it("prevents completing the same identity again after a successful transition", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_ID,
        email: "fixture@example.test",
        fullName: "Fixture",
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: false,
        createdAt: CREATED_AT,
      },
    }),
  );
  accessTokenMemory.set("workflow-fixture");
  vi.spyOn(apiClient, "get").mockResolvedValue({
    status: "PASSED",
    verificationId: VAULT_ID,
    citizenIdLast4: "8901",
    faceMatchScore: 0.42,
    matchThreshold: 0.363,
    spoofCheckPassed: true,
    createdAt: null,
    completedAt: null,
    purpose: "BENEFICIARY_CLAIM",
    identityMatch: "MATCHED",
    backSideChecked: true,
  });
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    id: CONTAINER_ID,
    status: "READY_TO_ACCEPT",
    serverTime: CREATED_AT,
    invitedAt: CREATED_AT,
    responseDeadline: CREATED_AT,
    decisionDeadline: null,
    identityBypassed: false,
    container: null,
    items: [],
    grant: null,
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/verify/camera?turnId=${CONTAINER_ID}`]}>
          <CameraCheckPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Bind verification" }));
  const complete = screen.getByRole("button", { name: "Complete identity" });
  await waitFor(() => expect(complete).toBeEnabled());
  fireEvent.click(complete);
  await screen.findByText("Completion succeeded");
  expect(complete).toBeDisabled();
  fireEvent.click(complete);
  expect(post).toHaveBeenCalledExactlyOnceWith(`/handover/turns/${CONTAINER_ID}/identity/complete`);
  client.clear();
});
