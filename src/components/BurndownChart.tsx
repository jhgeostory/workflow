import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { differenceInDays, addDays, format, isAfter, parseISO } from 'date-fns';
import type { ExecutionItem } from '../types';

interface UserBurndownProps {
    items: ExecutionItem[];
    startDate: string;
    endDate: string;
}

export function BurndownChart({ items, startDate, endDate }: UserBurndownProps) {
    const data = useMemo(() => {
        if (!startDate || !endDate || items.length === 0) return [];

        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const totalDuration = differenceInDays(end, start);
        const totalWeight = items.reduce((acc, i) => acc + (i.weight || 0), 0);

        // Ideal Line Slope: totalWeight / totalDuration
        const dailyBurnRate = totalWeight / Math.max(1, totalDuration);

        // Generate data points for each day
        const chartData = [];
        const today = new Date();

        for (let i = 0; i <= totalDuration + 5; i++) { // +5 buffer
            const date = addDays(start, i);

            // Ideal Remaining
            // Linear calculation
            let idealRemaining = totalWeight - (dailyBurnRate * i);
            if (idealRemaining < 0) idealRemaining = 0;

            // Actual Remaining
            // Find items completed on or before this date
            // Completed means status='Complete' AND actualEndDate <= date

            // Optimization: Calculate completed weight up to this date
            // But doing this every loop is O(N^2).
            // Better: Pre-sort items by actualEndDate?
            // Simple approach for now. 

            const completedWeight = items.reduce((sum, item) => {
                if (item.status === 'Complete' && item.actualEndDate) {
                    if (!isAfter(parseISO(item.actualEndDate), date)) {
                        return sum + (item.weight || 0);
                    }
                }
                return sum;
            }, 0);

            const actualRemaining = totalWeight - completedWeight;

            // Only show Actual up to Today
            const isFuture = isAfter(date, today);

            chartData.push({
                date: format(date, 'MM/dd'),
                ideal: Number(idealRemaining.toFixed(1)),
                actual: isFuture ? null : Number(actualRemaining.toFixed(1)),
            });
        }
        return chartData;
    }, [items, startDate, endDate]);

    if (items.length === 0) return <div className="p-4 text-center text-slate-400">데이터가 없습니다.</div>;

    return (
        <div className="w-full h-[300px] bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4">번다운 차트 (Burndown Chart)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="ideal"
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        name="계획(Ideal)"
                        dot={false}
                        strokeWidth={2}
                    />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#3b82f6"
                        name="실적(Actual)"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
