import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { cn } from '../lib/utils';

export default function Schedule() {
    const navigate = useNavigate();
    const { projects } = useProjectStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Calendar Data
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentDate]);

    // Filter Items for Selected Date
    const selectedDateItems = useMemo(() => {
        const items: any[] = [];
        projects.forEach(p => {
            p.items.forEach(i => {
                // Check if selectedDate is within [planStart, planEnd] or [actualStart, actualEnd]
                // Or simply if plan overlaps?
                // User wants "Scheduled" items.

                let isScheduled = false;
                if (i.planStartDate && i.planEndDate) {
                    const start = parseISO(i.planStartDate);
                    const end = parseISO(i.planEndDate);
                    if (isWithinInterval(selectedDate, { start, end })) isScheduled = true;
                }

                // Also check actual?
                if (!isScheduled && i.actualStartDate) {
                    const start = parseISO(i.actualStartDate);
                    const end = i.actualEndDate ? parseISO(i.actualEndDate) : new Date(); // If running, assume today is end? Or infinite?
                    // If complete, actualEndDate is set. If progress, actualEndDate undefined.
                    if (isWithinInterval(selectedDate, { start, end })) isScheduled = true;
                }

                if (isScheduled) {
                    items.push({ ...i, projectName: p.name, projectId: p.id });
                }
            });
        });
        return items;
    }, [projects, selectedDate]);

    // Filter Issues for Selected Date (Created or Updated?)
    const selectedDateIssues = useMemo(() => {
        const issues: any[] = [];
        projects.forEach(p => {
            if (p.issues) {
                p.issues.forEach(i => {
                    const created = parseISO(i.createdAt);
                    if (isSameDay(created, selectedDate)) {
                        issues.push({ ...i, projectName: p.name, projectId: p.id });
                    }
                });
            }
        });
        return issues;
    }, [projects, selectedDate]);

    // Get Dot Indicators for a Day
    const getDayStatus = (date: Date) => {
        // Just return count of items/issues
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
    const goToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* Left: Calendar */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon size={20} className="text-blue-600" />
                        {format(currentDate, 'yyyy년 M월')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={goToday} className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200">오늘</button>
                        <div className="flex items-center bg-slate-100 rounded-md">
                            <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded-l-md text-slate-600"><ChevronLeft size={16} /></button>
                            <div className="w-px h-4 bg-slate-300"></div>
                            <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded-r-md text-slate-600"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                {/* Grid Header */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                    {weekDays.map((day, i) => (
                        <div key={day} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                    {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());
                        const { count, hasIssue } = getDayStatus(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "border-b border-r border-slate-100 p-2 flex flex-col items-start cursor-pointer transition-colors relative",
                                    !isCurrentMonth && "bg-slate-50/50 text-slate-300",
                                    isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50/30 z-10",
                                    "hover:bg-slate-50"
                                )}
                            >
                                <span className={cn(
                                    "text-sm w-6 h-6 flex items-center justify-center rounded-full font-medium",
                                    isToday ? "bg-red-500 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                <div className="mt-2 flex gap-1 flex-wrap content-start w-full">
                                    {count > 0 && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" title={`${count} tasks`} />
                                    )}
                                    {hasIssue && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-400" title="Issue" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Detail List */}
            <div className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-2xl">{format(selectedDate, 'd')}</span>
                        <div className="flex flex-col leading-none">
                            <span className="text-xs text-slate-500">{format(selectedDate, 'yyyy.MM')}</span>
                            <span className="text-sm font-medium">{format(selectedDate, 'EEEE', { locale: ko })}</span>
                        </div>
                    </h3>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Issues */}
                    {selectedDateIssues.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                <AlertCircle size={12} className="text-red-500" /> 이슈 ({selectedDateIssues.length})
                            </h4>
                            <div className="space-y-2">
                                {selectedDateIssues.map(issue => (
                                    <div key={issue.id} onClick={() => navigate(`/projects/${issue.projectId}`)} className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                                        <div className="text-xs text-red-600 font-bold mb-1">{issue.projectName}</div>
                                        <div className="text-sm font-medium text-slate-800">{issue.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">{issue.status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                            <CheckCircle size={12} className="text-blue-500" /> 진행 업무 ({selectedDateItems.length})
                        </h4>
                        {selectedDateItems.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                예정된 업무가 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedDateItems.map((item, idx) => (
                                    <div key={idx} onClick={() => navigate(`/projects/${item.projectId}`)} className="p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-xs text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{item.projectName}</div>
                                            <StatusBadge status={item.status} type="item" />
                                        </div>
                                        <div className="text-sm font-medium text-slate-800 mb-1 group-hover:text-blue-600">{item.name}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {item.planStartDate} ~ {item.planEndDate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
