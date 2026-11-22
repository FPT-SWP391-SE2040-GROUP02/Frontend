import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-colors duration-200 outline-none select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-heritage-primary text-white hover:bg-heritage-primary-hover",
        outline:
          "border-heritage-border-strong bg-heritage-surface text-heritage-primary hover:bg-heritage-sunken",
        secondary: "bg-heritage-primary-light text-heritage-primary hover:brightness-95",
        ghost: "text-heritage-primary hover:bg-heritage-sunken",
        destructive: "bg-heritage-danger text-white hover:brightness-110",
        gold: "bg-heritage-gold-soft text-heritage-primary hover:brightness-105",
        pressed:
          "border border-heritage-primary-hover bg-heritage-primary-hover text-heritage-primary-light",
        link: "text-heritage-gold-hover underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-4 sm:px-5",
        xs: "h-8 gap-1 rounded-lg px-3",
        sm: "h-10 gap-1.5 px-4",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
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
