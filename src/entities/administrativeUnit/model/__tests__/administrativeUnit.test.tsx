import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { administrativeUnitService } from "../../api/administrativeUnitService";
import { administrativeUnitListSchema } from "../administrativeUnit.schema";
import { useProvinces, useWards } from "../useAdministrativeUnits";

afterEach(() => vi.restoreAllMocks());

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("danh mục tỉnh/phường", () => {
  it("giữ mã dạng chuỗi (số 0 đứng đầu) và từ chối mục thiếu tên", () => {
    expect(administrativeUnitListSchema.parse([{ code: "01", name: "Thành phố Hà Nội" }])).toEqual([
      { code: "01", name: "Thành phố Hà Nội" },
    ]);
    expect(administrativeUnitListSchema.safeParse([{ code: 1, name: "x" }]).success).toBe(false);
    expect(administrativeUnitListSchema.safeParse([{ code: "01" }]).success).toBe(false);
  });

  it("gọi đúng đường dẫn của Backend", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce([{ code: "79", name: "Thành phố Hồ Chí Minh" }])
      .mockResolvedValueOnce([{ code: "26743", name: "Phường Bến Thành" }]);

    await administrativeUnitService.getProvinces();
    await administrativeUnitService.getWards("79");

    expect(get).toHaveBeenNthCalledWith(1, "/administrative-units/provinces", expect.anything());
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/administrative-units/provinces/79/wards",
      expect.anything(),
    );
  });

  it("useProvinces tải danh sách tỉnh", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([{ code: "01", name: "Thành phố Hà Nội" }]);

    const { result } = renderHook(() => useProvinces(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ code: "01", name: "Thành phố Hà Nội" }]);
  });

  it("useWards không gọi Backend khi chưa chọn tỉnh", () => {
    const get = vi.spyOn(apiClient, "get");

    const { result } = renderHook(() => useWards(""), { wrapper: wrapper() });

    expect(result.current.fetchStatus).toBe("idle");
    expect(get).not.toHaveBeenCalled();
  });

  it("useWards tải phường của tỉnh đã chọn", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue([{ code: "26743", name: "Phường Bến Thành" }]);

    const { result } = renderHook(() => useWards("79"), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/administrative-units/provinces/79/wards", expect.anything());
  });
});
