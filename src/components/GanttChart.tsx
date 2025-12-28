import { useMemo, useState } from 'react';
import { differenceInDays, addDays, format, parseISO, isValid } from 'date-fns';
import { type ExecutionItem } from '../types';

interface GanttChartProps {
    items: (ExecutionItem & { depth: number })[];
    startDate: string;
    endDate: string;
}

export function GanttChart({ items, startDate, endDate }: GanttChartProps) {
    const [viewMode, setViewMode] = useState<'default' | 'fit'>('default');
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const totalDays = Math.max(1, differenceInDays(end, start) + 1);

    // Config
    const headerHeight = 60;
    const rowHeight = 40;

    // Calculations

    // Calculations
    const isFit = viewMode === 'fit';
    // If Fit: 100% width. If Default: Fixed px width.
    const chartWidth = isFit ? '100%' : Math.max(100, totalDays * 30); // 30px per day default
    const chartHeight = headerHeight + (items.length * rowHeight);

    const dates = useMemo(() => {
        const result = [];
        for (let i = 0; i < totalDays; i++) {
            result.push(addDays(start, i));
        }
        return result;
    }, [start, totalDays]);

    const months = useMemo(() => {
        const result = [];
        if (totalDays === 0) return [];

        let currentMonth = format(start, 'yyyy-MM');
        let startIdx = 0;

        for (let i = 0; i < totalDays; i++) {
            const d = addDays(start, i);
            const mLabel = format(d, 'yyyy-MM');
            if (mLabel !== currentMonth) {
                result.push({ label: currentMonth, startIdx, duration: i - startIdx });
                currentMonth = mLabel;
                startIdx = i;
            }
        }
        // Last month
        result.push({ label: currentMonth, startIdx, duration: totalDays - startIdx });
        return result;
    }, [start, totalDays]);

    const getX = (dateStr: string) => {
        if (!dateStr) return 0;
        const d = parseISO(dateStr);
        if (!isValid(d)) return 0;
        const diff = differenceInDays(d, start);
        return isFit ? `${(diff / totalDays) * 100}%` : diff * 30;
    };

    const getWidth = (startStr: string, endStr: string) => {
        if (!startStr || !endStr) return 0;
        const s = parseISO(startStr);
        const e = parseISO(endStr);
        if (!isValid(s) || !isValid(e)) return 0;

        const diff = differenceInDays(e, s) + 1; // Include end day
        // ensure at least some width
        if (diff <= 0) return 0;

        return isFit ? `${(diff / totalDays) * 100}%` : diff * 30;
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end gap-2">
                <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                    <button
                        onClick={() => setViewMode('default')}
                        className={`px-3 py-1.5 rounded-md transition-all ${!isFit ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        기본 (스크롤)
                    </button>
                    <button
                        onClick={() => setViewMode('fit')}
                        className={`px-3 py-1.5 rounded-md transition-all ${isFit ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        화면 맞춤
                    </button>
                </div>
            </div>

            <div className="overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                <div style={{ width: chartWidth, height: chartHeight, position: 'relative' }}>
                    {/* Grid Background & Headers */}
                    <div className="absolute inset-0">
                        {/* Month Header Row (Top 0-25px) */}
                        <div className="absolute top-0 left-0 right-0 h-[25px] border-b border-slate-200 bg-slate-50">
                            {months.map((m, i) => {
                                const left = isFit ? `${(m.startIdx / totalDays) * 100}%` : m.startIdx * 30;
                                const width = isFit ? `${(m.duration / totalDays) * 100}%` : m.duration * 30;
                                return (
                                    <div key={i} className="absolute top-0 h-full border-r border-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600 truncate px-1"
                                        style={{ left, width }}
                                        title={m.label}
                                    >
                                        {m.label}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day Grid & Labels (Top 25px - Bottom) */}
                        <div className="absolute top-[25px] bottom-0 left-0 right-0">
                            {dates.map((d, i) => {
                                const left = isFit ? `${(i / totalDays) * 100}%` : i * 30;
                                const width = isFit ? `${(1 / totalDays) * 100}%` : 30;
                                // Hide day labels if too small in Fit mode
                                const showLabel = !isFit || totalDays < 40 || (totalDays < 80 && i % 2 === 0) || i % 5 === 0;

                                return (
                                    <div key={i}
                                        className="absolute top-0 bottom-0 border-r border-slate-100 box-border flex flex-col items-center justify-start pt-1 text-[10px] text-slate-400"
                                        style={{ left: left, width: width }}
                                    >
                                        {showLabel && format(d, 'd')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Items */}
                    <div style={{ paddingTop: headerHeight, position: 'relative' }}>
                        {items.map((item, index) => {
                            const itemStart = item.planStartDate;
                            const itemEnd = item.planEndDate;

                            const left = getX(itemStart);
                            const width = getWidth(itemStart, itemEnd);

                            return (
                                <div key={item.id} className="absolute h-6 rounded-md shadow-sm border border-white/50 text-xs text-white px-2 flex items-center overflow-hidden whitespace-nowrap"
                                    style={{
                                        top: (index * rowHeight) + ((rowHeight - 24) / 2),
                                        left: left,
                                        width: width,
                                        backgroundColor: item.status === 'Progress' ? '#4ade80' : item.status === 'Complete' ? '#94a3b8' : '#60a5fa'
                                    }}
                                    title={`${item.name} (${itemStart} ~ ${itemEnd})`}
                                >
                                    {item.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
