/** Vòng điểm khớp: giá trị là điểm cosine 0–1 của Backend (không phải phần trăm), nên hiện nguyên số, không đổi thành %. */
export function MatchRing({
  score,
  tone,
}: {
  /** Điểm cosine; null khi chưa có kết quả. */
  score: number | null;
  tone: "idle" | "pass" | "fail";
}) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let fraction = 0;
  if (score !== null) {
    fraction = Math.min(1, Math.max(0, score));
  }
  let stroke = "#9bb3a0";
  let text = "text-heritage-muted";
  if (tone === "pass") {
    stroke = "#2f9e75";
    text = "text-green-700";
  } else if (tone === "fail") {
    stroke = "#a31d17";
    text = "text-red-800";
  }
  let label = "—";
  if (score !== null) {
    label = score.toFixed(2);
  }
  return (
    <div className="relative mx-auto size-40" role="img" aria-label={`Điểm khớp ${label}`}>
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e0d2" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-sans text-3xl font-semibold ${text}`}
      >
        {label}
      </span>
    </div>
  );
}
