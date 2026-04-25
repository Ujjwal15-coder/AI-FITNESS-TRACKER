import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';

import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// ─── Custom themed tooltip ───────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg p-3 text-xs min-w-[120px]">
            <p className="font-semibold text-slate-700 dark:text-white mb-2">{label || 'Daily'}</p>
            {payload.map((entry: any) => (
                <div key={entry.name || Math.random()} className="flex items-center gap-2 mb-1 last:mb-0">
                    <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color || entry.fill }}
                    />
                    <span className="text-slate-500 dark:text-slate-400">{(entry.name || entry.dataKey)}:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {entry.value} kcal
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Bar radius tuple (typed so TS doesn't widen to number[]) ─────────────────
const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];

// ─── Chart component ─────────────────────────────────────────────────────────

const CaloriesChart = () => {
    const { allActivityLogs, allFoodLogs } = useAppContext();
    const { theme } = useTheme();

    const isDark = theme === 'dark';

    // Theme-aware colours
    const axisTickColor   = isDark ? '#94a3b8' : '#64748b';
    const gridStrokeColor = isDark ? '#334155' : '#f1f5f9';
    const bgColor         = isDark ? '#0f172a' : '#f8fafc';
    const cursorFill      = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    // Memoized chart data — fixes React Compiler "unmemoized computation" warning
    const data = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const dateString = date.toISOString().split('T')[0];
            const dayName    = date.toLocaleDateString('en-US', { weekday: 'short' });

            const intake = allFoodLogs
                .filter(l => l.createdAt?.split('T')[0] === dateString)
                .reduce((s, f) => s + f.calories, 0);

            const burn = allActivityLogs
                .filter(l => l.createdAt?.split('T')[0] === dateString)
                .reduce((s, a) => s + (a.calories ?? 0), 0);

            return { name: dayName, Intake: intake, Burn: burn };
        });
    }, [allFoodLogs, allActivityLogs]);

    return (
        <div
            className="w-full h-[280px] mt-2 rounded-xl transition-colors duration-300"
            style={{ backgroundColor: bgColor, padding: '8px 0' }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                    barCategoryGap="30%"
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={gridStrokeColor}
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: axisTickColor, fontSize: 11 }}
                    />
                    {/* cursor prop only accepts fill/stroke — removed invalid 'radius' */}
                    <Tooltip
                        cursor={{ fill: cursorFill }}
                        content={<CustomTooltip />}
                    />
                    <Bar
                        dataKey="Intake"
                        name="Intake"
                        fill="#10b981"
                        radius={BAR_RADIUS}
                        barSize={14}
                        opacity={isDark ? 0.85 : 1}
                    />
                    <Bar
                        dataKey="Burn"
                        name="Burn"
                        fill="#f97316"
                        radius={BAR_RADIUS}
                        barSize={14}
                        opacity={isDark ? 0.85 : 1}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CaloriesChart;
