import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import {
    startOfWeek, endOfWeek, subWeeks, format,
    startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO
} from 'date-fns';
import { calculateProgress } from '../lib/progress';
import type { ExecutionItem } from '../types';

interface ProgressChartsProps {
    items: ExecutionItem[];
}

export function ProgressCharts({ items }: ProgressChartsProps) {
    // --- Weekly Progress (Last 4 Weeks) ---
    const weeklyData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 3; i >= 0; i--) {
            const date = subWeeks(today, i);
            const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            const weekLabel = `${format(weekStart, 'MM/dd')}~${format(weekEnd, 'MM/dd')}`;

            // Filter items relevant to this week
            const weekItems = items.filter(item =>
                item.planDate && isWithinInterval(parseISO(item.planDate), { start: weekStart, end: weekEnd })
            );

            const rate = calculateProgress(weekItems);

            let plannedCount = 0;
            let completedCount = 0;
            weekItems.forEach(item => {
                plannedCount++;
                if (item.status === 'Complete') completedCount++;
            });

            data.push({ name: weekLabel, 계획: plannedCount, 완료: completedCount, 공정률: rate });
        }
        return data;
    }, [items]);

    // --- Monthly Progress (Last 6 Months) ---
    const monthlyData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthLabel = format(date, 'yyyy-MM');

            const monthItems = items.filter(item =>
                item.planDate && isWithinInterval(parseISO(item.planDate), { start: monthStart, end: monthEnd })
            );

            const rate = calculateProgress(monthItems);

            let plannedCount = 0;
            let completedCount = 0;
            monthItems.forEach(item => {
                plannedCount++;
                if (item.status === 'Complete') completedCount++;
            });

            data.push({ name: monthLabel, 계획: plannedCount, 완료: completedCount, 공정률: rate });
        }
        return data;
    }, [items]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">주간 공정 (계획 vs 완료)</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                            <YAxis />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="계획" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="완료" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">월간 공정률 흐름 (%)</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                            <YAxis unit="%" domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="공정률" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
