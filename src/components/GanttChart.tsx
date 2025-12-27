import { useMemo } from 'react';
import { differenceInDays, addDays, format, parseISO, isValid } from 'date-fns';
import { type ExecutionItem } from '../types';

interface GanttChartProps {
    items: (ExecutionItem & { depth: number })[];
    startDate: string;
    endDate: string;
}

export function GanttChart({ items, startDate, endDate }: GanttChartProps) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const totalDays = differenceInDays(end, start) + 1;

    // Config
    const headerHeight = 40;
    const rowHeight = 40;
    const colWidth = 30; // 1 day width
    const chartWidth = Math.max(800, totalDays * colWidth);
    const chartHeight = headerHeight + (items.length * rowHeight);

    const dates = useMemo(() => {
        const result = [];
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
        return diff * colWidth;
    };

    return (
        <div className="overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm">
            <div style={{ width: chartWidth, height: chartHeight, position: 'relative' }}>
                {/* Grid Background */}
                <div className="absolute inset-0 flex">
                    {dates.map((d, i) => (
                        <div key={i} className="border-r border-slate-100 h-full box-border flex flex-col items-center justify-start pt-2 text-[10px] text-slate-400" style={{ width: colWidth }}>
                            {format(d, 'd')}
                        </div>
                    ))}
                </div>

                {/* Header Month Labels (Optional overlay or just rely on grid?) */}
                {/* For simplicity, just grid days above. Maybe format months later. */}

                {/* Items */}
                <div style={{ paddingTop: headerHeight, position: 'relative' }}>
                    {items.map((item, index) => {
                        const itemStart = item.startDate || item.planDate;
                        const itemEnd = item.planDate;

                        const x = getX(itemStart);
                        const width = Math.max(colWidth, getX(itemEnd) - x + colWidth); // include end date



                        return (
                            <div key={item.id} className="absolute h-6 rounded-md shadow-sm border border-white/50 text-xs text-white px-2 flex items-center overflow-hidden whitespace-nowrap"
                                style={{
                                    top: (index * rowHeight) + ((rowHeight - 24) / 2),
                                    left: x,
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
    );
}
