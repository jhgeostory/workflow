import { useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { ProgressCharts } from '../components/ProgressCharts';
import { generateWeeklyReport, generateMonthlyReport } from '../lib/reportGenerator';
import { FileDown, Layout, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { buildItemTree } from '../lib/treeUtils';

export default function Dashboard() {
    const { projects } = useProjectStore();

    const projectsWithTree = useMemo(() => {
        return projects.map(p => ({
            ...p,
            items: buildItemTree(p.items)
        }));
    }, [projects]);

    const projectStatusCounts = useMemo(() => {
        return projects.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [projects]);

    const allItems = useMemo(() => projects.flatMap(p => p.items), [projects]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">대시보드</h2>
                    <p className="text-slate-500">프로젝트 현황 및 주간/월간 공정률 리포트</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => generateWeeklyReport(projectsWithTree)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm text-sm font-medium transition-colors"
                    >
                        <FileDown size={16} /> 주간 보고서
                    </button>
                    <button
                        onClick={() => generateMonthlyReport(projectsWithTree)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm font-medium transition-colors"
                    >
                        <FileDown size={16} /> 월간 보고서
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Layout size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">총 프로젝트</div>
                        <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">진행중</div>
                        <div className="text-2xl font-bold text-slate-900">{projectStatusCounts['Execution'] || 0}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">제안/계약</div>
                        <div className="text-2xl font-bold text-slate-900">
                            {(projectStatusCounts['Proposal'] || 0) + (projectStatusCounts['Contract'] || 0)}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">총 수행 항목</div>
                        <div className="text-2xl font-bold text-slate-900">{allItems.length}</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 px-1">전체 프로젝트 통합 공정률</h3>
                <ProgressCharts items={projectsWithTree.flatMap(p => p.items)} />
            </div>
        </div>
    );
}
