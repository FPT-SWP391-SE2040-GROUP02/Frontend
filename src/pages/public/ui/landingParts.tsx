import { FOCUS_RING, HEADING } from "./LandingChrome";
import { Reveal } from "./Reveal";

/** Nút vàng chính của landing. */
export const GOLD_BUTTON = `landing-press inline-flex min-h-12 items-center justify-center rounded-md bg-[#B68F4C] px-6 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] ${FOCUS_RING}`;

/** Nút viền vàng trên nền xanh đậm. */
export const OUTLINE_BUTTON = `inline-flex min-h-12 items-center justify-center rounded-md border border-[#E6C98B]/60 px-6 text-sm font-semibold text-[#E6C98B] transition-colors duration-200 hover:bg-[#E6C98B]/10 ${FOCUS_RING}`;

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
  center?: boolean;
}

/** Đầu mục: nhãn nghiêng vàng, tiêu đề lớn, mô tả. `dark` cho nền xanh đậm, `center` căn giữa. */
export function SectionHead({ eyebrow, title, description, dark, center }: SectionHeadProps) {
  let titleColor = "text-[#0A281E]";
  let descriptionColor = "text-[#4E6257]";
  if (dark) {
    titleColor = "text-[#F3EFE6]";
    descriptionColor = "text-[#F3EFE6]/75";
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
      <p className={`${HEADING} text-lg italic text-[#B68F4C]`}>{eyebrow}</p>
      <h2 className={`${HEADING} mt-3 text-4xl leading-tight sm:text-5xl ${titleColor}`}>
        {title}
      </h2>
      {descriptionNode}
    </Reveal>
  );
}
