import { describe, expect, it } from "vitest";
import {
  buildRegistrationPlace,
  CERTIFICATE_INFO_MESSAGES,
  EMPTY_CERTIFICATE_INFO,
  formatIsoDate,
  missingCertificateInfo,
  previewSentence,
  validateCertificateInfo,
  type CertificateInfoValues,
} from "../certificateInfo";

const TODAY = "2026-11-11";

function info(over: Partial<CertificateInfoValues> = {}): CertificateInfoValues {
  return { ...EMPTY_CERTIFICATE_INFO, ...over };
}

describe("luật kiểm 3 thông tin trên giấy (khớp Backend)", () => {
  it("ngày mất bằng hôm nay hợp lệ, sau hôm nay thì báo lỗi đúng chữ", () => {
    expect(validateCertificateInfo(info({ dateOfDeath: TODAY }), TODAY)).toEqual({});
    expect(validateCertificateInfo(info({ dateOfDeath: "2026-11-12" }), TODAY)).toEqual({
      dateOfDeath: "Ngày mất không được sau hôm nay.",
    });
  });

  it("ngày mất không trước ngày kích hoạt; đúng ngày kích hoạt vẫn hợp lệ; không có ngày kích hoạt thì để Backend kiểm", () => {
    const early = info({ dateOfDeath: "2026-10-30" });
    expect(validateCertificateInfo(early, TODAY, "2026-11-01")).toEqual({
      dateOfDeath: "Ngày mất phải sau ngày Chủ kho kích hoạt kế hoạch (01/11/2026).",
    });
    expect(
      validateCertificateInfo(info({ dateOfDeath: "2026-11-01" }), TODAY, "2026-11-01"),
    ).toEqual({});
    expect(validateCertificateInfo(early, TODAY)).toEqual({});
  });

  it("ngày đăng ký không trước ngày mất; cùng ngày hợp lệ", () => {
    const before = info({ dateOfDeath: "2026-11-05", issuedOn: "2026-11-04" });
    expect(validateCertificateInfo(before, TODAY)).toEqual({
      issuedOn: CERTIFICATE_INFO_MESSAGES.issuedBeforeDeath,
    });
    expect(
      validateCertificateInfo(info({ dateOfDeath: "2026-11-05", issuedOn: "2026-11-05" }), TODAY),
    ).toEqual({});
  });

  it("ngày đăng ký không sau hôm nay; bằng hôm nay hợp lệ", () => {
    expect(
      validateCertificateInfo(info({ dateOfDeath: "2026-11-05", issuedOn: "2026-11-12" }), TODAY),
    ).toEqual({ issuedOn: "Ngày đăng ký khai tử không được sau hôm nay." });
    expect(
      validateCertificateInfo(info({ dateOfDeath: "2026-11-05", issuedOn: TODAY }), TODAY),
    ).toEqual({});
  });

  it("trường chưa nhập thì bỏ qua", () => {
    expect(validateCertificateInfo(EMPTY_CERTIFICATE_INFO, TODAY, "2026-11-01")).toEqual({});
  });
});

describe("phần còn thiếu", () => {
  it("báo theo thứ tự ngày mất, ngày đăng ký, nơi đăng ký", () => {
    expect(missingCertificateInfo(EMPTY_CERTIFICATE_INFO)).toEqual([
      "ngày mất",
      "ngày đăng ký khai tử",
      "nơi đăng ký khai tử",
    ]);
  });

  it("nơi đăng ký cần đủ tỉnh và phường", () => {
    const base = { dateOfDeath: "2026-11-05", issuedOn: "2026-11-06" };
    expect(missingCertificateInfo(info({ ...base, provinceCode: "79" }))).toEqual([
      "nơi đăng ký khai tử",
    ]);
    expect(
      missingCertificateInfo(info({ ...base, provinceCode: "79", wardCode: "26743" })),
    ).toEqual([]);
  });
});

describe("câu nơi đăng ký và câu xem trước", () => {
  it("ghép giống Backend: phường viết thường chữ đầu, thiếu thì rỗng", () => {
    expect(buildRegistrationPlace("Thành phố Hồ Chí Minh", "Phường Bến Thành")).toBe(
      "UBND phường Bến Thành, Thành phố Hồ Chí Minh",
    );
    expect(buildRegistrationPlace("Tỉnh Lạng Sơn", "Xã Bắc Sơn")).toBe(
      "UBND xã Bắc Sơn, Tỉnh Lạng Sơn",
    );
    expect(buildRegistrationPlace("Thành phố Hồ Chí Minh", "")).toBe("");
    expect(buildRegistrationPlace("", "Phường Bến Thành")).toBe("");
  });

  it("định dạng ngày dd/MM/yyyy, sai dạng thì rỗng", () => {
    expect(formatIsoDate("2026-11-05")).toBe("05/11/2026");
    expect(formatIsoDate("")).toBe("");
    expect(formatIsoDate("05/11/2026")).toBe("");
  });

  it("phần đã điền và phần thiếu (hiện ……) tách riêng để tô màu", () => {
    const segments = previewSentence("Nguyễn Văn A", info({ dateOfDeath: "2026-11-05" }), "");
    expect(segments.map((segment) => segment.text).join("")).toBe(
      "Ông/bà Nguyễn Văn A chết ngày 05/11/2026 theo giấy chứng tử do …… đăng ký khai tử ngày ……",
    );
    const variable = segments.filter((segment) => !segment.fixed);
    expect(variable.map((segment) => segment.filled)).toEqual([true, false, false]);
  });
});
