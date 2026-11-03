import { FOCUS_RING, HEADING } from "./LandingChrome";
import { Reveal } from "./Reveal";

/** Nút vàng chính của landing. */
export const GOLD_BUTTON = `landing-press inline-flex min-h-12 items-center justify-center rounded-md bg-heritage-gold px-6 text-sm font-semibold text-heritage-on-gold hover:bg-heritage-gold-soft-hover ${FOCUS_RING}`;

/** Nút viền vàng trên nền xanh đậm. */
export const OUTLINE_BUTTON = `inline-flex min-h-12 items-center justify-center rounded-md border border-heritage-gold-soft-hover/60 px-6 text-sm font-semibold text-heritage-gold-soft-hover transition-colors duration-200 hover:bg-heritage-gold-soft-hover/10 ${FOCUS_RING}`;

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
  center?: boolean;
}

/** Đầu mục: nhãn nghiêng vàng, tiêu đề lớn, mô tả. `dark` cho nền xanh đậm, `center` căn giữa. */
export function SectionHead({ eyebrow, title, description, dark, center }: SectionHeadProps) {
  let titleColor = "text-heritage-primary";
  let descriptionColor = "text-[#4E6257]";
  if (dark) {
    titleColor = "text-heritage-canvas";
    descriptionColor = "text-heritage-canvas/75";
  }
  let alignment = "";
  if (center) {
    alignment = "mx-auto text-center";
  }
  let descriptionNode = null;
  if (description) {
    descriptionNode = <p className={`mt-5 text-lg leading-8 ${descriptionColor}`}>{description}</p>;
  }
  return (
    <Reveal className={`max-w-3xl ${alignment}`}>
      <p className={`${HEADING} text-lg italic text-heritage-gold`}>{eyebrow}</p>
      <h2 className={`${HEADING} mt-3 text-4xl leading-tight sm:text-5xl ${titleColor}`}>
        {title}
      </h2>
      {descriptionNode}
    </Reveal>
  );
}
