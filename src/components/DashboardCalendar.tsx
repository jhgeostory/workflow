import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function DashboardCalendar() {
    const navigate = useNavigate();
    const { projects } = useProjectStore();
    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentDate]);

    const getDayStatus = (date: Date) => {
        let count = 0;
        let hasIssue = false;
        projects.forEach(p => {
            p.items.forEach(i => {
                if (i.planStartDate && i.planEndDate) {
                    const start = parseISO(i.planStartDate);
                    const end = parseISO(i.planEndDate);
                    if (isWithinInterval(date, { start, end })) count++;
                }
            });
            if (p.issues) {
                p.issues.forEach(i => {
                    if (isSameDay(parseISO(i.createdAt), date)) hasIssue = true;
                });
            }
        });
        return { count, hasIssue };
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/schedule')}>
                    <CalendarIcon size={18} />
                    {format(currentDate, 'yyyy.MM')}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={16} /></button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2 text-center text-[10px] text-slate-400 font-medium">
                {weekDays.map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1">
                {calendarDays.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const { count, hasIssue } = getDayStatus(day);

                    return (
                        <div
                            key={i}
                            onClick={() => navigate('/schedule')}
                            className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer relative hover:bg-slate-50 transition-colors",
                                !isCurrentMonth && "opacity-30"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                isToday ? "bg-red-500 text-white" : "text-slate-700"
                            )}>
                                {format(day, 'd')}
                            </span>
                            <div className="flex gap-0.5 mt-0.5 h-1.5">
                                {count > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                {hasIssue && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-2 text-center">
                <button onClick={() => navigate('/schedule')} className="text-xs text-blue-600 font-medium hover:underline">
                    전체 일정 보기
                </button>
            </div>
        </div>
    );
}
