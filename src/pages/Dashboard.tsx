import { useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import {
    startOfWeek, endOfWeek, subWeeks, format,
    startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO
} from 'date-fns';

export default function Dashboard() {
    const { projects } = useProjectStore();

    const projectStatusCounts = useMemo(() => {
        return projects.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [projects]);

    // --- Weekly Progress (Last 4 Weeks) ---
    const weeklyData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 3; i >= 0; i--) {
            const date = subWeeks(today, i);
            const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            const weekLabel = `${format(weekStart, 'MM/dd')}~${format(weekEnd, 'MM/dd')}`;

            // Aggregate all items from all projects
            let planned = 0;
            let completed = 0;

            projects.forEach(p => {
                p.items.forEach(item => {
                    // Plan Count: Items planned for this week
                    if (item.planDate && isWithinInterval(parseISO(item.planDate), { start: weekStart, end: weekEnd })) {
                        planned++;
                    }
                    // Completed Count: Items completed this week
                    if (item.completionDate && isWithinInterval(parseISO(item.completionDate), { start: weekStart, end: weekEnd })) {
                        completed++;
                    }
                });
            });

            const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0;
            data.push({ name: weekLabel, 계획: planned, 완료: completed, 공정률: rate });
        }
        return data;
    }, [projects]);

    // --- Monthly Progress (Last 6 Months) ---
    const monthlyData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthLabel = format(date, 'yyyy-MM');

            let planned = 0;
            let completed = 0;

            projects.forEach(p => {
                p.items.forEach(item => {
                    if (item.planDate && isWithinInterval(parseISO(item.planDate), { start: monthStart, end: monthEnd })) {
                        planned++;
                    }
                    if (item.completionDate && isWithinInterval(parseISO(item.completionDate), { start: monthStart, end: monthEnd })) {
                        completed++;
                    }
                });
            });

            const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0;
            data.push({ name: monthLabel, 계획: planned, 완료: completed, 공정률: rate });
        }
        return data;
    }, [projects]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">대시보드</h2>
                <p className="text-slate-500">프로젝트 현황 및 주간/월간 공정률 리포트</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '전체 프로젝트', value: projects.length, color: 'bg-slate-100 text-slate-700' },
                    { label: '수행', value: projectStatusCounts['Execution'] || 0, color: 'bg-green-100 text-green-700' },
                    { label: '제안', value: projectStatusCounts['Proposal'] || 0, color: 'bg-blue-100 text-blue-700' },
                    { label: '종료', value: projectStatusCounts['Termination'] || 0, color: 'bg-gray-100 text-gray-500' },
                ].map((stat) => (
                    <div key={stat.label} className={`p-6 rounded-xl border border-transparent ${stat.color} bg-opacity-50`}>
                        <div className="text-sm font-medium opacity-80">{stat.label}</div>
                        <div className="text-3xl font-bold mt-1">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
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
        </div>
    );
}
