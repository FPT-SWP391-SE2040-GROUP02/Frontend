import type { SVGProps } from "react";

/** LegacyVaultMark: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function LegacyVaultMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M22 108 L22 50 A38 38 0 0 1 98 50 L98 108"></path>
        <path d="M31 108 L31 59 A29 29 0 0 1 89 59 L89 108"></path>
        <path d="M40 108 L40 68 A20 20 0 0 1 80 68 L80 108"></path>
      </g>
      <path d="M49 108 L49 77 A11 11 0 0 1 71 77 L71 108 Z" fill="#B68F4C"></path>
    </svg>
  );
}

/** OverviewIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11l9-8 9 8"></path>
      <path d="M5 10v10h14V10"></path>
    </svg>
  );
}

/** VaultIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function VaultIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2"></rect>
      <circle cx="12" cy="12.5" r="3"></circle>
      <path d="M12 9.5v-2M12 17.5v-2"></path>
    </svg>
  );
}

/** MessageIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function MessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <path d="M3 7l9 6 9-6"></path>
    </svg>
  );
}

/** RecipientsIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function RecipientsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.2"></circle>
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"></path>
      <circle cx="17" cy="9" r="2.4"></circle>
      <path d="M16 14c3 0 5 2 5 5"></path>
    </svg>
  );
}

/** TrustedIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function TrustedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path>
      <path d="M8.5 12l2.5 2.5L16 9.5"></path>
    </svg>
  );
}

/** HandoverIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function HandoverIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="5" r="2"></circle>
      <circle cx="6" cy="12" r="2"></circle>
      <circle cx="6" cy="19" r="2"></circle>
      <path d="M6 7v3M6 14v3M10 5h9M10 12h6M10 19h8"></path>
    </svg>
  );
}

/** PlanIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function PlanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="2"></rect>
      <path d="M3 10h18M7 15h4"></path>
    </svg>
  );
}

/** SettingsIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"></path>
    </svg>
  );
}

/** LogoutIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"></path>
    </svg>
  );
}

/** AddIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function AddIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14"></path>
    </svg>
  );
}

/** ConfirmedIcon: giữ nguyên đường nét SVG trong bản mẫu Claude. */
export function ConfirmedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7"></path>
    </svg>
  );
}
