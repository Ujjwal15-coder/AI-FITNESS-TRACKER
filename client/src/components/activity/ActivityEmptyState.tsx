import { motion } from "framer-motion";
import { DumbbellIcon, PlusIcon } from "lucide-react";

interface ActivityEmptyStateProps {
  onAdd: () => void;
}

/**
 * Illustrated empty state for the activity list.
 * Features a bouncing dumbbell illustration, motivational copy,
 * and a prominent CTA to add the first activity of the day.
 */
const ActivityEmptyState = ({ onAdd }: ActivityEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center py-12 px-6"
    >
      {/* Animated icon illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400/30 to-blue-400/20 blur-xl scale-125" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
          <DumbbellIcon className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Copy */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        No workouts logged yet
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
        Every great journey starts with a single step. Log your first workout and start building your streak! 💪
      </p>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 
          bg-gradient-to-r from-violet-500 to-blue-600 
          text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30
          hover:shadow-blue-500/50 transition-shadow duration-200"
      >
        <PlusIcon className="w-4 h-4" />
        Log First Workout
      </motion.button>
    </motion.div>
  );
};

export default ActivityEmptyState;
