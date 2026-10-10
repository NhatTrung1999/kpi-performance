const PATH =
  "M-40,800 C160,800 260,720 420,740 S600,600 720,560 S1000,500 1170,390 S1360,190 1500,140";

/** Đường tăng trưởng phát sáng chạy ngang toàn trang: 3 lớp (quầng rộng, quầng vừa, lõi sáng). */
export function GrowthLine() {
  const common = {
    d: PATH,
    pathLength: 1,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    className: "animate-draw [animation-delay:200ms]",
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id="kpi-glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset=".5" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path {...common} stroke="url(#kpi-glow)" strokeWidth={26} style={{ filter: "blur(14px)" }} className={`${common.className} opacity-30 dark:opacity-45`} />
      <path {...common} stroke="url(#kpi-glow)" strokeWidth={8} style={{ filter: "blur(3px)" }} className={`${common.className} opacity-55 dark:opacity-80`} />
      <path {...common} strokeWidth={2.5} className={`${common.className} stroke-white dark:stroke-indigo-100`} />
    </svg>
  );
}
