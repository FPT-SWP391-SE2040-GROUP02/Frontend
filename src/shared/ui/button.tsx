import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[20px] border border-transparent bg-clip-padding text-xs font-[550] whitespace-nowrap transition-all outline-none select-none cursor-pointer focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-[0_3px_10px_rgba(11,41,30,0.2)]",
        outline:
          "border-[#DDD8CB] dark:border-[#1E432F] bg-[var(--surface)] text-[var(--text-main)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]",
        secondary:
          "bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[#D5E3D9]",
        ghost:
          "hover:bg-[var(--primary-light)] hover:text-[var(--primary)]",
        destructive:
          "bg-[#991B1B] text-white hover:bg-[#7F1D1D]",
        gold:
          "bg-[var(--gold)] text-white hover:bg-[var(--gold-hover)] shadow-sm",
        pressed:
          "bg-[var(--primary-surface)] text-[#E2ECE6] shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] border border-[#1A4D3B]",
        link: "text-[var(--gold)] underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-9 gap-1.5 px-4 text-xs",
        xs: "h-6 gap-1 rounded-[14px] px-2 text-[10.5px]",
        sm: "h-7 gap-1 rounded-[16px] px-3 text-[11px]",
        lg: "h-11 gap-2 rounded-[20px] px-6 text-sm",
        icon: "size-9 rounded-full",
        "icon-sm": "size-7 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
