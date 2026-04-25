import { motion } from "framer-motion";
import { FlameIcon, TrophyIcon } from "lucide-react";

interface CalorieProgressBarProps {
  burned: number;
  goal: number;
}

/**
 * Animated gradient progress bar showing daily calorie burn vs goal.
 * – Smooth spring animation on value change
 * – Colour shifts from blue → green → amber → red as goal fills
 * – Accessible with aria-valuenow/min/max
 */
const CalorieProgressBar = ({ burned, goal }: CalorieProgressBarProps) => {
  const rawPct = goal > 0 ? (burned / goal) * 100 : 0;
  const pct = Math.min(rawPct, 100);

  // Dynamic gradient colour based on completion
  const barGradient =
    pct >= 100
      ? "from-emerald-400 to-green-500"
      : pct >= 75
      ? "from-amber-400 to-orange-500"
      : pct >= 40
      ? "from-blue-400 to-indigo-500"
      : "from-violet-400 to-blue-500";

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <FlameIcon className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Calorie Burn Goal
          </span>
        </div>

        {pct >= 100 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
          >
            <TrophyIcon className="w-3.5 h-3.5" /> Goal Reached!
          </motion.span>
        )}
      </div>

      {/* Numbers */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-extrabold text-slate-800 dark:text-white tabular-nums">
            {burned}
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">kcal burned</span>
        </div>
        <span className="text-sm text-slate-400 dark:text-slate-500 mb-1">
          Goal: <strong className="text-slate-600 dark:text-slate-300">{goal}</strong>
        </span>
      </div>

      {/* Track */}
      <div
        className="relative h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden"
        role="progressbar"
        aria-valuenow={burned}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barGradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        />
      </div>

      {/* Percentage label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">0</span>
        <motion.span
          key={Math.round(pct)}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-bold text-slate-600 dark:text-slate-300"
        >
          {Math.round(pct)}% complete
        </motion.span>
        <span className="text-slate-400">{goal}</span>
      </div>
    </div>
  );
};

export default CalorieProgressBar;
