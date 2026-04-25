/**
 * Profile.tsx — User Profile Page
 *
 * Features:
 *  - View / Edit mode toggle with conditional rendering
 *  - Profile save via mockApi with toast feedback
 *  - Dark / Light theme toggle via ThemeContext
 *  - Stats sidebar: total food entries + total activity logs
 *  - "Member since" display from user.createdAt
 *  - Framer Motion micro-animations on cards and buttons
 *  - Fully responsive (mobile-first, 1-col → 2-col on lg)
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  UserIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  ScaleIcon,
  RulerIcon,
  CalendarIcon,
  TargetIcon,
  UtensilsIcon,
  ActivityIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  CameraIcon,
  Trash2Icon,
  LogOutIcon,
} from "lucide-react";

import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { goalLabels, goalOptions } from "../assets/assets";

import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import api from "../lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileFormData {
  age: number;
  weight: number;
  height: number;
  goal: "lose" | "maintain" | "gain";
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Format an ISO date string to "Month YYYY" */
function formatMemberSince(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Calculate BMI from weight (kg) and height (cm) */
function calcBMI(weight: number, height: number): string {
  if (!weight || !height) return "—";
  const bmi = weight / Math.pow(height / 100, 2);
  return bmi.toFixed(1);
}

/** BMI category label */
function bmiCategory(bmi: string): { label: string; color: string } {
  const n = parseFloat(bmi);
  if (isNaN(n)) return { label: "—", color: "text-slate-400" };
  if (n < 18.5) return { label: "Underweight", color: "text-blue-500" };
  if (n < 25)   return { label: "Healthy",     color: "text-emerald-500" };
  if (n < 30)   return { label: "Overweight",  color: "text-amber-500" };
  return          { label: "Obese",           color: "text-red-500" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single info row shown in view mode */
const InfoRow = ({
  icon: Icon,
  label,
  value,
  accent = "text-slate-800 dark:text-white",
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) => (
  <div className="profile-info-row">
    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`font-semibold truncate ${accent}`}>{value}</p>
    </div>
  </div>
);

/** A stat card shown in the right column */
const StatCard = ({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  gradient: string;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900
      border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-800 dark:text-white tabular-nums">
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Profile = () => {
  // ── Context ──
  const { user, setUser, allFoodLogs, allActivityLogs, logout } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  // ── Local State ──
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);

  // Photo stored as base64 string in localStorage keyed by user id
  const PHOTO_KEY = `profile_photo_${user?.id ?? "guest"}`;
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    () => localStorage.getItem(`profile_photo_${user?.id ?? "guest"}`) ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Re-read the correct photo key when the user id changes (e.g. after login) */
  useEffect(() => {
    setPhotoUrl(localStorage.getItem(`profile_photo_${user?.id ?? "guest"}`) ?? null);
  }, [user?.id]);

  /** Convert uploaded file to base64 and persist in localStorage */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guard: only images, max 5 MB
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      localStorage.setItem(PHOTO_KEY, base64);
      setPhotoUrl(base64);
      toast.success("Profile photo updated! 📸");
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  /** Remove the current photo */
  const handleRemovePhoto = () => {
    localStorage.removeItem(PHOTO_KEY);
    setPhotoUrl(null);
    toast("Photo removed.");
  };
  const [formData, setFormData] = useState<ProfileFormData>({
    age:    user?.age    ?? 0,
    weight: user?.weight ?? 0,
    height: user?.height ?? 0,
    goal:   (user?.goal  ?? "maintain") as ProfileFormData["goal"],
  });

  /** Keep form in sync if user loads asynchronously */
  useEffect(() => {
    if (user) {
      setFormData({
        age:    user.age    ?? 0,
        weight: user.weight ?? 0,
        height: user.height ?? 0,
        goal:   (user.goal  ?? "maintain") as ProfileFormData["goal"],
      });
    }
  }, [user]);

  // ── Derived ──
  const bmi     = calcBMI(formData.weight, formData.height);
  const bmiInfo = bmiCategory(bmi);

  const totalFoodEntries    = allFoodLogs.length;
  const totalActivityLogs   = allActivityLogs.length;
  const totalCaloriesBurned = allActivityLogs.reduce((s, a) => s + a.calories, 0);

  // ── Handlers ──

  /** Cancel editing — reset form to current user values */
  const handleCancel = () => {
    setFormData({
      age:    user?.age    ?? 0,
      weight: user?.weight ?? 0,
      height: user?.height ?? 0,
      goal:   (user?.goal  ?? "maintain") as ProfileFormData["goal"],
    });
    setIsEditing(false);
  };

  /** Save updated profile via API */
  const handleSave = async () => {
    if (formData.age <= 0 || formData.weight <= 0 || formData.height <= 0) {
      toast("⚠️ Please fill in all fields with valid values.");
      return;
    }

    if (!user?.id) return;

    setIsSaving(true);
    const toastId = toast.loading("Saving profile…");

    try {
      // Strapi v5 update user endpoint: PUT /api/users/:id
      const { data } = await api.put(`/users/${user.id}`, {
        age:    formData.age,
        weight: formData.weight,
        height: formData.height,
        goal:   formData.goal,
      });

      // Update context so the rest of the app sees the new values
      setUser((prev) => prev ? { ...prev, ...data } : prev);
      setIsEditing(false);
      toast.success("Profile updated! 🎉", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? "Failed to save profile.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Hero Header ── */}
      <div className="dashboard-header relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-10 w-32 h-32 rounded-full bg-emerald-300/20 blur-xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {/* ── Avatar with photo upload ── */}
            <div className="relative flex-shrink-0">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                aria-label="Upload profile photo"
              />

              {/* Avatar circle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
                className="relative w-16 h-16 rounded-2xl overflow-hidden
                  bg-white/20 backdrop-blur-sm border-2 border-white/40
                  flex items-center justify-center shadow-lg group cursor-pointer"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-white select-none">
                    {user?.username?.[0]?.toUpperCase() ?? "U"}
                  </span>
                )}

                {/* Camera overlay on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-0.5"
                >
                  <CameraIcon className="w-5 h-5 text-white" />
                  <span className="text-white text-[9px] font-semibold">Change</span>
                </motion.div>
              </motion.button>

              {/* Remove button — only shown when a photo exists */}
              <AnimatePresence>
                {photoUrl && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={handleRemovePhoto}
                    title="Remove photo"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                      bg-red-500 border-2 border-white dark:border-slate-900
                      flex items-center justify-center shadow-md
                      hover:bg-red-600 transition-colors"
                  >
                    <Trash2Icon className="w-2.5 h-2.5 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {user?.username ?? "User"}
              </h1>
              <p className="text-emerald-100 text-sm mt-0.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                Member since {formatMemberSince(user?.createdAt)}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                <ShieldCheckIcon className="w-3 h-3" />
                {user?.email ?? "—"}
              </span>
            </div>
          </div>

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30
              flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <SunIcon className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <MoonIcon className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="profile-content">

        {/* ╔══════════════════════════╗ */}
        {/* ║  LEFT — Profile Details  ║ */}
        {/* ╚══════════════════════════╝ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* ── Profile Card ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">

            {/* Card header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">
                  Personal Info
                </h2>
              </div>

              {/* Edit / Save / Cancel controls */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!py-2 !px-3 text-xs"
                      onClick={handleCancel}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="!py-2 !px-3 text-xs"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      {isSaving ? "Saving…" : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-2 !px-3 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* ── View Mode ── */}
            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <InfoRow icon={CalendarIcon} label="Age"    value={user?.age    ? `${user.age} years`  : "Not set"} />
                  <InfoRow icon={ScaleIcon}    label="Weight" value={user?.weight  ? `${user.weight} kg` : "Not set"} />
                  <InfoRow icon={RulerIcon}    label="Height" value={user?.height  ? `${user.height} cm` : "Not set"} />
                  <InfoRow
                    icon={TargetIcon}
                    label="Fitness Goal"
                    value={goalLabels[user?.goal ?? "maintain"]}
                    accent={
                      user?.goal === "lose" ? "text-blue-600 dark:text-blue-400"
                        : user?.goal === "gain" ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                    }
                  />
                  {/* BMI quick-view */}
                  <div className="profile-info-row">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <TrendingUpIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">BMI</p>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {bmi}{" "}
                        <span className={`text-sm font-medium ${bmiInfo.color}`}>
                          ({bmiInfo.label})
                        </span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── Edit Mode ── */
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Age"
                      type="number"
                      min={10}
                      max={120}
                      placeholder="30"
                      value={formData.age || ""}
                      onChange={(v) =>
                        setFormData((f) => ({ ...f, age: Number(v) }))
                      }
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      min={20}
                      max={300}
                      placeholder="70"
                      value={formData.weight || ""}
                      onChange={(v) =>
                        setFormData((f) => ({ ...f, weight: Number(v) }))
                      }
                    />
                  </div>

                  <Input
                    label="Height (cm)"
                    type="number"
                    min={100}
                    max={250}
                    placeholder="175"
                    value={formData.height || ""}
                    onChange={(v) =>
                      setFormData((f) => ({ ...f, height: Number(v) }))
                    }
                  />

                  <Select
                    label="Fitness Goal"
                    value={formData.goal}
                    options={goalOptions}
                    onChange={(v) =>
                      setFormData((f) => ({
                        ...f,
                        goal: v as ProfileFormData["goal"],
                      }))
                    }
                  />

                  {/* Live BMI preview while editing */}
                  {formData.weight > 0 && formData.height > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40"
                    >
                      <TrendingUpIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <p className="text-sm text-violet-700 dark:text-violet-300">
                        BMI Preview:{" "}
                        <strong>{bmi}</strong>{" "}
                        <span className={bmiInfo.color}>({bmiInfo.label})</span>
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Logout Button ── */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                className="w-full flex justify-center items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30 transition-colors"
                onClick={logout}
              >
                <LogOutIcon className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>

          {/* ── Daily Targets Card ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
              <TargetIcon className="w-4 h-4 text-emerald-500" />
              Daily Targets
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Calorie Intake",
                  value: user?.dailyCalorieIntake ?? 2000,
                  unit: "kcal",
                  color: "text-orange-500",
                },
                {
                  label: "Calorie Burn",
                  value: user?.dailyCalorieBurn ?? 400,
                  unit: "kcal",
                  color: "text-blue-500",
                },
              ].map((t) => (
                <div
                  key={t.label}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center"
                >
                  <p className={`text-xl font-extrabold tabular-nums ${t.color}`}>
                    {t.value}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {t.label}
                  </p>
                  <p className="text-xs text-slate-400">{t.unit}/day</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ╔═══════════════════════╗ */}
        {/* ║  RIGHT — Stats Panel  ║ */}
        {/* ╚═══════════════════════╝ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-4"
        >
          {/* ── Activity Overview ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-blue-500" />
              Activity Overview
            </h2>
            <div className="space-y-3">
              <StatCard
                icon={UtensilsIcon}
                label="Total Food Entries"
                value={totalFoodEntries}
                gradient="from-orange-400 to-amber-500"
              />
              <StatCard
                icon={ActivityIcon}
                label="Total Workouts Logged"
                value={totalActivityLogs}
                gradient="from-blue-400 to-indigo-500"
              />
              <StatCard
                icon={TrendingUpIcon}
                label="Total Calories Burned"
                value={`${totalCaloriesBurned} kcal`}
                gradient="from-emerald-400 to-teal-500"
              />
            </div>
          </div>

          {/* ── Goal & Progress Card ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm mb-4 flex items-center gap-2">
              <TargetIcon className="w-4 h-4 text-violet-500" />
              Current Goal
            </h2>

            {/* Goal display */}
            <div className={`p-4 rounded-xl text-center ${formData.goal === "lose" ? "bg-blue-50   dark:bg-blue-900/20  border border-blue-100   dark:border-blue-800/40"
              : formData.goal === "gain" ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40"
                : "bg-amber-50  dark:bg-amber-900/20  border border-amber-100  dark:border-amber-800/40"
              }`}>
              <p className="text-3xl mb-1">
                {formData.goal === "lose" ? "🔥" : formData.goal === "gain" ? "💪" : "⚖️"}
              </p>
              <p className={`font-extrabold text-lg ${formData.goal === "lose" ? "text-blue-600 dark:text-blue-400"
                : formData.goal === "gain" ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
                }`}>
                {goalLabels[formData.goal]}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.goal === "lose"
                  ? "Stay in a calorie deficit to shed weight."
                  : formData.goal === "gain"
                    ? "Eat in a surplus and lift heavy!"
                    : "Balance your intake and output daily."}
              </p>
            </div>

            {/* Tip */}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
              Change your goal anytime via the <strong>Edit</strong> button.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;