import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { referenceMoney, type ReferenceServicePlan } from "../model/servicePlanPreview";

/** Bề rộng cột tên dòng so với một cột gói (1,5 : 1), khớp với CSS của bảng. */
const LABEL_WEIGHT = 1.5;

interface CompareRow {
  key: string;
  label: string;
  /** Mỗi gói một giá trị: chữ, hoặc true/false cho "có/không có" tính năng. */
  values: Array<string | boolean>;
  /** Dòng giống nhau ở mọi gói thì được gập khi chưa bật "Hiện chi tiết". */
  same: boolean;
}

function allEqual(values: Array<string | boolean>): boolean {
  for (const value of values) {
    if (value !== values[0]) {
      return false;
    }
  }
  return true;
}

/** Dựng các dòng so sánh từ bảng giá đang bán: dung lượng, giá của kỳ đã chọn, rồi mọi tính năng admin đã ghi. */
function buildRows(plans: readonly ReferenceServicePlan[], years: number): CompareRow[] {
  const rows: CompareRow[] = [];
  const storage: string[] = [];
  const prices: string[] = [];
  for (const plan of plans) {
    storage.push(formatStorageMegabytes(plan.storage * 1_048_576));
    if (plan.serviceTier === "FREE") {
      prices.push(referenceMoney.format(0));
    } else {
      const term = plan.termPrices.find((value) => value.years === years);
      prices.push(`${referenceMoney.format(term?.price ?? 0)} · ${years} năm`);
    }
  }
  rows.push({ key: "storage", label: "Dung lượng", values: storage, same: allEqual(storage) });
  rows.push({ key: "price", label: "Giá cho kỳ đã chọn", values: prices, same: false });
  const seen: string[] = [];
  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!seen.includes(feature)) {
        seen.push(feature);
      }
    }
  }
  for (const feature of seen) {
    const values: boolean[] = [];
    for (const plan of plans) {
      values.push(plan.features.includes(feature));
    }
    rows.push({ key: `feature:${feature}`, label: feature, values, same: allEqual(values) });
  }
  return rows;
}

/**
 * Bảng so sánh các gói đang bán: cột đang rê chuột hoặc có tiêu điểm được tô một tấm nền liền mạch trượt giữa các
 * cột; công tắc "Hiện chi tiết" (mặc định tắt) gập các dòng mà gói nào cũng giống nhau.
 */
export function ServicePlanCompare({
  catalog,
  years,
}: {
  catalog: readonly ReferenceServicePlan[];
  years: number;
}) {
  const plans = catalog.filter((plan) => plan.hidden !== true);
  const [showDetail, setShowDetail] = useState(false);
  const [column, setColumn] = useState<number | null>(null);
  const [lastColumn, setLastColumn] = useState(0);
  if (plans.length < 2) {
    return null;
  }
  const rows = buildRows(plans, years);
  const total = LABEL_WEIGHT + plans.length;
  const grid = {
    gridTemplateColumns: `minmax(0, ${LABEL_WEIGHT}fr) repeat(${plans.length}, minmax(0, 1fr))`,
  };

  function focusColumn(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return;
    }
    const cell = target.closest("[data-col]");
    if (cell === null) {
      return;
    }
    const index = Number(cell.getAttribute("data-col"));
    setColumn(index);
    setLastColumn(index);
  }

  return (
    <section className="plan-compare" aria-label="So sánh các gói">
      <div className="plan-compare-top">
        <h2>So sánh gói</h2>
        <button
          type="button"
          role="switch"
          aria-checked={showDetail}
          className="plan-compare-switch"
          onClick={() => setShowDetail(!showDetail)}
        >
          Hiện chi tiết
          <i aria-hidden="true" />
        </button>
      </div>
      <div
        role="table"
        aria-label="So sánh tính năng các gói"
        className="plan-compare-table"
        style={
          {
            "--pc-start": LABEL_WEIGHT + lastColumn,
            "--pc-total": total,
          } as React.CSSProperties
        }
        onPointerOver={(event) => focusColumn(event.target)}
        onPointerLeave={() => setColumn(null)}
        onFocus={(event) => focusColumn(event.target)}
        onBlur={() => setColumn(null)}
      >
        <span className="plan-compare-hl" aria-hidden="true" data-on={column !== null} />
        <div role="row" className="plan-compare-row plan-compare-head" style={grid}>
          <span role="columnheader">
            <span className="sr-only">Tính năng</span>
          </span>
          {plans.map((plan, index) => (
            <span key={plan.serviceTier} role="columnheader" data-col={index} tabIndex={0}>
              <b>{plan.name}</b>
            </span>
          ))}
        </div>
        {rows.map((row) => {
          const folded = !showDetail && row.same;
          return (
            <div
              key={row.key}
              className="receive-collapse receive-collapse-slow"
              data-open={!folded}
              inert={folded}
              role="presentation"
            >
              <div role="presentation">
                <div role="row" className="plan-compare-row plan-compare-body" style={grid}>
                  <span role="rowheader">{row.label}</span>
                  {row.values.map((value, index) => (
                    <span key={plans[index].serviceTier} role="cell" data-col={index}>
                      {typeof value === "string" && value}
                      {value === true && <Check aria-label="Có" className="plan-compare-yes" />}
                      {value === false && (
                        <Minus aria-label="Không có" className="plan-compare-no" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
