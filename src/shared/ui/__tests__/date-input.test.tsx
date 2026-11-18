import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateInput, displayToIsoDate, formatTypedDate, isoToDisplayDate } from "../date-input";

afterEach(() => {
  cleanup();
});

describe("hàm đổi ngày", () => {
  it("isoToDisplayDate: yyyy-mm-dd sang dd/mm/yyyy, sai dạng thì rỗng", () => {
    expect(isoToDisplayDate("2006-07-30")).toBe("30/07/2006");
    expect(isoToDisplayDate("")).toBe("");
    expect(isoToDisplayDate("30/07/2006")).toBe("");
  });

  it("displayToIsoDate: chỉ nhận ngày có thật", () => {
    expect(displayToIsoDate("30/07/2006")).toBe("2006-07-30");
    expect(displayToIsoDate("29/02/2024")).toBe("2024-02-29");
    expect(displayToIsoDate("29/02/2023")).toBeNull();
    expect(displayToIsoDate("31/04/2020")).toBeNull();
    expect(displayToIsoDate("30/07/200")).toBeNull();
    expect(displayToIsoDate("00/07/2006")).toBeNull();
  });

  it("formatTypedDate: chèn dấu / khi gõ tiếp, bỏ ký tự không phải số, tối đa 8 số", () => {
    expect(formatTypedDate("3")).toBe("3");
    expect(formatTypedDate("30")).toBe("30");
    expect(formatTypedDate("300")).toBe("30/0");
    expect(formatTypedDate("3007")).toBe("30/07");
    expect(formatTypedDate("30072006")).toBe("30/07/2006");
    expect(formatTypedDate("30/07/2006999")).toBe("30/07/2006");
    expect(formatTypedDate("ab30-07")).toBe("30/07");
  });
});

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label>
        Ngày sinh
        <DateInput value={value} onChange={setValue} />
      </label>
      <output data-testid="iso">{value}</output>
      <button type="button" onClick={() => setValue("")}>
        Xóa
      </button>
    </>
  );
}

describe("DateInput", () => {
  it("hiện sẵn giá trị theo ngày/tháng/năm", () => {
    render(<Harness initial="2006-07-30" />);
    expect(screen.getByLabelText("Ngày sinh")).toHaveValue("30/07/2006");
  });

  it("gõ số liền nhau thì tự chèn dấu / và chỉ báo ngày yyyy-mm-dd khi đủ ngày thật", async () => {
    render(<Harness />);
    const input = screen.getByLabelText("Ngày sinh");
    await userEvent.type(input, "30072006");
    expect(input).toHaveValue("30/07/2006");
    expect(screen.getByTestId("iso")).toHaveTextContent("2006-07-30");
  });

  it("chưa đủ hoặc ngày không có thật thì báo rỗng, giữ nguyên chữ đang gõ", async () => {
    render(<Harness />);
    const input = screen.getByLabelText("Ngày sinh");
    await userEvent.type(input, "3007");
    expect(input).toHaveValue("30/07");
    expect(screen.getByTestId("iso")).toHaveTextContent("");

    await userEvent.clear(input);
    await userEvent.type(input, "31022000");
    expect(input).toHaveValue("31/02/2000");
    expect(screen.getByTestId("iso")).toHaveTextContent("");
  });

  it("xóa lùi qua dấu / được", async () => {
    render(<Harness initial="2006-07-30" />);
    const input = screen.getByLabelText("Ngày sinh");
    await userEvent.type(input, "{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}");
    expect(input).toHaveValue("30/0");
  });

  it("giá trị bên ngoài bị xóa (reset form) thì ô cũng trống", async () => {
    render(<Harness initial="2006-07-30" />);
    await userEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(screen.getByLabelText("Ngày sinh")).toHaveValue("");
  });

  it("dán thẳng 30/07/2006 hoặc đổi bằng sự kiện change đều được", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Ngày sinh");
    fireEvent.change(input, { target: { value: "30/07/2006" } });
    expect(screen.getByTestId("iso")).toHaveTextContent("2006-07-30");
  });
});
