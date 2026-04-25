import { motion } from "framer-motion";
import { TimerIcon, FlameIcon, TrashIcon, ZapIcon } from "lucide-react";
import type { ActivityEntry } from "../../types";

// Map activity names to gradient styles for visual variety
const ACTIVITY_GRADIENTS: Record<string, string> = {
  Walking:        "from-teal-400 to-cyan-500",
  Running:        "from-orange-400 to-red-500",
  Cycling:        "from-blue-400 to-indigo-500",
  Swimming:       "from-sky-400 to-blue-500",
  Yoga:           "from-purple-400 to-pink-500",
  "Weight Training": "from-amber-400 to-orange-500",
};

const ACTIVITY_EMOJIS: Record<string, string> = {
  Walking: "🚶",
  Running: "🏃",
  Cycling: "🚴",
  Swimming: "🏊",
  Yoga: "🧘",
  "Weight Training": "🏋️",
};

function getGradient(name: string) {
  return ACTIVITY_GRADIENTS[name] ?? "from-emerald-400 to-teal-500";
}

function getEmoji(name: string) {
  return ACTIVITY_EMOJIS[name] ?? "⚡";
}

function formatTime(createdAt?: string): string {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface ActivityCardProps {
  activity: ActivityEntry;
  onDelete?: (documentId: string) => void;
  isDeleting?: boolean;
}

/** Individual animated activity card with micro-interactions */
const ActivityCard = ({ activity, onDelete, isDeleting }: ActivityCardProps) => {
  const gradient = getGradient(activity.name);
  const emoji = getEmoji(activity.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileHover={{ y: -2 }}
      className="group relative flex items-center gap-4 p-4 
        bg-white dark:bg-slate-800/60 
        border border-slate-100 dark:border-slate-700/60 
        rounded-2xl shadow-sm hover:shadow-md 
        transition-shadow duration-200"
    >
      {/* Colored icon badge */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} 
          flex items-center justify-center text-xl shadow-md`}
      >
        {emoji}
      </div>

      {/* Activity info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-white truncate">
          {activity.name}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {formatTime(activity.createdAt)}
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end gap-1.5 mr-2">
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <TimerIcon className="w-3.5 h-3.5 text-blue-500" />
          {activity.duration} min
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
          <FlameIcon className="w-3.5 h-3.5" />
          {activity.calories} kcal
        </span>
      </div>

      {/* Delete button – slides in on hover */}
      {onDelete && (
        <motion.button
          onClick={() => onDelete(activity.documentId)}
          disabled={isDeleting}
          title="Delete activity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="opacity-0 group-hover:opacity-100 absolute right-3 top-3
            w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 
            flex items-center justify-center text-red-500
            hover:bg-red-100 dark:hover:bg-red-900/50
            transition-all duration-150 disabled:opacity-40"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {/* Subtle intensity indicator dot */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${gradient}`} />
    </motion.div>
  );
};

export default ActivityCard;
