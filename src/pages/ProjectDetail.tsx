import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { type ProjectStatus, type ItemStatus, type ExecutionItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Plus, Check, MoreVertical, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const STAGES: ProjectStatus[] = ['Proposal', 'Contract', 'Execution', 'Termination'];

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { projects, updateProject, addItem, updateItem, deleteItem } = useProjectStore();
    const project = projects.find(p => p.id === id);

    const [newItem, setNewItem] = useState<Partial<ExecutionItem>>({
        name: '',
        planDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'Plan',
    });
    const [isAddingItem, setIsAddingItem] = useState(false);

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold text-slate-900">프로젝트를 찾을 수 없습니다.</h2>
                <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline mt-2">
                    목록으로 돌아가기
                </button>
            </div>
        );
    }

    const handleStatusChange = (newStatus: ProjectStatus) => {
        updateProject(project.id, { status: newStatus });
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name) return;

        addItem(project.id, {
            id: crypto.randomUUID(),
            projectId: project.id,
            name: newItem.name,
            status: newItem.status as ItemStatus,
            planDate: newItem.planDate!,
            completionDate: newItem.status === 'Complete' ? format(new Date(), 'yyyy-MM-dd') : undefined
        } as ExecutionItem);

        setNewItem({
            name: '',
            planDate: format(new Date(), 'yyyy-MM-dd'),
            status: 'Plan',
        });
        setIsAddingItem(false);
    };

    const toggleItemStatus = (item: ExecutionItem) => {
        const nextStatusMap: Record<ItemStatus, ItemStatus> = {
            'Plan': 'Progress',
            'Progress': 'Complete',
            'Complete': 'Plan' // Cycle back or stay? Let's cycle for simplicity or just Plan->Progress->Complete
        };

        // Logic: Plan -> Progress -> Complete -> (stay complete or manual reset?)
        // Let's make it cyclical for easy toggling or specific logic
        let next = nextStatusMap[item.status];

        const updates: Partial<ExecutionItem> = { status: next };
        if (next === 'Complete') {
            updates.completionDate = format(new Date(), 'yyyy-MM-dd');
        } else {
            updates.completionDate = undefined;
        }

        updateItem(project.id, item.id, updates);
    };

    const currentStageIndex = STAGES.indexOf(project.status);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => navigate('/projects')} className="flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> 목록으로
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                            <StatusBadge status={project.status} />
                        </div>
                        <div className="text-slate-500 text-sm flex items-center gap-2">
                            <Calendar size={14} />
                            {project.startDate} ~ {project.endDate}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={project.status}
                            onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {STAGES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lifecycle Stepper */}
                <div className="mt-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                    <div className="absolute top-1/2 left-0 h-0.5 bg-blue-100 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }} />

                    <div className="relative z-10 flex justify-between">
                        {STAGES.map((stage, idx) => {
                            const isCompleted = idx <= currentStageIndex;
                            const isCurrent = idx === currentStageIndex;

                            return (
                                <div key={stage} className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                                        isCompleted ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-300",
                                        isCurrent && "ring-4 ring-blue-100"
                                    )}>
                                        {idx < currentStageIndex ? <Check size={14} /> : <span>{idx + 1}</span>}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium uppercase tracking-wider",
                                        isCompleted ? "text-blue-700" : "text-slate-400"
                                    )}>
                                        {stage}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Execution Items Area - Only specific if needed, but requirements said "Management by Project > Execution > Items" 
          Implementation: Always visible but conceptually for "Execution" phase. 
          We will allow adding items in any phase for planning, but emphasize it in Execution.
      */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">수행 세부 항목</h3>
                    <button
                        onClick={() => setIsAddingItem(true)}
                        className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> 항목 추가
                    </button>
                </div>

                {isAddingItem && (
                    <form onSubmit={handleAddItem} className="p-4 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-2">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">항목명</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="할 일을 입력하세요"
                                />
                            </div>
                            <div className="w-[150px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">계획일</label>
                                <input
                                    type="date"
                                    required
                                    value={newItem.planDate}
                                    onChange={e => setNewItem({ ...newItem, planDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 pb-1">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 shadow-sm"
                                >
                                    저장
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingItem(false)}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="divide-y divide-slate-100">
                    {project.items.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            등록된 수행 항목이 없습니다.
                        </div>
                    ) : (
                        <div className="min-w-full overflow-auto">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <div className="col-span-5">항목명</div>
                                <div className="col-span-2 text-center">상태</div>
                                <div className="col-span-2">계획일</div>
                                <div className="col-span-2">완료일</div>
                                <div className="col-span-1 text-center">관리</div>
                            </div>
                            {/* Table Body */}
                            {project.items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                                    <div className="col-span-5 font-medium text-slate-900 truncate" title={item.name}>
                                        {item.name}
                                    </div>
                                    <div className="col-span-2 text-center clickable" onClick={() => toggleItemStatus(item)}>
                                        <div className="cursor-pointer select-none hover:opacity-80 transition-opacity">
                                            <StatusBadge status={item.status} type="item" />
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-sm text-slate-600">
                                        {item.planDate}
                                    </div>
                                    <div className="col-span-2 text-sm text-slate-600">
                                        {item.completionDate || '-'}
                                    </div>
                                    <div className="col-span-1 text-center flex justify-center">
                                        <button
                                            onClick={() => deleteItem(project.id, item.id)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <MoreVertical size={16} className="rotate-90" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
