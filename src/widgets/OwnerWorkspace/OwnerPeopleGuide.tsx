import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { HANDOVER_STEPS } from "./handoverSteps";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";

/** Nội dung hướng dẫn cố định theo SRS và các màn Người nhận, Người tin cậy; không lấy từ máy chủ. */
const RECIPIENT_POINTS = [
  "Nhận nội dung của gói bàn giao bạn chỉ định.",
  "Xác nhận danh tính, chờ 72 giờ phản đối, rồi tải về trong 7 ngày.",
  "Thêm người nhận cần gói trả phí.",
];

const EXECUTOR_POINTS = [
  "Báo tin khi bạn không còn và theo dõi tiến trình bàn giao.",
  "Không đọc được nội dung kho, không tự duyệt hồ sơ.",
  "Mỗi kho một người; cần chấp nhận lời mời (hiệu lực 7 ngày) thì mới kích hoạt được kế hoạch.",
];

function GuideCard({ title, alias, points }: { title: string; alias: string; points: string[] }) {
  const rows: ReactNode[] = [];
  for (const point of points) {
    rows.push(
      <li key={point} className="flex items-start gap-3 text-lg leading-8">
        <span className="mt-3 size-2 shrink-0 rounded-full bg-heritage-gold" aria-hidden="true" />
        {point}
      </li>,
    );
  }
  return (
    <section aria-label={title} className={CARD}>
      <p className="text-sm font-semibold text-heritage-warning">{alias}</p>
      <h2 className="mt-1 text-3xl font-medium text-heritage-primary">{title}</h2>
      <ul className="mt-5 space-y-4">{rows}</ul>
    </section>
  );
}

function ProcessCard() {
  const rows: ReactNode[] = [];
  let stepNumber = 0;
  for (const step of HANDOVER_STEPS) {
    stepNumber = stepNumber + 1;
    rows.push(
      <li
        key={step.title}
        className="flex items-start gap-4 border-b border-heritage-border py-4 last:border-b-0"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft text-lg font-semibold text-heritage-on-gold"
          aria-hidden="true"
        >
          {stepNumber}
        </span>
        <div>
          <p className="text-lg font-semibold">{step.title}</p>
          <p className="text-base text-heritage-muted">{step.detail}</p>
        </div>
      </li>,
    );
  }
  return (
    <section aria-label="Quy trình bàn giao" className={CARD}>
      <h2 className="text-3xl font-medium text-heritage-primary">Quy trình bàn giao</h2>
      <ol className="mt-3">{rows}</ol>
    </section>
  );
}

/** Trang hướng dẫn bàn giao: vai trò Người nhận (thụ hưởng), Người thực hiện (thực thi) và quy trình năm bước; chỉ đọc, không gọi Backend. */
export function OwnerPeopleGuide() {
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 md:grid-cols-2">
        <GuideCard title="Người nhận" alias="Người thụ hưởng" points={RECIPIENT_POINTS} />
        <GuideCard
          title="Người thực hiện"
          alias="Người thực thi (Executor)"
          points={EXECUTOR_POINTS}
        />
      </div>
      <ProcessCard />
      <p className="text-lg text-heritage-muted">
        Người xét duyệt do hệ thống phân công, bạn không mời và không thấy họ.
      </p>
      <div>
        <Link to={ROUTES.DASHBOARD.BENEFICIARIES} className={buttonStyles.outline}>
          Quay lại Người liên quan
        </Link>
      </div>
    </div>
  );
}
