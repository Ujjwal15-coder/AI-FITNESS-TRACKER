import { motion } from "framer-motion";

interface ActivitySkeletonProps {
  count?: number;
}

/** Loading skeleton cards shown while activities are being fetched */
const ActivitySkeleton = ({ count = 3 }: ActivitySkeletonProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-4 p-4 
            bg-white dark:bg-slate-800/60 
            border border-slate-100 dark:border-slate-700/60 
            rounded-2xl"
        >
          {/* Icon placeholder */}
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />

          {/* Text lines */}
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-2/5 animate-pulse" />
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full w-1/4 animate-pulse" />
          </div>

          {/* Stat placeholders */}
          <div className="flex flex-col items-end gap-2">
            <div className="h-2.5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-2.5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ActivitySkeleton;
