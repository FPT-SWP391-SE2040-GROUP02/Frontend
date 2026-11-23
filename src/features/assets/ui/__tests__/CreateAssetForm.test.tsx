import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { CreateAssetForm } from "../CreateAssetForm";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";

afterEach(cleanup);

describe("CreateAssetForm: ghi chú phạm vi tài sản số", () => {
  it("nhắc LegacyVault chỉ giữ và giao tài sản số, tải giấy tờ không chuyển quyền sở hữu", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CreateAssetForm vaultId={VAULT_ID} remainingBytes={1024} />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(
        "LegacyVault chỉ giữ và giao tài sản số. Nhà, đất, xe… vẫn chia theo di chúc và thủ tục ở ngoài. Tải bản scan giấy tờ nhà, xe lên không phải là chuyển quyền sở hữu.",
      ),
    ).toBeInTheDocument();
  });
});
