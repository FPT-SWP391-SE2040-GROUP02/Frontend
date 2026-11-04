import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isMaintenanceError,
  MAINTENANCE_ERROR_CODE,
  reportMaintenance,
  subscribeMaintenance,
} from "../maintenance";

/** Lỗi Axios giả có status và body ProblemDetails. */
function httpError(status: number, body: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = {
    status,
    statusText: "",
    data: body,
    headers: {},
    config,
  };
  return new AxiosError("request failed", "ERR_BAD_RESPONSE", config, undefined, response);
}

let unsubscribe: (() => void) | undefined;
afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
});

describe("maintenance signal", () => {
  it("chỉ nhận 503 kèm code MAINTENANCE_MODE", () => {
    expect(isMaintenanceError(httpError(503, { code: MAINTENANCE_ERROR_CODE }))).toBe(true);
    expect(isMaintenanceError(httpError(503, { code: "EKYC_SERVICE_UNAVAILABLE" }))).toBe(false);
    expect(isMaintenanceError(httpError(500, { code: MAINTENANCE_ERROR_CODE }))).toBe(false);
    expect(isMaintenanceError(new Error("network"))).toBe(false);
  });

  it("báo listener khi gặp lỗi bảo trì và bỏ qua lỗi khác", () => {
    const listener = vi.fn();
    unsubscribe = subscribeMaintenance(listener);

    reportMaintenance(httpError(401, { code: "SESSION_EXPIRED" }));
    expect(listener).not.toHaveBeenCalled();

    reportMaintenance(httpError(503, { code: MAINTENANCE_ERROR_CODE }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
