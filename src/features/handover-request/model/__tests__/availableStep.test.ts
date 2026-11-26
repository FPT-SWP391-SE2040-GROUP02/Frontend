import { describe, expect, it } from "vitest";
import { availableStep } from "../availablePresentation";
import type { AvailableHandover } from "../handoverRequest.schema";

function row(extra: Partial<AvailableHandover>): AvailableHandover {
  return {
    vaultId: "11111111-1111-4111-8111-111111111111",
    beneficiaryId: "22222222-2222-4222-8222-222222222222",
    ownerName: "Chủ tài sản thử",
    status: "NOT_REQUESTED",
    needsAction: false,
    canRequest: true,
    claimId: null,
    turnId: null,
    reviewReason: null,
    ...extra,
  };
}

describe("availableStep", () => {
  it("chưa gửi yêu cầu: bước 1 khi gửi được, không có bước khi chưa gửi được", () => {
    expect(availableStep(row({}))).toBe(1);
    expect(availableStep(row({ canRequest: false }))).toBeNull();
  });

  it("đang chờ xét hoặc cần bổ sung giấy tờ: bước 2", () => {
    expect(availableStep(row({ status: "REQUEST_PENDING" }))).toBe(2);
    expect(availableStep(row({ status: "SUPPLEMENT_REQUESTED" }))).toBe(2);
    expect(availableStep(row({ status: "IN_REVIEW" }))).toBe(2);
  });

  it("căn cước: cần nộp là bước 3, đã nộp chờ luật sư là bước 4", () => {
    expect(availableStep(row({ status: "NEED_IDENTITY" }))).toBe(3);
    const waiting = row({ status: "IN_REVIEW", turnId: "33333333-3333-4333-8333-333333333333" });
    expect(availableStep(waiting)).toBe(4);
  });

  it("ký biên bản, nhập mã, nhận xong", () => {
    expect(availableStep(row({ status: "NEED_MY_SIGNATURE" }))).toBe(5);
    expect(availableStep(row({ status: "WAITING_OTHERS" }))).toBe(5);
    expect(availableStep(row({ status: "CODE_READY" }))).toBe(6);
    expect(availableStep(row({ status: "RECEIVED" }))).toBe(7);
  });

  it("bị từ chối thì không có bước, trừ khi được gửi lại thì về bước 1", () => {
    expect(availableStep(row({ status: "REJECTED", canRequest: false }))).toBeNull();
    expect(availableStep(row({ status: "REJECTED", canRequest: true }))).toBe(1);
  });
});
