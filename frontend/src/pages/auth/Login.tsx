import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { GrowthLine } from "@/components/auth/growth-line";
import { LINE_POINTS } from "@/components/auth/line-points";
import { KpiPill } from "@/components/auth/kpi-pill";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCountUp } from "@/hooks/use-count-up";
import { formatPercent } from "@/lib/format";

const Login = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const done = useCountUp(92);
  const growth = useCountUp(18);

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-page font-login text-foreground">
      {/* Nền mesh + khối sáng trôi chậm */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_0%_0%,#E0E7FF_0%,transparent_65%),radial-gradient(50%_60%_at_100%_30%,#DBEAFE_0%,transparent_65%),radial-gradient(60%_60%_at_70%_100%,#EDE9FE_0%,transparent_65%)] dark:bg-[radial-gradient(60%_60%_at_0%_0%,rgba(49,46,129,.55)_0%,transparent_65%),radial-gradient(50%_60%_at_100%_30%,rgba(30,58,138,.45)_0%,transparent_65%),radial-gradient(60%_60%_at_70%_100%,rgba(76,29,149,.4)_0%,transparent_65%)]"
      />
      <div aria-hidden="true" className="absolute -top-32 left-[8%] -z-10 h-[520px] w-[520px] animate-drift rounded-full bg-indigo-400/40 blur-[80px] dark:bg-indigo-600/30" />
      <div aria-hidden="true" className="absolute -bottom-40 right-[14%] -z-10 h-[480px] w-[480px] animate-drift-slow rounded-full bg-violet-400/30 blur-[80px] dark:bg-violet-600/25" />

      {/* Lớp minh hoạ — chỉ desktop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute inset-0 z-10">
          <GrowthLine />
        </div>
        <h1 className="absolute -left-7 top-[16.5vh] z-20 m-0 animate-fade-up whitespace-nowrap bg-gradient-to-r from-indigo-800 via-indigo-600 to-blue-600 bg-clip-text font-extrabold leading-[.86] tracking-[-0.065em] text-transparent dark:from-indigo-200 dark:via-indigo-300 dark:to-blue-300">
          <span className="block text-[clamp(200px,23vw,330px)]">KPI</span>
          <span className="-ml-1.5 block text-[clamp(110px,12.2vw,176px)]">Performance</span>
        </h1>
        <p className="absolute left-14 top-[66.6vh] z-30 max-w-[440px] animate-fade-up text-xl font-medium leading-normal text-gray-600 [animation-delay:150ms] [text-wrap:pretty] dark:text-muted-foreground">
          {t("tagline")}
        </p>
        <KpiPill {...LINE_POINTS.growth}>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-gradient text-white">
            <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-bold tabular-nums">+{formatPercent(growth)}</span>
          <span className="text-xs text-gray-600 dark:text-muted-foreground">{t("growthCaption")}</span>
        </KpiPill>
        <KpiPill {...LINE_POINTS.done} className="animate-bob-slow">
          <span className="ml-1.5 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-300" />
          <span className="text-sm font-bold">
            {t("completed")} <span className="tabular-nums">{formatPercent(done)}</span>
          </span>
        </KpiPill>
      </div>

      {/* Header: tên công ty + chuyển giao diện */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 lg:px-14 lg:py-12">
        <div className="hidden items-center gap-2.5 lg:flex">
          {/* Thay bằng logo công ty */}
          <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand-gradient text-[8px] font-semibold tracking-wider text-white">LOGO</div>
          <span className="text-sm font-semibold">{t("companyName")}</span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Form — card kính mờ lệch phải trên desktop, full màn hình trên mobile */}
      <main className="relative z-30 flex min-h-dvh items-start justify-center px-6 pb-10 pt-20 sm:items-center sm:pt-10 lg:justify-end lg:px-[7.2vw]">
        <GlassCard glass="sm" className="w-full max-w-[468px] animate-fade-up [animation-delay:250ms]">
          <div className="p-0 sm:px-9 sm:pb-8 sm:pt-10">
            <LoginForm onSuccess={() => navigate("/dashboard", { replace: true })} />
          </div>
        </GlassCard>
      </main>
    </div>
  );
};

export default Login;
