import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-[8px] border border-[#D5D0C3] dark:border-[#1E432F] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-main)] transition-all outline-none placeholder:text-[#8E9F96] focus-visible:border-[var(--gold)] focus-visible:ring-3 focus-visible:ring-[var(--gold)]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#D8D4CA]/40 disabled:opacity-50 aria-invalid:border-[#D9534F] aria-invalid:bg-[#FFF9F9] dark:aria-invalid:bg-[#2D1212]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
