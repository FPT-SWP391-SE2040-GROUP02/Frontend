import { describe, expect, it } from "vitest";
import { limitOf, settingErrors, settingRelationErrors, settingValueError } from "../settingRules";

describe("settingValueError", () => {
  it("giá trị trong khoảng thì không lỗi", () => {
    expect(settingValueError("CheckIn.MaxLateReminders", "3")).toBe("");
    expect(settingValueError("CheckIn.MaxLateReminders", " 5 ")).toBe("");
    expect(settingValueError("CheckIn.FirstReminderDaysBeforeDue", "60")).toBe("");
  });

  it("ngoài khoảng thì nói rõ khoảng hợp lệ", () => {
    expect(settingValueError("CheckIn.MaxLateReminders", "0")).toBe("Phải từ 1 đến 5.");
    expect(settingValueError("CheckIn.MaxLateReminders", "6")).toBe("Phải từ 1 đến 5.");
    expect(settingValueError("CheckIn.FirstReminderDaysBeforeDue", "61")).toBe("Phải từ 2 đến 60.");
    expect(settingValueError("Security.PinLockoutMinutes", "99999")).toBe("Phải từ 1 đến 1440.");
  });

  it("không phải số nguyên không âm thì báo lỗi", () => {
    expect(settingValueError("CheckIn.MaxLateReminders", "")).toBe("Phải là số nguyên không âm.");
    expect(settingValueError("CheckIn.MaxLateReminders", "abc")).toBe(
      "Phải là số nguyên không âm.",
    );
    expect(settingValueError("CheckIn.MaxLateReminders", "2.5")).toBe(
      "Phải là số nguyên không âm.",
    );
    expect(settingValueError("CheckIn.MaxLateReminders", "-1")).toBe("Phải là số nguyên không âm.");
  });

  it("số điện thoại công ty: chặn chữ và số quá ngắn hoặc quá dài, cho để trống", () => {
    for (const ok of [
      "1900 0000",
      "0901 234 567",
      "090.123.4567",
      "+84 901 234 567",
      "(028) 3822-1234",
      "",
    ]) {
      expect(settingValueError("Company.Phone", ok)).toBe("");
    }
    for (const bad of ["abc", "1234567", "12345678901234567", "0901 abc 567", "0901+234567"]) {
      expect(settingValueError("Company.Phone", bad)).toMatch(/^Số điện thoại không hợp lệ/);
    }
  });

  it("chữ của công ty: giới hạn độ dài và dạng email", () => {
    expect(settingValueError("Company.Name", "a".repeat(101))).toBe("Tối đa 100 ký tự.");
    expect(settingValueError("Company.Email", "ho-tro@legacyvault.vn")).toBe("");
    expect(settingValueError("Company.Email", "")).toBe("");
    expect(settingValueError("Company.Email", "khong-phai-email")).toBe("Không đúng dạng email.");
    expect(settingValueError("Company.Email", "co khoang@x.vn")).toBe("Không đúng dạng email.");
  });

  it("khóa không có luật (Plans.*, khóa lạ) thì bỏ qua", () => {
    expect(settingValueError("Plans.Xs.Price1Y", "abc")).toBe("");
    expect(settingValueError("Khoa.La", "bat-ky")).toBe("");
    expect(limitOf("Khoa.La")).toBeNull();
    expect(limitOf("CheckIn.MaxLateReminders")).toEqual({ min: 1, max: 5 });
  });
});

describe("settingRelationErrors", () => {
  function valuesOf(map: Record<string, string>) {
    return (key: string): string | undefined => map[key];
  }

  it("mặc định hợp lệ", () => {
    expect(settingRelationErrors(valuesOf({}))).toEqual({});
  });

  it("thư nhắc thứ nhất phải xa hạn hơn thư thứ hai, báo lỗi cho cả hai ô", () => {
    const errors = settingRelationErrors(
      valuesOf({
        "CheckIn.FirstReminderDaysBeforeDue": "3",
        "CheckIn.SecondReminderDaysBeforeDue": "3",
      }),
    );

    expect(errors["CheckIn.FirstReminderDaysBeforeDue"]).toContain("xa hạn hơn");
    expect(errors["CheckIn.SecondReminderDaysBeforeDue"]).toContain("gần hạn hơn");
  });

  it("hai ngày khác nhau và đúng thứ tự thì hợp lệ", () => {
    const errors = settingRelationErrors(
      valuesOf({
        "CheckIn.FirstReminderDaysBeforeDue": "3",
        "CheckIn.SecondReminderDaysBeforeDue": "2",
      }),
    );

    expect(errors).toEqual({});
  });

  it("giờ báo sự cố lên Admin phải sau giờ nhắc người phụ trách", () => {
    const errors = settingRelationErrors(
      valuesOf({ "Incident.ReminderAfterHours": "72", "Incident.EscalateAfterHours": "48" }),
    );

    expect(Object.keys(errors)).toEqual(["Incident.EscalateAfterHours"]);
  });

  it("giờ nhắc lời mời Người thực thi phải sớm hơn hạn lời mời", () => {
    const errors = settingRelationErrors(
      valuesOf({ "Executor.InvitationExpiresDays": "1", "Executor.ReminderAfterHours": "30" }),
    );

    expect(errors["Executor.ReminderAfterHours"]).toContain("24 giờ");
  });
});

describe("settingErrors", () => {
  it("chỉ kiểm cặp khi Admin vừa sửa một khóa của cặp đó", () => {
    // Dữ liệu trên máy chủ đang lệch cặp nhưng Admin chỉ sửa một khóa không liên quan: không chặn.
    const errors = settingErrors({ "CheckIn.MaxLateReminders": "4" }, (key) => {
      if (key === "CheckIn.FirstReminderDaysBeforeDue") return "1";
      if (key === "CheckIn.SecondReminderDaysBeforeDue") return "1";
      return undefined;
    });

    expect(errors).toEqual({});
  });

  it("sửa một khóa của cặp làm cặp lệch thì báo lỗi", () => {
    const errors = settingErrors({ "CheckIn.FirstReminderDaysBeforeDue": "1" }, (key) => {
      if (key === "CheckIn.FirstReminderDaysBeforeDue") return "1";
      return undefined;
    });

    expect(errors["CheckIn.FirstReminderDaysBeforeDue"]).toBeDefined();
  });

  it("lỗi riêng của giá trị được ưu tiên hơn lỗi theo cặp", () => {
    const errors = settingErrors({ "CheckIn.FirstReminderDaysBeforeDue": "abc" }, () => undefined);

    expect(errors["CheckIn.FirstReminderDaysBeforeDue"]).toBe("Phải là số nguyên không âm.");
  });

  it("tham số bị tắt không bị kiểm giá trị nhưng vẫn tính lại cặp theo mức gốc", () => {
    const errors = settingErrors({ "CheckIn.SecondReminderDaysBeforeDue": null }, () => undefined);

    expect(errors).toEqual({});
  });
});
