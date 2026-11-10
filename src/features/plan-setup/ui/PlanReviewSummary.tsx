import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;
type Container = PlanSetup["containers"][number];
type OutsideAsset = PlanSetup["assetsOutsideContainer"][number];

/** Mỗi nhóm chỉ hiện ngần này dòng; còn lại mở bằng nút "Xem tất cả". */
const COLLAPSED_LIMIT = 3;

const MISSING_REASONS: Record<string, string> = {
  NO_ASSET: "chưa có tài sản",
  NO_DESIGNATION: "chưa có người nhận",
};

const ASSET_KIND_LABELS: Record<OutsideAsset["kind"], string> = {
  FILE: "Tệp",
  TEXT: "Ghi chú",
};

const ROW_ACTION =
  "inline-flex min-h-9 shrink-0 items-center text-sm font-semibold text-heritage-primary underline underline-offset-4 hover:text-heritage-gold focus-visible:outline-2 focus-visible:outline-heritage-gold";

/** Ghép lý do gói chưa đủ từ `missingRequirements`; mã lạ không bịa nghĩa. */
function describeMissing(codes: string[]): string {
  const reasons: string[] = [];
  for (const code of codes) {
    if (Object.hasOwn(MISSING_REASONS, code)) {
      reasons.push(MISSING_REASONS[code]);
    }
  }
  if (reasons.length === 0) {
    return "chưa đủ điều kiện";
  }
  return reasons.join(", ");
}

/** Một nhóm có tiêu đề, danh sách rút gọn còn 3 dòng và nút mở rộng tại chỗ. */
function ReviewGroup({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "ok" | "warning";
  rows: ReactNode[];
}) {
  const [expanded, setExpanded] = useState(false);
  let shownRows = rows;
  if (!expanded && rows.length > COLLAPSED_LIMIT) {
    shownRows = rows.slice(0, COLLAPSED_LIMIT);
  }
  let boxStyle = "border-heritage-border bg-heritage-canvas";
  if (tone === "warning") {
    boxStyle = "border-amber-200 bg-amber-50 text-amber-950";
  }
  let toggle: ReactNode = null;
  if (rows.length > COLLAPSED_LIMIT) {
    let toggleText = `Xem tất cả (${rows.length})`;
    if (expanded) {
      toggleText = "Thu gọn";
    }
    toggle = (
      <button
        type="button"
        className={`${ROW_ACTION} mt-1`}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {toggleText}
      </button>
    );
  }
  return (
    <div className={`rounded-xl border px-4 py-3 ${boxStyle}`}>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-2 space-y-2">{shownRows}</ul>
      {toggle}
    </div>
  );
}

function ReviewRow({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm leading-6">
      <span className="min-w-0 break-words">{children}</span>
      {action}
    </li>
  );
}

/**
 * Soát lại phạm vi bàn giao: gói sẽ bàn giao, gói chưa đủ và tài sản chưa thuộc gói nào.
 * Chỉ nhắc, không chặn kích hoạt. `containers` không có tên người nhận nên chỉ hiện số lượng.
 */
export function PlanReviewSummary({
  containers,
  assetsOutsideContainer,
  showActivationNote = false,
}: {
  containers: Container[];
  assetsOutsideContainer: OutsideAsset[];
  /** true ở bước soát lại trước khi kích hoạt: thêm dòng nói rõ gói thiếu không chặn kích hoạt. */
  showActivationNote?: boolean;
}) {
  const readyRows: ReactNode[] = [];
  const draftRows: ReactNode[] = [];
  for (const container of containers) {
    if (container.status === "READY") {
      readyRows.push(
        <ReviewRow key={container.id}>
          <strong>{container.name}</strong> · {container.assetCount} tài sản ·{" "}
          {container.designationCount} người nhận
        </ReviewRow>,
      );
    } else {
      draftRows.push(
        <ReviewRow
          key={container.id}
          action={
            <Link className={ROW_ACTION} to={ROUTES.DASHBOARD.GROUP_DETAIL(container.id)}>
              Hoàn thiện gói
            </Link>
          }
        >
          <strong>{container.name}</strong> · {describeMissing(container.missingRequirements)}
        </ReviewRow>,
      );
    }
  }
  const outsideRows: ReactNode[] = [];
  for (const asset of assetsOutsideContainer) {
    outsideRows.push(
      <ReviewRow
        key={asset.id}
        action={
          <Link className={ROW_ACTION} to={ROUTES.DASHBOARD.ASSETS}>
            Thêm vào gói
          </Link>
        }
      >
        <strong>{asset.name}</strong> · {ASSET_KIND_LABELS[asset.kind]}
      </ReviewRow>,
    );
  }

  let readyBody: ReactNode = (
    <ReviewGroup title={`Sẽ bàn giao · ${readyRows.length} gói`} tone="ok" rows={readyRows} />
  );
  if (readyRows.length === 0) {
    readyBody = (
      <div className="rounded-xl border border-heritage-border bg-heritage-canvas px-4 py-3">
        <h4 className="text-sm font-semibold">Sẽ bàn giao · 0 gói</h4>
        <p className="mt-1 text-sm text-heritage-muted">Chưa có gói nào sẵn sàng để bàn giao.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {readyBody}
      {draftRows.length > 0 && (
        <ReviewGroup
          title={`Gói chưa đủ, sẽ không bàn giao · ${draftRows.length} gói`}
          tone="warning"
          rows={draftRows}
        />
      )}
      {outsideRows.length > 0 && (
        <ReviewGroup
          title={`Tài sản chưa thuộc gói nào, sẽ không bàn giao · ${outsideRows.length} tài sản`}
          tone="warning"
          rows={outsideRows}
        />
      )}
      {showActivationNote && (
        <p className="text-xs leading-5 text-heritage-muted">
          Bạn vẫn kích hoạt được khi còn gói chưa đủ hoặc tài sản lẻ; chúng chỉ không nằm trong kế
          hoạch bàn giao.
        </p>
      )}
    </div>
  );
}
