import { describe, expect, it } from "vitest";
import { MAX_ASSET_FILE_BYTES, validateAssetFile } from "../addAssetForm";

describe("validateAssetFile", () => {
  const remaining = 1000;
  it("thiếu tệp", () => {
    expect(validateAssetFile(null, remaining)).toBe("Vui lòng chọn tệp tài sản.");
  });
  it("tệp rỗng 0 byte", () => {
    expect(validateAssetFile(new File([], "a.txt"), remaining)).toBe(
      "Tệp đã chọn rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.",
    );
  });
  it("vượt giới hạn tối đa", () => {
    const big = new File([new Uint8Array(MAX_ASSET_FILE_BYTES + 1)], "big.bin");
    expect(validateAssetFile(big, remaining)).toBe(
      "Kích thước tệp vượt quá giới hạn tối đa (500 MB).",
    );
  });
  it("vượt dung lượng còn lại của kho", () => {
    const file = new File(["abc"], "a.txt"); // 3 byte
    expect(validateAssetFile(file, 2)).toBe(
      "Dung lượng tệp (3 B) vượt quá dung lượng khả dụng còn lại của kho (2 B).",
    );
  });
  it("hợp lệ trả rỗng", () => {
    expect(validateAssetFile(new File(["ok"], "a.txt"), remaining)).toBe("");
  });
});
