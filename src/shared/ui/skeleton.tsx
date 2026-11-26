import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="skeleton" className={cn("pm-skel rounded-md bg-muted", className)} {...props} />
  );
}

export { Skeleton };
