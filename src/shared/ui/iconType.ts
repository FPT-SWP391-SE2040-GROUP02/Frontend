import type { ComponentType } from "react";

/** Kiểu chung cho icon của lucide-react và icon riêng trong LegacyVaultArtwork. */
export type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;
