import { useState, type ReactNode } from "react";
import { Check, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import {
  CATALOG_KEY,
  DEFAULT_PERIODS,
  FREE_FEATURES_KEY,
  FREE_FEATURE_DEFAULTS,
  MAX_FEATURE_LENGTH,
  MAX_FEATURE_LINES,
  MAX_TIER_PRICE,
  PAID_PLANS,
  PERIODS_KEY,
  customPlanMeta,
  featuresKey,
  hiddenKey,
  parseCustomPlans,
  parseFeatureLines,
  parsePeriods,
  perYearHint,
  priceKey,
  saleKey,
  serializeFeatureLines,
  serializePeriods,
  type PaidPlanMeta,
  type PlanPeriod,
} from "../model/planCatalog";

interface PlanCardsProps {
  /** Đọc giá trị đang sửa (bản nháp trước, rồi tới máy chủ, rồi mặc định). */
  getValue: (key: string, defaultValue?: string) => string;
  /** Ghi vào bản nháp; chỉ lưu thật khi Admin bấm Lưu ở thanh phía dưới. */
  setKeyValue: (key: string, value: string) => void;
}

const money = new Intl.NumberFormat("vi-VN");

function formatMoney(text: string): string {
  const value = parseInt(text, 10);
  return Number.isFinite(value) ? `${money.format(value)}đ` : "Chưa có giá";
}

function formatQuota(text: string): string {
  const value = parseInt(text, 10);
  return Number.isFinite(value) ? `${money.format(value)} MiB` : "—";
}

/** Mọi thứ một thẻ gói cần để vẽ cả hai chế độ: xem và sửa tại chỗ. */
interface PlanModel {
  code: string;
  name: string;
  subtitle: string;
  free: boolean;
  quotaKey: string;
  slotsKey: string | null;
  packagesKey: string;
  featuresKey: string;
  featureDefaults: readonly string[];
  saleKey: string | null;
  quotaDefault: string;
  slotsDefault: string;
  priceDefaults: Record<number, string>;
}

const FREE_PLAN: PlanModel = {
  code: "Free",
  name: "Free",
  subtitle: "Mặc định, luôn bật",
  free: true,
  quotaKey: "Plans.Free.QuotaMb",
  slotsKey: null,
  packagesKey: "Plans.Free.MaxPackages",
  featuresKey: FREE_FEATURES_KEY,
  featureDefaults: FREE_FEATURE_DEFAULTS,
  saleKey: null,
  quotaDefault: "20",
  slotsDefault: "0",
  priceDefaults: {},
};

function paidModel(plan: PaidPlanMeta): PlanModel {
  return {
    code: plan.code,
    name: plan.name,
    subtitle: plan.subtitle,
    free: false,
    quotaKey: `Plans.${plan.code}.QuotaMb`,
    slotsKey: `Plans.${plan.code}.Slots`,
    packagesKey: `Plans.${plan.code}.MaxPackages`,
    featuresKey: featuresKey(plan.code),
    featureDefaults: plan.featureDefaults,
    saleKey: saleKey(plan.code),
    quotaDefault: plan.quotaDefault,
    slotsDefault: plan.slotsDefault,
    priceDefaults: plan.priceDefaults,
  };
}

/**
 * Các gói theo prototype: mỗi gói một thẻ; bấm "Sửa gói" thì chính thẻ mở ra để sửa giá từng kỳ, dung lượng,
 * số người nhận, số gói bàn giao và tính năng, bấm "Xong" để thu lại. Chỉ ghi vào bản nháp, lưu thật ở thanh phía dưới.
 */
export function PlanCards({ getValue, setKeyValue }: PlanCardsProps) {
  const allPeriods = parsePeriods(getValue(PERIODS_KEY, serializePeriods(DEFAULT_PERIODS)));
  const customs = parseCustomPlans(getValue(CATALOG_KEY, "[]"));
  const paid = [...PAID_PLANS, ...customs.map(customPlanMeta)].filter(
    (plan) => getValue(hiddenKey(plan.code), "false") !== "true",
  );

  const togglePeriod = (years: number) => {
    const next = allPeriods.map((period) =>
      period.years === years ? { ...period, on: !period.on } : period,
    );
    // Luôn phải còn ít nhất một kỳ đang bán.
    if (!next.some((period) => period.on)) return;
    setKeyValue(PERIODS_KEY, serializePeriods(next));
  };

  return (
    <div className="space-y-4">
      <section
        aria-label="Kỳ bán"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-heritage-border bg-white px-5 py-3 shadow-sm"
      >
        <h3 className="text-base font-bold text-heritage-primary">Kỳ bán</h3>
        <span className="text-xs text-heritage-muted">Áp dụng cho mọi gói trả phí</span>
        {allPeriods.map((period) => (
          <label
            key={period.years}
            className="flex items-center gap-2 rounded-xl border border-heritage-border px-3 py-1.5 text-sm font-semibold"
          >
            {period.years} năm
            <Switch
              checked={period.on}
              aria-label={`Bán kỳ ${period.years} năm`}
              onCheckedChange={() => togglePeriod(period.years)}
            />
            <span className={`text-xs ${period.on ? "text-emerald-800" : "text-heritage-muted"}`}>
              {period.on ? "Đang bán" : "Tạm ngừng"}
            </span>
          </label>
        ))}
      </section>
      <section
        aria-label="Các gói đang cấu hình"
        className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <PlanCard
          model={FREE_PLAN}
          periods={allPeriods}
          getValue={getValue}
          setKeyValue={setKeyValue}
        />
        {paid.map((plan) => (
          <PlanCard
            key={plan.code}
            model={paidModel(plan)}
            periods={allPeriods}
            getValue={getValue}
            setKeyValue={setKeyValue}
          />
        ))}
      </section>
    </div>
  );
}

function PlanCard({
  model,
  periods,
  getValue,
  setKeyValue,
}: {
  model: PlanModel;
  periods: PlanPeriod[];
  getValue: PlanCardsProps["getValue"];
  setKeyValue: PlanCardsProps["setKeyValue"];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selling = model.saleKey ? getValue(model.saleKey, "true") !== "false" : true;
  const priceOf = (years: number) =>
    getValue(priceKey(model.code, years), model.priceDefaults[years] ?? "");
  const features = parseFeatureLines(getValue(model.featuresKey, ""), model.featureDefaults);
  const shown = features.map((line) => line.trim()).filter(Boolean);
  const onPeriods = periods.filter((period) => period.on);
  const first = onPeriods[0];
  const slots = model.slotsKey ? getValue(model.slotsKey, model.slotsDefault) : model.slotsDefault;

  const removePlan = () => {
    setKeyValue(hiddenKey(model.code), "true");
    setKeyValue(saleKey(model.code), "false");
  };

  const header = (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold text-heritage-primary">
          {model.name}
          {model.free && (
            <span className="rounded-xl bg-[#e5ede8] px-2 py-0.5 text-xs font-semibold">
              Mặc định
            </span>
          )}
        </h3>
        <p className="text-[12.5px] text-heritage-muted">{model.subtitle}</p>
      </div>
      {model.saleKey && (
        <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Switch
            checked={selling}
            aria-label={`Bán gói ${model.name}`}
            onCheckedChange={(next) => setKeyValue(model.saleKey!, next ? "true" : "false")}
          />
          {selling ? "Đang bán" : "Tạm ngừng"}
        </label>
      )}
    </header>
  );

  if (!editing) {
    return (
      <article className="flex flex-col gap-3 rounded-2xl border border-heritage-border bg-white p-5 shadow-sm">
        {header}
        {model.free ? (
          <div>
            <b className="text-[28px] font-bold leading-none text-heritage-primary">0đ</b>
            <small className="mt-1 block text-xs text-heritage-muted">
              Miễn phí, không cần mua
            </small>
          </div>
        ) : (
          <div>
            <b className="text-[28px] font-bold leading-none tabular-nums text-heritage-primary">
              {first ? formatMoney(priceOf(first.years)) : "—"}
            </b>
            {first && (
              <small className="mt-1 block text-xs text-heritage-muted">
                cho {first.years} năm
              </small>
            )}
            {onPeriods.length > 1 && (
              <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-heritage-muted">
                {onPeriods.slice(1).map((period) => (
                  <span key={period.years}>
                    {period.years} năm{" "}
                    <b className="tabular-nums text-heritage-text">
                      {formatMoney(priceOf(period.years))}
                    </b>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
        <dl className="grid grid-cols-3 gap-2 border-t border-heritage-border pt-3 text-xs">
          <Fact
            label="Dung lượng"
            value={formatQuota(getValue(model.quotaKey, model.quotaDefault))}
          />
          <Fact
            label={model.free ? "Người nhận" : "Người nhận kèm gói"}
            value={model.free ? "0 · không kích hoạt" : `${slots} người`}
          />
          <Fact label="Số gói bàn giao" value={`${getValue(model.packagesKey, "50")} gói`} />
        </dl>
        <ul className="space-y-1.5 border-t border-heritage-border pt-3 text-sm">
          {shown.length === 0 ? (
            <li className="flex items-center gap-2 text-heritage-muted">
              <Minus className="size-4" aria-hidden="true" />
              Chưa có mô tả tính năng
            </li>
          ) : (
            shown.map((feature, index) => (
              <li
                key={`${index}-${feature}`}
                className={`flex items-start gap-2 ${model.free && index > 0 ? "text-heritage-muted" : ""}`}
              >
                {model.free && index > 0 ? (
                  <Minus className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                )}
                {feature}
              </li>
            ))
          )}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-expanded={false}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-heritage-border px-3 text-sm font-semibold hover:bg-[#e5ede8]"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Sửa gói
          </button>
          {!model.free && (
            <DeleteLink
              confirming={confirmDelete}
              onAsk={() => setConfirmDelete(true)}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={removePlan}
            />
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      aria-label={`Sửa gói ${model.name}`}
      className="flex flex-col gap-4 rounded-2xl border border-heritage-gold bg-white p-5 shadow-sm"
    >
      {header}
      {model.free ? (
        <div>
          <b className="text-[28px] font-bold leading-none text-heritage-primary">0đ</b>
          <small className="mt-1 block text-xs text-heritage-muted">Miễn phí, không cần mua</small>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <PriceField
              key={period.years}
              planCode={model.code}
              period={period}
              value={priceOf(period.years)}
              oneYear={priceOf(periods[0]?.years ?? 1)}
              onChange={(next) => setKeyValue(priceKey(model.code, period.years), next)}
            />
          ))}
        </div>
      )}
      <div className="space-y-3 border-t border-heritage-border pt-4">
        <Stepper
          label="Dung lượng"
          unit="MiB"
          step={50}
          value={getValue(model.quotaKey, model.quotaDefault)}
          onChange={(next) => setKeyValue(model.quotaKey, next)}
          idPrefix={model.code}
        />
        {model.free ? (
          <div>
            <span className="text-sm font-semibold text-heritage-muted">Người nhận</span>
            <p className="mt-1 rounded-xl border border-heritage-border px-3 py-2.5 text-sm text-heritage-muted">
              0 người · không kích hoạt
            </p>
          </div>
        ) : (
          <Stepper
            label="Người nhận kèm gói"
            unit="người"
            step={1}
            value={slots}
            onChange={(next) => setKeyValue(model.slotsKey!, next)}
            idPrefix={model.code}
          />
        )}
        <Stepper
          label="Số gói bàn giao tối đa"
          unit="gói"
          step={5}
          value={getValue(model.packagesKey, "50")}
          onChange={(next) => setKeyValue(model.packagesKey, next)}
          idPrefix={model.code}
        />
      </div>
      <FeatureEditor
        lines={features}
        free={model.free}
        onChange={(lines) =>
          setKeyValue(model.featuresKey, serializeFeatureLines(lines.join("\n")))
        }
        planName={model.name}
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-expanded
          className="inline-flex min-h-10 items-center rounded-lg bg-heritage-primary px-5 text-sm font-semibold text-white hover:bg-[#133e2f]"
        >
          Xong
        </button>
        {!model.free && (
          <DeleteLink
            confirming={confirmDelete}
            onAsk={() => setConfirmDelete(true)}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={removePlan}
          />
        )}
      </div>
    </article>
  );
}

/** "Xóa gói" hai bước: bấm lần đầu hỏi lại, xác nhận thì ẩn gói (người đang dùng vẫn dùng hết kỳ). */
function DeleteLink({
  confirming,
  onAsk,
  onCancel,
  onConfirm,
}: {
  confirming: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (confirming) {
    return (
      <span className="flex items-center gap-3 text-sm">
        <button type="button" onClick={onConfirm} className="font-semibold text-red-800 underline">
          Xác nhận xóa
        </button>
        <button type="button" onClick={onCancel} className="text-heritage-muted underline">
          Hủy
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onAsk}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-800 underline"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      Xóa gói
    </button>
  );
}

/** Ô giá một kỳ kèm đơn vị đ, và dòng "≈ giá/năm · rẻ hơn x%" so với mua lẻ từng năm. */
function PriceField({
  planCode,
  period,
  value,
  oneYear,
  onChange,
}: {
  planCode: string;
  period: PlanPeriod;
  value: string;
  oneYear: string;
  onChange: (next: string) => void;
}) {
  const number = parseInt(value, 10);
  const tooBig = Number.isFinite(number) && number > MAX_TIER_PRICE;
  const hint = perYearHint(parseInt(oneYear, 10), number, period.years);
  const id = `price-${planCode}-${period.years}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-heritage-muted">
        {period.years} năm{period.on ? "" : " · ngừng bán"}
      </label>
      <div className="mt-1 flex overflow-hidden rounded-xl border border-heritage-border focus-within:border-heritage-gold">
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          className="min-w-0 flex-1 px-3 py-2.5 text-center text-lg font-bold tabular-nums outline-none"
        />
        <span className="grid w-12 place-items-center border-l border-heritage-border text-heritage-muted">
          đ
        </span>
      </div>
      {tooBig && (
        <small role="alert" className="mt-1 block text-xs text-red-800">
          Giá mỗi kỳ tối đa {money.format(MAX_TIER_PRICE)}đ.
        </small>
      )}
      {hint && !tooBig && (
        <small className="mt-1 block text-xs text-heritage-muted">
          ≈ {money.format(hint.perYear)}đ/năm · rẻ hơn {hint.savePercent}%
        </small>
      )}
    </div>
  );
}

/** Ô số có nút − và + (bước theo từng loại hạn mức) và đơn vị bên phải, như prototype. */
function Stepper({
  label,
  unit,
  step,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  unit: string;
  step: number;
  value: string;
  onChange: (next: string) => void;
  idPrefix: string;
}) {
  const number = parseInt(value, 10);
  const current = Number.isFinite(number) ? number : 0;
  const set = (next: number) => onChange(String(Math.max(0, next)));
  const id = `stepper-${idPrefix}-${label}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-heritage-muted">
        {label}
      </label>
      <div className="mt-1 flex overflow-hidden rounded-xl border border-heritage-border focus-within:border-heritage-gold">
        <button
          type="button"
          aria-label={`Giảm ${label}`}
          onClick={() => set(current - step)}
          className="grid w-10 place-items-center border-r border-heritage-border text-lg font-bold hover:bg-[#e5ede8]"
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          className="min-w-0 flex-1 px-3 py-2.5 text-center text-base font-bold tabular-nums outline-none"
        />
        <button
          type="button"
          aria-label={`Tăng ${label}`}
          onClick={() => set(current + step)}
          className="grid w-10 place-items-center border-l border-heritage-border text-lg font-bold hover:bg-[#e5ede8]"
        >
          +
        </button>
        <span className="grid min-w-14 place-items-center border-l border-heritage-border px-3 text-sm text-heritage-muted">
          {unit}
        </span>
      </div>
    </div>
  );
}

/** Danh sách tính năng trên thẻ: mỗi dòng một ô nhập có nút xóa, đếm n/8, nút "Thêm dòng". */
function FeatureEditor({
  lines,
  free,
  onChange,
  planName,
}: {
  lines: string[];
  free: boolean;
  onChange: (lines: string[]) => void;
  planName: string;
}): ReactNode {
  const filled = lines.map((line) => line.trim()).filter(Boolean).length;
  const tooLong = lines.some((line) => line.trim().length > MAX_FEATURE_LENGTH);
  return (
    <div className="space-y-2 border-t border-heritage-border pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-heritage-muted">Tính năng trên thẻ</span>
        <span className="text-sm tabular-nums text-heritage-muted">
          {filled}/{MAX_FEATURE_LINES}
        </span>
      </div>
      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li key={index} className="flex items-center gap-2">
            {free && index > 0 ? (
              <Minus className="size-4 shrink-0 text-heritage-muted" aria-hidden="true" />
            ) : (
              <Check className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
            )}
            <input
              value={line}
              maxLength={MAX_FEATURE_LENGTH + 20}
              placeholder="Một tính năng"
              aria-label={`Tính năng ${index + 1} của gói ${planName}`}
              onChange={(event) =>
                onChange(lines.map((item, i) => (i === index ? event.target.value : item)))
              }
              className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm outline-none hover:border-heritage-border focus:border-heritage-gold"
            />
            <button
              type="button"
              aria-label={`Xóa dòng ${index + 1}`}
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
              className="grid size-7 shrink-0 place-items-center rounded-md text-heritage-muted hover:bg-[#e8e5dd]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {lines.length < MAX_FEATURE_LINES && (
        <button
          type="button"
          onClick={() => onChange([...lines, ""])}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7a5a22] underline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Thêm dòng
        </button>
      )}
      {tooLong && (
        <small role="alert" className="block text-xs text-red-800">
          Mỗi dòng tối đa {MAX_FEATURE_LENGTH} ký tự.
        </small>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-heritage-muted">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
