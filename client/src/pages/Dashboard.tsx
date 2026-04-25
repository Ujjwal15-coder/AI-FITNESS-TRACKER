/**
 * Dashboard.tsx — Premium Fitness Dashboard
 * Fixes: typed animation variants, motivation card overflow, full responsiveness
 */

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FlameIcon,
  TimerIcon,
  ZapIcon,
  TrendingUpIcon,
  ScaleIcon,
  RulerIcon,
  UtensilsIcon,
  ActivityIcon,
  TargetIcon,
  SparklesIcon,
  CalendarDaysIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react";

import { getMotivationalMessage } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import CaloriesChart from "../components/CaloriesChart";

// ─── Typed animation variants (fixes spread type errors) ──────────────────────

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/** Returns per-card delay variant so each card staggers independently */
const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay } },
});

// ─── Animated SVG progress ring ───────────────────────────────────────────────

interface RingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor: string;
  darkTrackColor: string;
  isDark: boolean;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  iconColor: string;
}

const Ring = ({
  value, max, size = 110, stroke = 10,
  color, trackColor, darkTrackColor, isDark,
  label, sublabel, icon: Icon, iconColor,
}: RingProps) => {
  const track = isDark ? darkTrackColor : trackColor;
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const pct   = Math.min(value / (max || 1), 1);

  const cubicEase: [number, number, number, number] = [0.34, 1.1, 0.64, 1];

  return (
    <div className="flex flex-col items-center gap-2 min-w-[90px]">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={track} strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - circ * pct }}
            transition={{ duration: 1.2, ease: cubicEase }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-4 h-4 mb-0.5 ${iconColor}`} />
          <motion.p
            key={value}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-extrabold text-slate-800 dark:text-white tabular-nums leading-none"
          >
            {value}
          </motion.p>
          <p className="text-[9px] text-slate-400 font-medium">/ {max}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
};

// ─── Stat chip card ───────────────────────────────────────────────────────────

interface StatChipProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  delay?: number;
}

const StatChip = ({ icon: Icon, label, value, gradient, delay = 0 }: StatChipProps) => (
  <motion.div
    variants={fadeUp(delay)}
    initial="hidden"
    animate="show"
    whileHover={{ y: -3, transition: { duration: 0.18 } }}
    className="flex flex-col gap-3 p-4
      bg-white dark:bg-slate-900
      border border-slate-100 dark:border-slate-800
      rounded-2xl shadow-sm"
  >
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <motion.p
        key={String(value)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-extrabold text-slate-800 dark:text-white tabular-nums"
      >
        {value}
      </motion.p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user, allActivityLogs, allFoodLogs } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const CALORIE_LIMIT = user?.dailyCalorieIntake ?? 2000;
  const BURN_GOAL     = user?.dailyCalorieBurn   ?? 400;

  // Derived lists — useMemo instead of useEffect+setState
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayFood = useMemo(
    () => allFoodLogs.filter((f) => f.createdAt?.split("T")[0] === today),
    [allFoodLogs, today]
  );

  const todayActivities = useMemo(
    () => allActivityLogs.filter((a) => a.createdAt?.split("T")[0] === today),
    [allActivityLogs, today]
  );

  const totalCalories = useMemo(() => todayFood.reduce((s, f) => s + f.calories, 0), [todayFood]);
  const totalBurned   = useMemo(() => todayActivities.reduce((s, a) => s + (a.calories ?? 0), 0), [todayActivities]);
  const totalMinutes  = useMemo(() => todayActivities.reduce((s, a) => s + a.duration, 0), [todayActivities]);

  const remainingCal = CALORIE_LIMIT - totalCalories;
  const motivation   = getMotivationalMessage(totalCalories, totalMinutes, CALORIE_LIMIT);

  // BMI
  const bmi = useMemo(() => {
    if (!user?.weight || !user?.height) return null;
    return (user.weight / Math.pow(user.height / 100, 2)).toFixed(1);
  }, [user]);

  const bmiStatus = useMemo(() => {
    if (!bmi) return null;
    const n = parseFloat(bmi);
    if (n < 18.5) return { label: "Underweight", color: "#60a5fa", pct: 10 };
    if (n < 25)   return { label: "Healthy",     color: "#34d399", pct: 35 };
    if (n < 30)   return { label: "Overweight",  color: "#fbbf24", pct: 65 };
    return              { label: "Obese",         color: "#f87171", pct: 90 };
  }, [bmi]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening";

  // Summary rows config
  const summaryRows = [
    { icon: UtensilsIcon, label: "Meals Logged",    value: `${todayFood.length}`,        color: "text-orange-500" },
    { icon: FlameIcon,    label: "Total Calories",  value: `${totalCalories} kcal`,       color: "text-red-500" },
    { icon: FlameIcon,    label: "Calories Burned", value: `${totalBurned} kcal`,         color: "text-emerald-500" },
    { icon: TimerIcon,    label: "Active Time",     value: `${totalMinutes} min`,         color: "text-blue-500" },
    { icon: ZapIcon,      label: "Workouts",        value: `${todayActivities.length}`,   color: "text-violet-500" },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── HERO HEADER ── */}
      {/*
        NOTE: dashboard-header has overflow-hidden which clips the motivation card.
        We apply overflow-visible here via an extra class to fix text clipping.
      */}
      <div className="dashboard-header relative" style={{ overflow: "visible" }}>
        {/* Decorative animated blobs — clipped to their own element so they don't overflow */}
        <div className="absolute inset-0 rounded-b-3xl overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 left-8 w-36 h-36 rounded-full bg-emerald-300/20 blur-2xl"
          />
        </div>

        <div className="relative space-y-4">
          {/* Greeting row */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-emerald-100 text-sm font-medium"
              >
                {greeting} 👋
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="text-2xl font-extrabold text-white mt-0.5 tracking-tight"
              >
                {user?.username ?? "Athlete"}
              </motion.h1>
            </div>

            {/* Date badge + Theme toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                  bg-white/20 backdrop-blur-sm border border-white/30
                  text-white text-xs font-medium whitespace-nowrap"
              >
                <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </motion.div>

              {/* Theme toggle */}
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                aria-label="Toggle dark/light mode"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30
                  flex items-center justify-center
                  hover:bg-white/30 transition-colors duration-200"
              >
                {isDark
                  ? <SunIcon className="w-4 h-4 text-amber-300" />
                  : <MoonIcon className="w-4 h-4 text-white" />}
              </motion.button>
            </div>
          </div>

          {/* Motivation card — fixed: removed overflow-hidden, text nowrap removed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-start gap-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-3xl flex-shrink-0 mt-0.5"
              >
                {motivation.emoji}
              </motion.span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-snug">
                  {motivation.text}
                </p>
                <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">
                  Keep pushing — every rep counts.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      {/* relative z-10 ensures cards always render above the green hero header
           that overlaps them via the -mt-10 negative margin in dashboard-grid CSS */}
      <div className="dashboard-grid relative z-10">

        {/* ── Calorie Rings card (full width) ── */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="show"
          className="col-span-2 bg-white dark:bg-slate-900
            border border-slate-100 dark:border-slate-800
            rounded-2xl shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <TargetIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-bold text-slate-800 dark:text-white text-sm">Today's Targets</h2>
          </div>

          {/* Rings — flex-wrap so they stack on small screens */}
          <div className="flex flex-wrap justify-around items-center gap-6">
            <Ring
              value={totalCalories}
              max={CALORIE_LIMIT}
              color="#f97316"
              trackColor="#fed7aa"
              darkTrackColor="#431407"
              isDark={isDark}
              label="Calories In"
              sublabel={remainingCal >= 0 ? `${remainingCal} kcal left` : `${Math.abs(remainingCal)} over`}
              icon={UtensilsIcon}
              iconColor="text-orange-500"
            />
            <Ring
              value={totalBurned}
              max={BURN_GOAL}
              color="#10b981"
              trackColor="#a7f3d0"
              darkTrackColor="#064e3b"
              isDark={isDark}
              label="Calories Burned"
              sublabel={`Goal: ${BURN_GOAL} kcal`}
              icon={FlameIcon}
              iconColor="text-emerald-500"
            />
            <Ring
              value={totalMinutes}
              max={60}
              color="#6366f1"
              trackColor="#c7d2fe"
              darkTrackColor="#1e1b4b"
              isDark={isDark}
              label="Active Minutes"
              sublabel="Goal: 60 min"
              icon={TimerIcon}
              iconColor="text-indigo-500"
            />
          </div>

          {/* Remaining badge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className={`mt-5 text-center text-sm font-semibold py-2.5 rounded-xl ${
              remainingCal >= 0
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            }`}
          >
            {remainingCal >= 0
              ? `✅ ${remainingCal} kcal remaining today`
              : `⚠️ ${Math.abs(remainingCal)} kcal over your daily limit`}
          </motion.p>
        </motion.div>

        {/* ── Mini stat chips ── */}
        <div className="dashboard-card-grid">
          <StatChip
            icon={ActivityIcon}
            label="Active minutes today"
            value={`${totalMinutes} min`}
            gradient="from-blue-400 to-indigo-500"
            delay={0.1}
          />
          <StatChip
            icon={ZapIcon}
            label="Workouts logged"
            value={todayActivities.length}
            gradient="from-violet-400 to-purple-500"
            delay={0.15}
          />
        </div>

        {/* ── Goal card ── */}
        {user && (
          <motion.div
            variants={fadeUp(0.2)}
            initial="hidden"
            animate="show"
            className="bg-gradient-to-br from-slate-800 to-slate-700
              dark:from-slate-800 dark:to-slate-900
              rounded-2xl p-5 shadow-md border border-slate-700/50
              relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUpIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Your Goal</p>
                <p className="text-white font-bold text-lg mt-0.5 leading-snug">
                  {user.goal === "lose"     && "🔥 Lose Weight"}
                  {user.goal === "maintain" && "⚖️ Maintain Weight"}
                  {user.goal === "gain"     && "💪 Gain Muscle"}
                </p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {user.goal === "lose"     && "Stay in a calorie deficit daily."}
                  {user.goal === "maintain" && "Balance your intake & output."}
                  {user.goal === "gain"     && "Eat a surplus & train hard."}
                </p>
              </div>
            </div>

            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute bottom-3 right-4"
            >
              <SparklesIcon className="w-5 h-5 text-emerald-400/60" />
            </motion.div>
          </motion.div>
        )}

        {/* ── Body Metrics card ── */}
        {user?.weight && (
          <motion.div
            variants={fadeUp(0.25)}
            initial="hidden"
            animate="show"
            className="bg-white dark:bg-slate-900
              border border-slate-100 dark:border-slate-800
              rounded-2xl shadow-sm p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <ScaleIcon className="w-4 h-4 text-indigo-500" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white text-sm">Body Metrics</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: ScaleIcon, label: "Weight", value: `${user.weight} kg`, color: "text-indigo-500" },
                { icon: RulerIcon, label: "Height", value: user.height ? `${user.height} cm` : "—", color: "text-violet-500" },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <m.icon className={`w-4 h-4 ${m.color} mb-1`} />
                  <p className="text-lg font-extrabold text-slate-800 dark:text-white">{m.value}</p>
                  <p className="text-xs text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>

            {/* BMI animated gauge */}
            {bmi && bmiStatus && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">BMI</span>
                  <span className="font-extrabold text-base" style={{ color: bmiStatus.color }}>
                    {bmi}{" "}
                    <span className="text-xs font-semibold">({bmiStatus.label})</span>
                  </span>
                </div>

                {/* Segmented track */}
                <div className="h-2.5 w-full rounded-full overflow-hidden flex gap-0.5">
                  {[
                    { color: "#93c5fd", flex: 25 },
                    { color: "#6ee7b7", flex: 30 },
                    { color: "#fcd34d", flex: 25 },
                    { color: "#fca5a5", flex: 20 },
                  ].map((seg, i) => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{ flex: seg.flex, backgroundColor: seg.color, opacity: 0.65 }}
                    />
                  ))}
                </div>

                {/* Needle dot */}
                <div className="relative h-3">
                  <motion.div
                    initial={{ left: "0%" }}
                    animate={{ left: `${bmiStatus.pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    className="absolute -top-0.5 w-3.5 h-3.5 rounded-full
                      border-2 border-white dark:border-slate-900 shadow-md"
                    style={{
                      backgroundColor: bmiStatus.color,
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                  <span>Under</span>
                  <span>Healthy</span>
                  <span>Over</span>
                  <span>Obese</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Today's Summary ── */}
        <motion.div
          variants={fadeUp(0.3)}
          initial="hidden"
          animate="show"
          className="bg-white dark:bg-slate-900
            border border-slate-100 dark:border-slate-800
            rounded-2xl shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <CalendarDaysIcon className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="font-bold text-slate-800 dark:text-white text-sm">Today's Summary</h2>
          </div>

          <div className="space-y-0.5">
            {summaryRows.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-center justify-between py-2.5
                  border-b last:border-0
                  border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <row.icon className={`w-3.5 h-3.5 flex-shrink-0 ${row.color}`} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  {row.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Weekly Progress Chart (full width) ── */}
        <motion.div
          variants={fadeUp(0.35)}
          initial="hidden"
          animate="show"
          className="col-span-2 bg-white dark:bg-slate-900
            border border-slate-100 dark:border-slate-800
            rounded-2xl shadow-sm p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                <TrendingUpIcon className="w-4 h-4 text-violet-500" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white text-sm">This Week's Progress</h2>
            </div>

            <div className="flex items-center gap-3">
              {[
                { label: "Intake", color: "#10b981" },
                { label: "Burn",   color: "#f97316" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <CaloriesChart />
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;