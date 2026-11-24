import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { handoverRequestService } from "../../api/handoverRequestService";
import { availableAction, availableStatusLabel } from "../availablePresentation";
import { availableHandoverSchema, type AvailableHandover } from "../handoverRequest.schema";
import { countNeedsAction, sortAvailable } from "../useHandoverRequest";

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const BENEFICIARY_ID = "22222222-2222-4222-8222-222222222222";
const RECORD_ID = "33333333-3333-4333-8333-333333333333";
const CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const TURN_ID = "55555555-5555-4555-8555-555555555555";
const AT = "2026-11-21T03:00:00+00:00";

function row(extra: Record<string, unknown> = {}) {
  return {
    vaultId: VAULT_ID,
    beneficiaryId: BENEFICIARY_ID,
    ownerName: "Nguyễn Văn A",
    status: "NOT_REQUESTED",
    needsAction: false,
    canRequest: false,
    reviewReason: null,
    claimId: null,
    turnId: null,
    ...extra,
  };
}

function parsed(extra: Record<string, unknown> = {}): AvailableHandover {
  return availableHandoverSchema.parse(row(extra));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("schema kho được để lại", () => {
  it("nhận dòng đủ trường", () => {
    const value = parsed({ status: "CODE_READY", claimId: CLAIM_ID, turnId: TURN_ID });
    expect(value.status).toBe("CODE_READY");
    expect(value.turnId).toBe(TURN_ID);
  });

  it("thiếu các trường null vẫn parse được", () => {
    const value = availableHandoverSchema.parse({
      vaultId: VAULT_ID,
      beneficiaryId: BENEFICIARY_ID,
      ownerName: "Nguyễn Văn A",
      status: "REQUEST_PENDING",
      needsAction: false,
      canRequest: false,
    });
    expect(value.reviewReason ?? null).toBeNull();
    expect(value.claimId ?? null).toBeNull();
  });

  it("từ chối trạng thái lạ", () => {
    expect(availableHandoverSchema.safeParse(row({ status: "UNKNOWN" })).success).toBe(false);
  });
});

describe("handoverRequestService", () => {
  it("available gọi đúng đường dẫn và trả mảng đã parse", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue([row()]);
    const result = await handoverRequestService.available();
    expect(get).toHaveBeenCalledWith("/handover/requests/available", expect.anything());
    expect(result).toHaveLength(1);
    expect(result[0].ownerName).toBe("Nguyễn Văn A");
  });

  it("available báo lỗi khi Backend trả sai dạng", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([{ vaultId: "x" }]);
    await expect(handoverRequestService.available()).rejects.toThrow();
  });

  it("submitByAccount gửi multipart có vaultId, lời nhắn đã cắt khoảng trắng và tệp", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      id: CLAIM_ID,
      recordId: RECORD_ID,
      ownerName: "Nguyễn Văn A",
      status: "SUBMITTED",
      recordStatus: "DRAFTING",
      note: "",
      reviewReason: null,
      createdAt: AT,
      reviewedAt: null,
      files: [],
    });
    const file = new File(["%PDF-1.4"], "di-chuc.pdf", { type: "application/pdf" });
    await handoverRequestService.submitByAccount(VAULT_ID, "  xin chào  ", [file], []);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/handover/requests/by-account");
    const form = body as FormData;
    expect(form.get("vaultId")).toBe(VAULT_ID);
    expect(form.get("token")).toBeNull();
    expect(form.get("note")).toBe("xin chào");
    expect((form.get("wills") as File).name).toBe("di-chuc.pdf");
  });

  it("submitByAccount từ chối vaultId không phải uuid, không gọi Backend", async () => {
    const post = vi.spyOn(apiClient, "post");
    await expect(
      handoverRequestService.submitByAccount("khong-phai-uuid", "", [], []),
    ).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("thứ tự và đếm", () => {
  it("dòng cần làm lên đầu, giữ thứ tự cũ trong từng nhóm", () => {
    const sorted = sortAvailable([
      parsed({ ownerName: "A", status: "WAITING_OTHERS" }),
      parsed({ ownerName: "B", status: "CODE_READY", needsAction: true }),
      parsed({ ownerName: "C", status: "RECEIVED" }),
      parsed({ ownerName: "D", status: "NEED_MY_SIGNATURE", needsAction: true }),
    ]);
    expect(sorted.map((item) => item.ownerName)).toEqual(["B", "D", "A", "C"]);
  });

  it("đếm đúng số dòng needsAction", () => {
    expect(countNeedsAction([])).toBe(0);
    expect(
      countNeedsAction([parsed({ needsAction: true }), parsed(), parsed({ needsAction: true })]),
    ).toBe(2);
  });
});

describe("nút cho bước tiếp theo", () => {
  it("gửi yêu cầu kèm vaultId chỉ khi canRequest", () => {
    const action = availableAction(parsed({ canRequest: true }));
    expect(action?.label).toBe("Gửi yêu cầu");
    expect(action?.to).toBe(`/request?vaultId=${VAULT_ID}`);
    expect(availableAction(parsed({ canRequest: false }))).toBeNull();
  });

  it.each([
    ["REQUEST_PENDING", "Xem yêu cầu"],
    ["SUPPLEMENT_REQUESTED", "Nộp bổ sung"],
    ["NEED_MY_SIGNATURE", "Ký biên bản"],
    ["CODE_READY", "Nhập mã và tải"],
    ["NEED_IDENTITY", "Nộp ảnh căn cước"],
  ])("%s dẫn vào cổng người nhận với nút %s", (status, label) => {
    const action = availableAction(parsed({ status }));
    expect(action?.label).toBe(label);
    expect(action?.to).toBe("/claim/beneficiary");
  });

  it.each(["IN_REVIEW", "WAITING_OTHERS", "RECEIVED"])(
    "%s có biên bản thì Xem biên bản, không có thì chỉ hiện nhãn",
    (status) => {
      expect(availableAction(parsed({ status, turnId: TURN_ID }))?.label).toBe("Xem biên bản");
      expect(availableAction(parsed({ status }))).toBeNull();
    },
  );

  it("REJECTED có yêu cầu thì Xem yêu cầu, không có thì chỉ hiện nhãn", () => {
    expect(availableAction(parsed({ status: "REJECTED", claimId: CLAIM_ID }))?.label).toBe(
      "Xem yêu cầu",
    );
    expect(availableAction(parsed({ status: "REJECTED" }))).toBeNull();
  });
});

describe("nhãn trạng thái theo lượt của chính người nhận", () => {
  it("WAITING_OTHERS: đã ký, chờ luật sư hoặc Người thực thi ký", () => {
    expect(availableStatusLabel.WAITING_OTHERS.label).toBe("Chờ luật sư hoặc Người thực thi ký");
  });

  it("CODE_READY vẫn là đã có mã nhận, dẫn vào cổng nhập mã", () => {
    expect(availableStatusLabel.CODE_READY.label).toBe("Đã có mã nhận");
    expect(availableAction(parsed({ status: "CODE_READY", turnId: TURN_ID }))?.label).toBe(
      "Nhập mã và tải",
    );
  });
});
