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
    const headerHeight = 40;
    const rowHeight = 40;

    // Calculations
    const isFit = viewMode === 'fit';
    // If Fit: 100% width. If Default: Fixed px width.
    const chartWidth = isFit ? '100%' : Math.max(100, totalDays * 30); // 30px per day default
    const chartHeight = headerHeight + (items.length * rowHeight);

    const dates = useMemo(() => {
        const result = [];
        // Only generate dates if not too many? In Fit mode, maybe skip rendering grid lines for every day if too crowded?
        // For now render all.
        for (let i = 0; i < totalDays; i++) {
            result.push(addDays(start, i));
        }
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
                    {/* Grid Background */}
                    <div className="absolute inset-0 flex">
                        {dates.map((d, i) => {
                            // In Fit mode, if simple day grid is too dense, maybe hide some?
                            // For prototype, just render.
                            const left = isFit ? `${(i / totalDays) * 100}%` : i * 30;
                            const width = isFit ? `${(1 / totalDays) * 100}%` : 30;

                            return (
                                <div key={i}
                                    className="absolute top-0 bottom-0 border-r border-slate-100 box-border flex flex-col items-center justify-start pt-2 text-[10px] text-slate-400 truncate"
                                    style={{ left: left, width: width }}
                                >
                                    {(!isFit || totalDays < 60 || i % 5 === 0) && format(d, 'd')}
                                </div>
                            );
                        })}
                    </div>

                    {/* Header Month Labels could go here overlaying grid */}

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
