import { describe, expect, it } from "vitest";
import { submissionFormError, type SubmissionDraft } from "../submissionForm";

const valid = (): SubmissionDraft => ({
  kind: "ACCEPT",
  fullName: "Trần Minh Anh",
  citizenId: "012345671234",
  dateOfBirth: "1990-01-01",
  residenceAddress: "34 Trần Hưng Đạo, Hà Nội",
  front: new File(["a"], "truoc.png", { type: "image/png" }),
  back: new File(["b"], "sau.jpg", { type: "image/jpeg" }),
  acknowledged: true,
  voluntaryDecline: false,
});

describe("submissionFormError", () => {
  it("bản điền đủ và đúng hình thức thì không có lỗi", () => {
    expect(submissionFormError(valid())).toBeNull();
  });

  it("báo lỗi theo thứ tự: họ tên, ngày sinh, căn cước, nơi thường trú, hai ảnh, điều khoản", () => {
    expect(submissionFormError({ ...valid(), fullName: "  " })).toMatch(/họ tên/);
    expect(submissionFormError({ ...valid(), dateOfBirth: "" })).toMatch(/ngày sinh/);
    expect(submissionFormError({ ...valid(), dateOfBirth: "2999-01-01" })).toMatch(/không hợp lệ/);
    expect(submissionFormError({ ...valid(), citizenId: "123" })).toMatch(/12 chữ số/);
    expect(submissionFormError({ ...valid(), residenceAddress: "   " })).toMatch(/nơi thường trú/);
    expect(submissionFormError({ ...valid(), residenceAddress: "x".repeat(501) })).toMatch(
      /tối đa 500 ký tự/,
    );
    expect(submissionFormError({ ...valid(), front: null })).toMatch(/mặt trước/);
    expect(submissionFormError({ ...valid(), back: null })).toMatch(/mặt sau/);
    expect(submissionFormError({ ...valid(), acknowledged: false })).toMatch(/đã đọc điều khoản/);
  });

  it("ảnh không đúng định dạng hoặc quá 8 MiB bị từ chối", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(submissionFormError({ ...valid(), front: pdf })).toMatch(/JPEG, PNG hoặc WEBP/);
    const big = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "lon.png", { type: "image/png" });
    expect(submissionFormError({ ...valid(), back: big })).toMatch(/tối đa 8 MiB/);
  });

  it("từ chối thì bắt buộc tick tự nguyện từ chối", () => {
    expect(submissionFormError({ ...valid(), kind: "DECLINE" })).toMatch(/tự nguyện từ chối/);
    expect(submissionFormError({ ...valid(), kind: "DECLINE", voluntaryDecline: true })).toBeNull();
  });
});
