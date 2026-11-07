import { Check, Minus } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import {
  CATALOG_KEY,
  DEFAULT_PERIODS,
  FREE_FEATURES_KEY,
  FREE_FEATURE_DEFAULTS,
  PAID_PLANS,
  PERIODS_KEY,
  customPlanMeta,
  featuresKey,
  hiddenKey,
  parseCustomPlans,
  parseFeatureLines,
  parsePeriods,
  priceKey,
  saleKey,
  serializePeriods,
  type PaidPlanMeta,
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
  return Number.isFinite(value) ? `${money.format(value)}đ` : "—";
}

/** Dung lượng "200" (MiB) hiện kèm đơn vị. */
function formatQuota(text: string): string {
  const value = parseInt(text, 10);
  return Number.isFinite(value) ? `${money.format(value)} MiB` : "—";
}

/**
 * Tổng quan gói theo prototype: mỗi gói một thẻ có tên, nhãn, bật/tắt bán, giá kỳ ngắn nhất, các kỳ còn lại,
 * dung lượng, số người nhận và tính năng. Chỉnh chi tiết (giá, hạn mức, kỳ, thêm hoặc xóa gói) nằm ở bảng phía dưới.
 */
export function PlanCards({ getValue, setKeyValue }: PlanCardsProps) {
  const periods = parsePeriods(getValue(PERIODS_KEY, serializePeriods(DEFAULT_PERIODS))).filter(
    (period) => period.on,
  );
  const customs = parseCustomPlans(getValue(CATALOG_KEY, "[]"));
  const paid = [...PAID_PLANS, ...customs.map(customPlanMeta)].filter(
    (plan) => getValue(hiddenKey(plan.code), "false") !== "true",
  );
  const shortest = periods[0]?.years;
  const others = periods.slice(1);

  return (
    <section
      aria-label="Các gói đang cấu hình"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <PlanCard
        name="Free"
        subtitle={`Mặc định, luôn bật · ${getValue("Plans.Free.Slots", "0")} người nhận`}
        badge="Mặc định"
        price="0đ"
        priceNote="Miễn phí, không cần mua"
        extraPrices={[]}
        quota={formatQuota(getValue("Plans.Free.QuotaMb", "20"))}
        slots={getValue("Plans.Free.Slots", "0")}
        packages={getValue("Plans.Free.MaxPackages", "")}
        features={parseFeatureLines(getValue(FREE_FEATURES_KEY, ""), FREE_FEATURE_DEFAULTS)}
      />
      {paid.map((plan) => (
        <PaidPlanCard
          key={plan.code}
          plan={plan}
          getValue={getValue}
          setKeyValue={setKeyValue}
          shortest={shortest}
          others={others.map((period) => period.years)}
        />
      ))}
    </section>
  );
}

function PaidPlanCard({
  plan,
  getValue,
  setKeyValue,
  shortest,
  others,
}: {
  plan: PaidPlanMeta;
  getValue: PlanCardsProps["getValue"];
  setKeyValue: PlanCardsProps["setKeyValue"];
  shortest: number | undefined;
  others: number[];
}) {
  const selling = getValue(saleKey(plan.code), "true") !== "false";
  const priceOf = (years: number) =>
    getValue(priceKey(plan.code, years), plan.priceDefaults[years] ?? "");
  return (
    <PlanCard
      name={plan.name}
      subtitle={plan.subtitle}
      price={shortest === undefined ? "—" : formatMoney(priceOf(shortest))}
      priceNote={shortest === undefined ? "" : `cho ${shortest} năm`}
      extraPrices={others.map((years) => ({
        label: `${years} năm`,
        value: formatMoney(priceOf(years)),
      }))}
      quota={formatQuota(getValue(`Plans.${plan.code}.QuotaMb`, plan.quotaDefault))}
      slots={getValue(`Plans.${plan.code}.Slots`, plan.slotsDefault)}
      packages={getValue(`Plans.${plan.code}.MaxPackages`, "50")}
      features={parseFeatureLines(getValue(featuresKey(plan.code), ""), plan.featureDefaults)}
      toggle={
        <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Switch
            checked={selling}
            aria-label={`Bán gói ${plan.name}`}
            onCheckedChange={(next) => setKeyValue(saleKey(plan.code), next ? "true" : "false")}
          />
          {selling ? "Đang bán" : "Tạm ngừng"}
        </label>
      }
    />
  );
}

function PlanCard({
  name,
  subtitle,
  badge,
  price,
  priceNote,
  extraPrices,
  quota,
  slots,
  packages,
  features,
  toggle,
}: {
  name: string;
  subtitle: string;
  badge?: string;
  price: string;
  priceNote: string;
  extraPrices: { label: string; value: string }[];
  quota: string;
  slots: string;
  packages: string;
  features: readonly string[];
  toggle?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-heritage-border bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold text-heritage-primary">
            {name}
            {badge && (
              <span className="rounded-xl bg-[#e5ede8] px-2 py-0.5 text-xs font-semibold">
                {badge}
              </span>
            )}
          </h3>
          <p className="text-[12.5px] text-heritage-muted">{subtitle}</p>
        </div>
        {toggle}
      </header>
      <div>
        <b className="text-[28px] font-bold leading-none tabular-nums text-heritage-primary">
          {price}
        </b>
        {priceNote && <small className="mt-1 block text-xs text-heritage-muted">{priceNote}</small>}
        {extraPrices.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-heritage-muted">
            {extraPrices.map((item) => (
              <span key={item.label}>
                {item.label} <b className="tabular-nums text-heritage-text">{item.value}</b>
              </span>
            ))}
          </p>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-heritage-border pt-3 text-xs">
        <Fact label="Dung lượng" value={quota} />
        <Fact label="Người nhận" value={`${slots} người`} />
        {packages !== "" && <Fact label="Số gói bàn giao" value={`${packages} gói`} />}
      </dl>
      <ul className="space-y-1.5 border-t border-heritage-border pt-3 text-sm">
        {features.length === 0 ? (
          <li className="flex items-center gap-2 text-heritage-muted">
            <Minus className="size-4" aria-hidden="true" />
            Chưa có mô tả tính năng
          </li>
        ) : (
          features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
              {feature}
            </li>
          ))
        )}
      </ul>
    </article>
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
