import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES, avatarFileProblem } from "../avatar.rules";

describe("avatarFileProblem", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s within the size limit", (type) => {
    expect(avatarFileProblem({ size: 1024, type })).toBeNull();
    expect(avatarFileProblem({ size: AVATAR_MAX_BYTES, type })).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(avatarFileProblem({ size: 0, type: "image/png" })).toBe("Vui lòng chọn ảnh.");
  });

  it.each(["application/pdf", "image/gif", "image/svg+xml", "text/plain", ""])(
    "rejects type %j with the format message",
    (type) => {
      expect(avatarFileProblem({ size: 1024, type })).toBe("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
    },
  );

  it("rejects a file larger than 2 MiB", () => {
    expect(avatarFileProblem({ size: AVATAR_MAX_BYTES + 1, type: "image/png" })).toBe(
      "Ảnh tối đa 2 MB.",
    );
  });
});
