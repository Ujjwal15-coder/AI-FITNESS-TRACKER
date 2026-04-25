/**
 * ActivityLog.tsx — Enhanced Activity Tracking Page
 *
 * Key improvements over the original:
 *  1. Framer Motion – staggered list, add/remove animations, micro-interactions
 *  2. Progress Bar  – animated gradient calorie-burn goal tracker
 *  3. Theme toggle  – reads from existing ThemeContext (persisted via localStorage)
 *  4. Filtering     – by date (today vs. all) and workout type
 *  5. Skeleton UX   – loading state while data is being fetched
 *  6. Delete        – optimistic UI removal with animation
 *  7. Summary stats – total mins, total kcal, activity count
 *  8. Modular code  – extracted ActivityCard, CalorieProgressBar, EmptyState, Skeleton
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  PlusIcon,
  SunIcon,
  MoonIcon,
  FilterIcon,
  ActivityIcon,
  TimerIcon,
  FlameIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import type { ActivityEntry } from "../types";
import { quickActivities } from "../assets/assets";
import mockApi from "../assets/mockApi";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

// ── Extracted sub-components (see /components/activity/) ──
import ActivityCard from "../components/activity/ActivityCard";
import CalorieProgressBar from "../components/activity/CalorieProgressBar";
import ActivityEmptyState from "../components/activity/ActivityEmptyState";
import ActivitySkeleton from "../components/activity/ActivitySkeleton";
import api from "../lib/axios";

// ─── Animation Variants ───────────────────────────────────────────────────────

/** Staggered container: children fade-in one after another */
const listContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

/** Each list item slides up */
const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

/** Form reveal animation — uses opacity+scale (more reliable than height:auto) */
const formVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18 } },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = "today" | "all";
type WorkoutFilter = "all" | string; // workout name or "all"

// ─── Component ───────────────────────────────────────────────────────────────

const ActivityLog = () => {
  // ── Context ──
  const { allActivityLogs, setAllActivityLogs, user } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  // ── Local state ──
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<FilterType>("today");
  const [typeFilter, setTypeFilter] = useState<WorkoutFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    duration: 0,
    calories: 0,
  });

  // ── Derived values ──
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  /**
   * Filter the master list by date (today / all) and then
   * optionally by workout type. Memoised to avoid unnecessary
   * re-renders of child components.
   */
  const filteredActivities = useMemo<ActivityEntry[]>(() => {
    let list = allActivityLogs;

    // Date filter
    if (dateFilter === "today") {
      list = list.filter((a) => a.createdAt?.split("T")[0] === today);
    }

    // Workout type filter
    if (typeFilter !== "all") {
      list = list.filter((a) => a.name === typeFilter);
    }

    return list;
  }, [allActivityLogs, dateFilter, typeFilter, today]);

  /** Today-only activities used for summary stats */
  const todayActivities = useMemo(
    () => allActivityLogs.filter((a) => a.createdAt?.split("T")[0] === today),
    [allActivityLogs, today]
  );

  const totalMinutes = useMemo(
    () => todayActivities.reduce((s, a) => s + a.duration, 0),
    [todayActivities]
  );

  const totalCalories = useMemo(
    () => todayActivities.reduce((s, a) => s + a.calories, 0),
    [todayActivities]
  );

  /** Unique workout names in the full log (for the type filter chip list) */
  const uniqueWorkoutTypes = useMemo(
    () => Array.from(new Set(allActivityLogs.map((a) => a.name))),
    [allActivityLogs]
  );

  /** Calorie burn goal from user profile, fallback 400 kcal */
  const calorieGoal = user?.dailyCalorieBurn ?? 400;

  // ── Load activities ──
  useEffect(() => {
    // The real fetch is done in AppContext. We just track local loading state.
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [allActivityLogs]);

  // ── Handlers ──

  /** Pre-fills the form when a quick-add chip is clicked */
  const handleQuickAdd = useCallback(
    (activity: { name: string; rate: number }) => {
      setFormData({
        name: activity.name,
        duration: 30,
        calories: 30 * activity.rate,
      });
      setShowForm(true);
    },
    []
  );

  /**
   * When duration changes, auto-recalculate calories for known activities.
   * This avoids stale closures by re-reading formData.name from the setter.
   */
  const handleDurationChange = useCallback(
    (val: string | number) => {
      const duration = Number(val);
      setFormData((prev) => {
        const activity = quickActivities.find((a) => a.name === prev.name);
        const calories = activity ? duration * activity.rate : prev.calories;
        return { ...prev, duration, calories };
      });
    },
    []
  );

  /** Submit the new activity form */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.duration <= 0) {
      toast("⚠️ Please enter a valid activity name and duration.");
      return;
    }

    const toastId = toast.loading("Logging activity…");
    try {
      // Map frontend fields (name/calories) to Strapi schema (activityName/caloriesBurned)
      const { data } = await api.post("/activity-logs", {
        data: {
          name: formData.name,
          duration: formData.duration,
          calories: formData.calories,
        }
      });

      // Strapi v5 returns flattened data. Map back to frontend type.
      const newEntry: ActivityEntry = {
        id: data.data.id,
        documentId: data.data.documentId,
        name: data.data.name,
        duration: data.data.duration,
        calories: data.data.calories,
        createdAt: data.data.createdAt,
        date: data.data.createdAt?.split('T')[0] || today,
      };

      setAllActivityLogs((prev) => [...prev, newEntry]);
      setFormData({ name: "", duration: 0, calories: 0 });
      setShowForm(false);
      toast.success("Activity logged! 🎉", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? "Failed to add activity.", { id: toastId });
    }
  };

  /** Delete an activity with optimistic UI */
  const handleDelete = useCallback(
    async (documentId: string) => {
      setDeletingId(documentId);
      try {
        // Strapi v5 deletes via documentId
        await api.delete(`/activity-logs/${documentId}`);
        // Optimistic removal
        setAllActivityLogs((prev) => prev.filter((a) => a.documentId !== documentId));
        toast.success("Activity removed.");
      } catch (err: any) {
        toast.error("Could not delete activity.");
      } finally {
        setDeletingId(null);
      }
    },
    [setAllActivityLogs]
  );

  const resetForm = useCallback(() => {
    setShowForm(false);
    setFormData({ name: "", duration: 0, calories: 0 });
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center justify-between gap-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight"
            >
              Activity Log
            </motion.h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Right: stats + theme toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-right">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {totalMinutes} min
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Burned</p>
                <p className="text-lg font-bold text-orange-500">
                  {totalCalories} kcal
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center
                text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700
                transition-colors duration-150 shadow-sm"
            >
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SunIcon className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <MoonIcon className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile mini-stats */}
        <div className="flex sm:hidden gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold">
            <TimerIcon className="w-4 h-4" />
            {totalMinutes} min
          </div>
          <div className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold">
            <FlameIcon className="w-4 h-4" />
            {totalCalories} kcal
          </div>
        </div>
      </div>

      {/* ── Page Content Grid ── */}
      <div className="page-content-grid">

        {/* ╔══════════════════════════════╗ */}
        {/* ║  LEFT COLUMN: Add / Filters  ║ */}
        {/* ╚══════════════════════════════╝ */}
        <div className="space-y-4">

          {/* ── Calorie Progress Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5"
          >
            <CalorieProgressBar burned={totalCalories} goal={calorieGoal} />
          </motion.div>

          {/* ── Quick Add Chips / Form — one panel at a time ── */}
          {/*
            IMPORTANT: Use a ternary (single child) inside AnimatePresence so
            that key changes from "quick-add" → "form" correctly trigger the
            exit animation of the old panel before entering the new one.
            Two separate `&&` conditionals break this because AnimatePresence
            sees them as independent children and doesn't sequence the transition.
          */}
          <AnimatePresence mode="wait">
            {!showForm ? (
              /* ── Quick Add Chips ── */
              <motion.div
                key="quick-add"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4"
              >
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  ⚡ Quick Add
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quickActivities.map((activity) => (
                    <motion.button
                      key={activity.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleQuickAdd(activity)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 
                        hover:bg-gradient-to-r hover:from-violet-100 hover:to-blue-100 
                        dark:hover:from-violet-900/40 dark:hover:to-blue-900/40
                        rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 
                        transition-all duration-150 border border-transparent 
                        hover:border-violet-200 dark:hover:border-violet-800"
                    >
                      {activity.emoji} {activity.name}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 
                    bg-gradient-to-r from-violet-500 to-blue-600 
                    text-white font-semibold rounded-xl shadow-md shadow-blue-500/20
                    hover:shadow-blue-500/40 transition-shadow duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Custom Activity
                </motion.button>
              </motion.div>
            ) : (
              /* ── Add Activity Form ── */
              <motion.div
                key="form"
                variants={formVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-violet-200 dark:border-violet-800/60 shadow-md p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">New Activity</h3>
                  <button
                    onClick={resetForm}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center
                      text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Input
                    label="Activity Name"
                    placeholder="e.g., Morning Run"
                    required
                    value={formData.name}
                    onChange={(v) => setFormData((f) => ({ ...f, name: v.toString() }))}
                  />

                  <div className="flex gap-3">
                    <Input
                      label="Duration (min)"
                      type="number"
                      className="flex-1"
                      min={1}
                      max={300}
                      placeholder="30"
                      required
                      value={formData.duration || ""}
                      onChange={handleDurationChange}
                    />
                    <Input
                      label="Calories Burned"
                      type="number"
                      className="flex-1"
                      min={1}
                      max={5000}
                      placeholder="200"
                      required
                      value={formData.calories || ""}
                      onChange={(v) => setFormData((f) => ({ ...f, calories: Number(v) }))}
                    />
                  </div>

                  {/* Calorie auto-calc hint */}
                  {quickActivities.find((a) => a.name === formData.name) && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckIcon className="w-3 h-3" /> Calories auto-calculated from duration
                    </motion.p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Log Activity
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ╔═══════════════════════════════╗ */}
        {/* ║  RIGHT COLUMN: Activity List  ║ */}
        {/* ╚═══════════════════════════════╝ */}
        <div className="space-y-4">

          {/* ── Filters Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Date toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {(["today", "all"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${dateFilter === f
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                  >
                    {f === "today" ? "Today" : "All Time"}
                  </button>
                ))}
              </div>

              {/* Filter toggle */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowFilters((s) => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                  transition-colors duration-150 ${showFilters || typeFilter !== "all"
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
              >
                <FilterIcon className="w-3.5 h-3.5" />
                Type{typeFilter !== "all" ? `: ${typeFilter}` : ""}
              </motion.button>
            </div>

            {/* Workout type chips */}
            <AnimatePresence>
              {showFilters && uniqueWorkoutTypes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 mt-3 overflow-hidden"
                >
                  <button
                    onClick={() => setTypeFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === "all"
                      ? "bg-violet-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                  >
                    All
                  </button>
                  {uniqueWorkoutTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === type
                        ? "bg-violet-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Activities List Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5"
          >
            {/* Card header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <ActivityIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                  {dateFilter === "today" ? "Today's Activities" : "All Activities"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredActivities.length} workout{filteredActivities.length !== 1 ? "s" : ""}
                  {typeFilter !== "all" && ` · ${typeFilter}`}
                </p>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading ? (
              <ActivitySkeleton count={3} />
            ) : filteredActivities.length === 0 ? (
              /* Empty state */
              <ActivityEmptyState onAdd={() => setShowForm(true)} />
            ) : (
              /* Staggered animated list */
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <AnimatePresence>
                  {filteredActivities.map((activity) => (
                    <motion.div key={activity.id} variants={listItem}>
                      <ActivityCard
                        activity={activity}
                        onDelete={handleDelete}
                        isDeleting={deletingId === activity.documentId}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Summary Footer ── */}
            {!isLoading && filteredActivities.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 
                  grid grid-cols-3 gap-2 text-center"
              >
                {[
                  {
                    value: filteredActivities.length,
                    label: "Workouts",
                    color: "text-violet-600 dark:text-violet-400",
                  },
                  {
                    value: `${filteredActivities.reduce((s, a) => s + a.duration, 0)} min`,
                    label: "Total Time",
                    color: "text-blue-600 dark:text-blue-400",
                  },
                  {
                    value: `${filteredActivities.reduce((s, a) => s + a.calories, 0)} kcal`,
                    label: "Total Burned",
                    color: "text-orange-500",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className={`text-base font-extrabold ${stat.color} tabular-nums`}>{stat.value}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;