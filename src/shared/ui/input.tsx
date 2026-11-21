import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-heritage-border-strong dark:border-heritage-primary-hover bg-heritage-surface px-3.5 py-2 text-sm text-heritage-text transition-all outline-none placeholder:text-heritage-subtle focus-visible:border-heritage-gold focus-visible:ring-3 focus-visible:ring-heritage-gold/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-heritage-border-strong/40 disabled:opacity-50 aria-invalid:border-heritage-danger aria-invalid:bg-heritage-danger-bg dark:aria-invalid:bg-heritage-danger-bg",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
