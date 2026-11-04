import { useState } from "react";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import {
  CATALOG_KEY,
  DEFAULT_PERIODS,
  FREE_FEATURES_KEY,
  FREE_FEATURE_DEFAULTS,
  MAX_PLANS_TOTAL,
  PAID_PLANS,
  PERIODS_KEY,
  customPlanMeta,
  featuresKey,
  generatePlanCode,
  hiddenKey,
  nextPlanOrder,
  parseCustomPlans,
  parseFeatureLines,
  parsePeriods,
  perYearHint,
  priceKey,
  saleKey,
  serializeCustomPlans,
  serializeFeatureLines,
  serializePeriods,
  validateFeatureText,
  validateNewPeriod,
  validateNewPlanName,
  validateNewPlanSubtitle,
  MAX_PLAN_SUBTITLE,
  MAX_TIER_PRICE,
  type PaidPlanCode,
  type PaidPlanMeta,
  type PlanPeriod,
} from "../model/planCatalog";

interface PlanCatalogEditorProps {
  /** Đọc giá trị đang sửa (bản nháp trước, rồi tới máy chủ, rồi mặc định). */
  getValue: (key: string, defaultValue?: string) => string;
  /** Ghi vào bản nháp; chỉ lưu thật khi Admin bấm Lưu ở thanh phía dưới. */
  setKeyValue: (key: string, value: string) => void;
}

const money = new Intl.NumberFormat("vi-VN");
const NEEDS_ONE_PERIOD = "Phải còn ít nhất một kỳ đang bán.";

function parseMoney(text: string): number {
  const value = parseInt(text, 10);
  if (Number.isFinite(value)) return value;
  return 0;
}

/**
 * Bảng cấu hình gói: mỗi gói là một cột, mỗi kỳ bán là một dòng (bật/tắt, xóa, giá từng gói).
 * Xóa gói là ẩn: gói không còn bán, người đang dùng vẫn dùng đến hết kỳ, đơn và lịch sử cũ giữ nguyên.
 * Mọi chỉnh sửa chỉ vào bản nháp; việc xem lại và lưu do thanh "thay đổi chưa áp dụng" của trang xử lý.
 */
export function PlanCatalogEditor({ getValue, setKeyValue }: PlanCatalogEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState<PaidPlanCode | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanSubtitle, setNewPlanSubtitle] = useState("");
  const [planError, setPlanError] = useState("");
  const [newYears, setNewYears] = useState("");
  const [periodError, setPeriodError] = useState("");

  const periods = parsePeriods(getValue(PERIODS_KEY, serializePeriods(DEFAULT_PERIODS)));
  const customs = parseCustomPlans(getValue(CATALOG_KEY, "[]"));
  // Hai gói gốc rồi tới gói Admin tạo thêm theo thứ tự; xóa là ẩn nên cột chỉ biến khỏi bảng, cấu hình còn nguyên để khôi phục.
  const allPlans = [...PAID_PLANS, ...customs.map(customPlanMeta)];
  const visible = allPlans.filter((plan) => getValue(hiddenKey(plan.code), "false") !== "true");
  const hidden = allPlans.filter((plan) => getValue(hiddenKey(plan.code), "false") === "true");
  const deleting = allPlans.find((plan) => plan.code === confirmDelete);

  function savePeriods(next: PlanPeriod[]): void {
    setKeyValue(PERIODS_KEY, serializePeriods(next));
  }

  function togglePeriod(years: number): void {
    const next = periods.map((p) => (p.years === years ? { ...p, on: !p.on } : p));
    if (!next.some((p) => p.on)) {
      setPeriodError(NEEDS_ONE_PERIOD);
      return;
    }
    setPeriodError("");
    savePeriods(next);
  }

  function removePeriod(years: number): void {
    const next = periods.filter((p) => p.years !== years);
    if (!next.some((p) => p.on)) {
      setPeriodError(NEEDS_ONE_PERIOD);
      return;
    }
    setPeriodError("");
    savePeriods(next);
  }

  function addPeriod(): void {
    const years = Number(newYears);
    const problem = validateNewPeriod(years, periods);
    if (problem !== "") {
      setPeriodError(problem);
      return;
    }
    setPeriodError("");
    setNewYears("");
    savePeriods([...periods, { years, on: true }]);
  }

  function removePlan(code: PaidPlanCode): void {
    setKeyValue(hiddenKey(code), "true");
    setKeyValue(saleKey(code), "false");
    setConfirmDelete(null);
  }

  // Free luôn có; gói trả phí đã ẩn không tính vào giới hạn.
  const planCount = visible.length + 1;
  const atLimit = planCount >= MAX_PLANS_TOTAL;
  const limitMessage = `Tối đa ${MAX_PLANS_TOTAL} gói (tính cả Free). Xóa bớt một gói trước khi thêm hoặc khôi phục gói khác.`;

  function addPlan(): void {
    if (atLimit) {
      setPlanError(limitMessage);
      return;
    }
    const problem =
      validateNewPlanName(
        newPlanName,
        allPlans.map((plan) => plan.name),
      ) || validateNewPlanSubtitle(newPlanSubtitle);
    if (problem !== "") {
      setPlanError(problem);
      return;
    }
    const code = generatePlanCode(
      newPlanName,
      customs.map((plan) => plan.code),
    );
    const next = [
      ...customs,
      {
        code,
        name: newPlanName.trim(),
        subtitle: newPlanSubtitle.trim(),
        order: nextPlanOrder(customs),
      },
    ];
    setKeyValue(CATALOG_KEY, serializeCustomPlans(next));
    // Gói mới bắt đầu ở trạng thái tạm ngừng để Admin điền giá các kỳ rồi mới mở bán.
    setKeyValue(saleKey(code), "false");
    setKeyValue(`Plans.${code}.QuotaMb`, "100");
    setKeyValue(`Plans.${code}.Slots`, "1");
    setNewPlanName("");
    setNewPlanSubtitle("");
    setPlanError("");
    setShowRestore(false);
  }

  function restorePlan(code: PaidPlanCode): void {
    if (atLimit) {
      setPlanError(limitMessage);
      return;
    }
    setKeyValue(hiddenKey(code), "false");
    setShowRestore(false);
  }

  function priceOf(plan: PaidPlanMeta, years: number): string {
    return getValue(priceKey(plan.code, years), plan.priceDefaults[years] ?? "");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-heritage-primary">Gói dịch vụ</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10"
          onClick={() => setShowRestore((open) => !open)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Thêm gói
        </Button>
      </div>

      {showRestore && (
        <div
          role="status"
          className="rounded-xl border border-heritage-border bg-heritage-surface p-4 text-sm"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-heritage-primary">Tạo gói mới</p>
              <div className="flex flex-wrap items-start gap-3">
                <Input
                  type="text"
                  value={newPlanName}
                  placeholder="Tên gói, ví dụ Gold"
                  aria-label="Tên gói mới"
                  maxLength={40}
                  onChange={(event) => {
                    setNewPlanName(event.target.value);
                    setPlanError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addPlan();
                    }
                  }}
                  className="h-9 w-56"
                />
                <Input
                  type="text"
                  value={newPlanSubtitle}
                  placeholder="Phụ đề (không bắt buộc)"
                  aria-label="Phụ đề gói mới"
                  maxLength={MAX_PLAN_SUBTITLE}
                  onChange={(event) => setNewPlanSubtitle(event.target.value)}
                  className="h-9 w-56"
                />
                <Button type="button" size="sm" disabled={atLimit} onClick={addPlan}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tạo gói
                </Button>
              </div>
              {atLimit && planError === "" && (
                <p role="status" className="text-xs font-medium text-heritage-warning">
                  {limitMessage}
                </p>
              )}
              {planError !== "" && (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {planError}
                </p>
              )}
              <p className="text-xs text-heritage-muted">
                Gói mới đứng sau các gói hiện có (là gói cao hơn khi nâng hạng) và bắt đầu ở trạng
                thái tạm ngừng. Điền giá các kỳ, rồi bật Mở bán và lưu.
              </p>
            </div>
            {hidden.length > 0 && (
              <div className="space-y-2">
                <p className="text-heritage-muted">Gói đã xóa có thể khôi phục:</p>
                <div className="flex flex-wrap gap-2">
                  {hidden.map((plan) => (
                    <Button
                      key={plan.code}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => restorePlan(plan.code)}
                    >
                      Khôi phục gói {plan.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deleting && (
        <div
          role="alert"
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Xóa gói {deleting.name}?</p>
              <p className="mt-1 text-xs">
                Gói bị ẩn khỏi trang mua và không ai tạo thêm đơn mới. Người đang dùng vẫn dùng đến
                hết kỳ. Đơn và lịch sử cũ giữ nguyên. Thay đổi chỉ áp dụng sau khi bạn lưu.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(null)}
            >
              Giữ lại
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => removePlan(deleting.code)}
            >
              Xóa gói
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-heritage-border bg-heritage-primary/5">
                <th scope="col" className="p-4 font-semibold text-heritage-muted">
                  Thuộc tính
                </th>
                <th scope="col" className="p-4">
                  <b className="text-base text-heritage-primary">Free</b>
                  <span className="block text-xs text-heritage-muted">Mặc định, luôn mở</span>
                </th>
                {visible.map((plan) => (
                  <th key={plan.code} scope="col" className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <b className="text-base text-heritage-primary">{plan.name}</b>
                        <span className="block text-xs font-normal text-heritage-muted">
                          {plan.subtitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Xóa gói ${plan.name}`}
                        onClick={() => setConfirmDelete(plan.code)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-heritage-muted hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-heritage-border/60">
              <SectionRow span={2 + visible.length}>Trạng thái bán hàng</SectionRow>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Mở bán gói
                </th>
                <td className="p-4 text-xs font-semibold text-heritage-muted">Luôn mở</td>
                {visible.map((plan) => {
                  const on = getValue(saleKey(plan.code), "true") === "true";
                  return (
                    <td key={plan.code} className="p-4">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={on}
                          onCheckedChange={(checked) =>
                            setKeyValue(saleKey(plan.code), checked ? "true" : "false")
                          }
                          aria-label={`Mở bán gói ${plan.name}`}
                        />
                        <span
                          className={`text-xs font-semibold ${on ? "text-green-800" : "text-zinc-500"}`}
                        >
                          {on ? "Đang bán" : "Tạm ngừng"}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              <SectionRow span={2 + visible.length}>Giá theo kỳ (VNĐ)</SectionRow>
              {periods.map((period) => (
                <tr key={period.years}>
                  <th scope="row" className="p-4 font-medium">
                    <div>{period.years} năm</div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <Switch
                        checked={period.on}
                        onCheckedChange={() => togglePeriod(period.years)}
                        aria-label={`Bán kỳ ${period.years} năm`}
                      />
                      <span
                        className={`text-xs font-semibold ${period.on ? "text-green-800" : "text-zinc-500"}`}
                      >
                        {period.on ? "Đang bán" : "Tạm ngừng"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePeriod(period.years)}
                        className="text-xs font-semibold text-heritage-muted underline underline-offset-4 hover:text-red-700"
                        aria-label={`Xóa kỳ ${period.years} năm`}
                      >
                        Xóa
                      </button>
                    </div>
                  </th>
                  <td className="p-4 text-xs font-semibold text-heritage-muted">0 VND</td>
                  {visible.map((plan) => {
                    const value = priceOf(plan, period.years);
                    const missing = period.on && parseMoney(value) <= 0;
                    const tooHigh = parseMoney(value) > MAX_TIER_PRICE;
                    const hint = perYearHint(
                      parseMoney(priceOf(plan, 1)),
                      parseMoney(value),
                      period.years,
                    );
                    return (
                      <td key={plan.code} className="p-4">
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={value}
                            aria-label={`Giá gói ${plan.name} kỳ ${period.years} năm`}
                            aria-invalid={missing || tooHigh}
                            onChange={(event) =>
                              setKeyValue(
                                priceKey(plan.code, period.years),
                                event.target.value.replace(/\D/g, ""),
                              )
                            }
                            className={`h-9 w-28 font-mono text-sm font-semibold ${missing || tooHigh ? "border-red-400" : ""}`}
                          />
                          <span className="text-xs text-heritage-muted">đ</span>
                        </div>
                        {missing && (
                          <span className="mt-1 block text-[11px] text-red-700">Chưa có giá</span>
                        )}
                        {tooHigh && (
                          <span role="alert" className="mt-1 block text-[11px] text-red-700">
                            Tối đa {money.format(MAX_TIER_PRICE)}đ mỗi kỳ
                          </span>
                        )}
                        {hint && (
                          <span className="mt-1 block text-[11px] text-green-700">
                            ≈ {money.format(hint.perYear)}đ/năm
                            {hint.savePercent > 0 ? ` · rẻ hơn ${hint.savePercent}%` : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td colSpan={2 + visible.length} className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={newYears}
                      placeholder="Số năm"
                      aria-label="Số năm của kỳ mới"
                      onChange={(event) => {
                        setNewYears(event.target.value.replace(/\D/g, ""));
                        setPeriodError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addPeriod();
                        }
                      }}
                      className="h-9 w-28"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addPeriod}>
                      <Plus className="size-4" aria-hidden="true" />
                      Thêm kỳ bán
                    </Button>
                    {periodError !== "" && (
                      <span role="alert" className="text-xs font-medium text-red-700">
                        {periodError}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              <SectionRow span={2 + visible.length}>Hạn mức tài nguyên</SectionRow>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Dung lượng kho
                </th>
                <td className="p-4">
                  <QuotaInput
                    label="Dung lượng gói Free"
                    unit="MiB"
                    value={getValue("Plans.Free.QuotaMb", "20")}
                    onChange={(next) => setKeyValue("Plans.Free.QuotaMb", next)}
                  />
                </td>
                {visible.map((plan) => (
                  <td key={plan.code} className="p-4">
                    <QuotaInput
                      label={`Dung lượng gói ${plan.name}`}
                      unit="MiB"
                      value={getValue(`Plans.${plan.code}.QuotaMb`, plan.quotaDefault)}
                      onChange={(next) => setKeyValue(`Plans.${plan.code}.QuotaMb`, next)}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Suất người nhận kèm
                </th>
                <td className="p-4">
                  <QuotaInput
                    label="Suất người nhận gói Free"
                    unit="người"
                    value={getValue("Plans.Free.Slots", "0")}
                    onChange={(next) => setKeyValue("Plans.Free.Slots", next)}
                  />
                </td>
                {visible.map((plan) => (
                  <td key={plan.code} className="p-4">
                    <QuotaInput
                      label={`Suất người nhận gói ${plan.name}`}
                      unit="người"
                      value={getValue(`Plans.${plan.code}.Slots`, plan.slotsDefault)}
                      onChange={(next) => setKeyValue(`Plans.${plan.code}.Slots`, next)}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="p-4 font-medium">
                  Số gói bàn giao tối đa
                </th>
                <td className="p-4">
                  <QuotaInput
                    label="Số gói bàn giao tối đa gói Free"
                    unit="gói"
                    value={getValue("Plans.Free.MaxPackages", "50")}
                    onChange={(next) => setKeyValue("Plans.Free.MaxPackages", next)}
                  />
                </td>
                {visible.map((plan) => (
                  <td key={plan.code} className="p-4">
                    <QuotaInput
                      label={`Số gói bàn giao tối đa gói ${plan.name}`}
                      unit="gói"
                      value={getValue(`Plans.${plan.code}.MaxPackages`, "50")}
                      onChange={(next) => setKeyValue(`Plans.${plan.code}.MaxPackages`, next)}
                    />
                  </td>
                ))}
              </tr>

              <SectionRow span={2 + visible.length}>Mô tả tính năng trên thẻ gói</SectionRow>
              <tr>
                <th scope="row" className="p-4 align-top font-medium">
                  Mỗi dòng một tính năng
                  <span className="mt-1 block text-xs font-normal text-heritage-muted">
                    Hiện trên thẻ gói của chủ kho. Tối đa 8 dòng, mỗi dòng 120 ký tự.
                  </span>
                </th>
                <td className="p-4 align-top">
                  <FeatureBox
                    label="Mô tả tính năng gói Free"
                    storageKey={FREE_FEATURES_KEY}
                    defaults={FREE_FEATURE_DEFAULTS}
                    getValue={getValue}
                    setKeyValue={setKeyValue}
                  />
                </td>
                {visible.map((plan) => (
                  <td key={plan.code} className="p-4 align-top">
                    <FeatureBox
                      label={`Mô tả tính năng gói ${plan.name}`}
                      storageKey={featuresKey(plan.code)}
                      defaults={plan.featureDefaults}
                      getValue={getValue}
                      setKeyValue={setKeyValue}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionRow({ span, children }: { span: number; children: string }) {
  return (
    <tr className="bg-zinc-50/50">
      <td
        colSpan={span}
        className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-heritage-muted"
      >
        {children}
      </td>
    </tr>
  );
}

function QuotaInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex w-32 items-center rounded-lg border border-heritage-border bg-white shadow-sm">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="h-8 w-full min-w-0 bg-transparent px-2 text-center font-mono text-xs font-semibold focus:outline-none"
      />
      <span className="border-l border-zinc-200 px-2 text-[11px] text-heritage-muted">{unit}</span>
    </div>
  );
}

/** Ô nhập mô tả tính năng của một gói: mỗi dòng một tính năng, lưu vào bản nháp dưới dạng JSON. */
function FeatureBox({
  label,
  storageKey,
  defaults,
  getValue,
  setKeyValue,
}: {
  label: string;
  storageKey: string;
  defaults: readonly string[];
  getValue: (key: string, defaultValue?: string) => string;
  setKeyValue: (key: string, value: string) => void;
}) {
  const lines = parseFeatureLines(getValue(storageKey, JSON.stringify(defaults)), defaults);
  const text = lines.join("\n");
  const problem = validateFeatureText(text);
  return (
    <div className="space-y-1">
      <Textarea
        value={text}
        rows={5}
        aria-label={label}
        aria-invalid={problem !== ""}
        onChange={(event) => setKeyValue(storageKey, serializeFeatureLines(event.target.value))}
        className="min-w-44 text-sm"
      />
      {problem !== "" && (
        <p role="alert" className="text-[11px] text-red-700">
          {problem}
        </p>
      )}
    </div>
  );
}
