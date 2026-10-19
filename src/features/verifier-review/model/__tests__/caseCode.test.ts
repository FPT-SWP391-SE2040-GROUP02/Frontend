import { expect, it } from "vitest";
import { caseCode } from "../caseCode";

const ID = "0199e7a4-3c1b-7f2d-9a41-5e6b8c0d1a2f";

it("lấy 8 ký tự cuối của id, bỏ dấu gạch và in hoa như BE", () => {
  const code = caseCode(ID);
  expect(code).toBe("8C0D1A2F");
  expect(code).toHaveLength(8);
  expect(code).toBe(code.toUpperCase());
  expect(code).not.toContain("-");
});

it("không lấy 8 ký tự đầu của id", () => {
  expect(caseCode(ID)).not.toBe(ID.slice(0, 8).toUpperCase());
});
