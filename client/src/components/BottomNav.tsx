import { Activity, Home, MoonIcon, SunIcon, User, Utensils } from "lucide-react"
import { NavLink } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "../context/ThemeContext"

const BottomNav = () => {
    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/food', label: 'Food', icon: Utensils },
        { path: '/activity', label: 'Activity', icon: Activity },
        { path: '/profile', label: 'Profile', icon: User },
    ]

    const { theme, toggleTheme } = useTheme()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 pb-safe lg:hidden transition-colors duration-300 shadow-lg shadow-black/5">
            <div className="max-w-lg mx-auto flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <motion.div
                                    animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <item.icon className="w-5 h-5" />
                                </motion.div>
                                <span className="text-xs font-medium">{item.label}</span>
                                {/* Active indicator dot */}
                                {isActive && (
                                    <motion.div
                                        layoutId="bottom-nav-dot"
                                        className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-emerald-500"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Theme toggle — mobile only */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                        text-slate-400 dark:text-slate-500
                        hover:text-slate-600 dark:hover:text-slate-300
                        transition-colors duration-200"
                >
                    <AnimatePresence mode="wait">
                        {theme === 'dark' ? (
                            <motion.div
                                key="sun"
                                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                                transition={{ duration: 0.2 }}
                            >
                                <SunIcon className="w-5 h-5 text-amber-400" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="moon"
                                initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                                transition={{ duration: 0.2 }}
                            >
                                <MoonIcon className="w-5 h-5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className="text-xs font-medium">
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </span>
                </motion.button>
            </div>
        </nav>
    )
}

export default BottomNav