import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HandoverRecord, RecordRecipient } from "../../model/handoverRecord.schema";
import { SignatureParties } from "../SignatureParties";

const AT = "2026-11-26T07:02:00+00:00";

function seals(recipient: Partial<RecordRecipient>) {
  const record = { verifierSignedAt: null, executorSignedAt: null } as unknown as HandoverRecord;
  const person = { fullName: "Trần An", ...recipient } as unknown as RecordRecipient;
  render(<SignatureParties record={record} recipient={person} />);
  const list = screen.getByRole("list", { name: "Chữ ký phần của Trần An" });
  return within(list).getAllByRole("listitem");
}

describe("dòng ký ba bên của một người nhận", () => {
  it("ba con dấu theo thứ tự luật sư, Người thực thi, người nhận; chỉ bên đã ký được đóng dấu", () => {
    const items = seals({ verifierSignedAt: AT, executorSignedAt: null, signedAt: null });
    expect(items.map((item) => item.getAttribute("data-signed"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    expect(items[0]).toHaveTextContent("Luật sư✓ đã ký");
    expect(items[1]).toHaveTextContent("Người thực thi– chưa ký");
    expect(items[2]).toHaveTextContent("Người nhận– chưa ký");
  });

  it("bên đã ký có thời điểm ký ở chú thích, bên chưa ký thì không", () => {
    const items = seals({ verifierSignedAt: AT, executorSignedAt: AT, signedAt: null });
    expect(items[0]).toHaveAttribute("title", expect.stringMatching(/^Đã ký /));
    expect(items[2]).not.toHaveAttribute("title");
  });
});
