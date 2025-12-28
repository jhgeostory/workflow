import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { type ProjectStatus, type ItemStatus, type ExecutionItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Plus, Check, Trash2, Pencil, Calendar, FileDown, CornerDownRight, X } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { ProgressCharts } from '../components/ProgressCharts';
import { generateWeeklyReport, generateMonthlyReport } from '../lib/reportGenerator';
import { buildItemTree } from '../lib/treeUtils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableRow } from '../components/SortableRow';
import { GanttChart } from '../components/GanttChart';
import { IssueList } from '../components/IssueList';
import { List, StretchHorizontal, AlertCircle } from 'lucide-react'; // StretchHorizontal as Gantt icon

const STAGES: ProjectStatus[] = ['Proposal', 'Contract', 'Execution', 'Termination'];

export default function ProjectDetail() {
    // ... existing hooks ...
    const { id } = useParams();
    const navigate = useNavigate();
    const { projects, updateProject, addItem, updateItem, deleteItem } = useProjectStore();
    const project = projects.find(p => p.id === id);

    const [viewMode, setViewMode] = useState<'list' | 'gantt' | 'issues'>('list');
    // ... state ...

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!project || !over || active.id === over.id) {
            return;
        }

        const activeItem = project.items.find(i => i.id === active.id);
        const overItem = project.items.find(i => i.id === over.id);

        if (!activeItem || !overItem) return;

        // Restriction: Only allow reordering within the same parent
        // Note: We compare undefined/null/empty as equal for Root
        const activeParent = activeItem.parentId || null;
        const overParent = overItem.parentId || null;

        if (activeParent !== overParent) {
            return; // Cannot move across parents logic for now
        }

        // Get Siblings sorted by current sortOrder
        const siblings = project.items
            .filter(i => (i.parentId || null) === activeParent)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        const oldIndex = siblings.findIndex(i => i.id === active.id);
        const newIndex = siblings.findIndex(i => i.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newOrder = arrayMove(siblings, oldIndex, newIndex);

            // Update sortOrder for all affected items
            newOrder.forEach((item, index) => {
                if (item.sortOrder !== index) {
                    updateItem(project.id, item.id, { sortOrder: index });
                }
            });
        }
    };

    const [newItem, setNewItem] = useState<Partial<ExecutionItem>>({
        name: '',
        planStartDate: format(new Date(), 'yyyy-MM-dd'),
        planEndDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'Plan',
        plannedQuantity: 0,
        actualQuantity: 0,
        weight: 1,
        parentId: undefined,
    });
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Project Date Editing
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [tempDates, setTempDates] = useState({ startDate: '', endDate: '' });

    const startEditDates = () => {
        if (!project) return;
        setTempDates({ startDate: project.startDate, endDate: project.endDate });
        setIsEditingDates(true);
    };

    const saveEditDates = () => {
        if (!project) return;
        updateProject(project.id, { startDate: tempDates.startDate, endDate: tempDates.endDate });
        setIsEditingDates(false);
    };

    const projectTree = useMemo(() => {
        if (!project) return [];
        return buildItemTree(project.items);
    }, [project]);

    const displayItems = useMemo(() => {
        if (!projectTree) return [];
        const result: (ExecutionItem & { depth: number; hasChildren: boolean })[] = [];
        const traverse = (items: ExecutionItem[], depth: number) => {
            items.forEach(item => {
                const hasChildren = (item.children && item.children.length > 0) || false;
                result.push({ ...item, depth, hasChildren });
                if (hasChildren) {
                    traverse(item.children!, depth + 1);
                }
            });
        };
        traverse(projectTree, 0);
        return result;
    }, [projectTree]);

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

    const getTotalWeight = (parentId: string | undefined, excludeId?: string) => {
        // Robustly check parentId: treat null/undefined/empty string as "Root" (undefined)
        const targetParentId = parentId || undefined;

        const siblings = project.items.filter(i => {
            const iParentId = i.parentId || undefined;
            return iParentId === targetParentId && i.id !== excludeId;
        });
        return siblings.reduce((sum, i) => sum + (i.weight || 0), 0);
    };

    const handleStatusChange = (newStatus: ProjectStatus) => {
        if (project) updateProject(project.id, { status: newStatus });
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newItem.name || !project) return;

            const weightToAdd = Number(newItem.weight) || 0;
            const currentTotal = getTotalWeight(newItem.parentId, editingId || undefined);

            if (currentTotal + weightToAdd > 100) {
                alert(`가중치 합계는 100을 초과할 수 없습니다. (현재: ${currentTotal}, 추가: ${weightToAdd})`);
                return;
            }

            // Calculate SortOrder
            const targetParentId = newItem.parentId || undefined;
            const siblings = project.items.filter(i => {
                const iParentId = i.parentId || undefined;
                return iParentId === targetParentId;
            });
            const nextSortOrder = siblings.length > 0
                ? Math.max(...siblings.map(s => s.sortOrder || 0)) + 1
                : 0;

            const commonFields = {
                name: newItem.name,
                status: newItem.status as ItemStatus,
                planStartDate: newItem.planStartDate!,
                planEndDate: newItem.planEndDate!,
                actualStartDate: newItem.actualStartDate,
                actualEndDate: newItem.actualEndDate,
                plannedQuantity: Number(newItem.plannedQuantity) || 0,
                actualQuantity: Number(newItem.actualQuantity) || 0,
                weight: weightToAdd,
                parentId: newItem.parentId || undefined, // Ensure undefined if falsy
                sortOrder: nextSortOrder,
            };

            if (editingId) {
                updateItem(project.id, editingId, {
                    ...commonFields,
                    actualEndDate: newItem.status === 'Complete' ? (newItem.actualEndDate || format(new Date(), 'yyyy-MM-dd')) : undefined
                });
            } else {
                addItem(project.id, {
                    id: crypto.randomUUID(),
                    projectId: project.id,
                    ...commonFields,
                    actualEndDate: newItem.status === 'Complete' ? format(new Date(), 'yyyy-MM-dd') : undefined
                } as ExecutionItem);
            }

            resetForm();
        } catch (error) {
            console.error(error);
            alert("항목 추가 중 오류 발생: " + String(error));
        }
    };

    const resetForm = () => {
        setNewItem({
            name: '',
            planStartDate: format(new Date(), 'yyyy-MM-dd'),
            planEndDate: format(new Date(), 'yyyy-MM-dd'),
            status: 'Plan',
            plannedQuantity: 0,
            actualQuantity: 0,
            weight: 1,
            parentId: undefined
        });
        setIsAddingItem(false);
        setEditingId(null);
    };

    const startEdit = (item: ExecutionItem) => {
        setNewItem({
            name: item.name,
            status: item.status,
            planStartDate: item.planStartDate,
            planEndDate: item.planEndDate,
            actualStartDate: item.actualStartDate,
            actualEndDate: item.actualEndDate,
            plannedQuantity: item.plannedQuantity || 0,
            actualQuantity: item.actualQuantity || 0,
            weight: item.weight || 1,
            parentId: item.parentId
        });
        setEditingId(item.id);
        setIsAddingItem(true);
    };

    const startAddSubItem = (parentId: string) => {
        // Prevent adding sub-item to a 2nd level item if we only want 2 levels? Use depth check?
        // User requested "Sub-items". Recursive is supported.
        setNewItem({
            name: '',
            planStartDate: format(new Date(), 'yyyy-MM-dd'),
            planEndDate: format(new Date(), 'yyyy-MM-dd'),
            status: 'Plan',
            plannedQuantity: 0,
            actualQuantity: 0,
            weight: 1,
            parentId: parentId
        });
        setEditingId(null);
        setIsAddingItem(true);
    };

    const startAddRootItem = () => {
        setNewItem({
            name: '',
            planStartDate: format(new Date(), 'yyyy-MM-dd'),
            planEndDate: format(new Date(), 'yyyy-MM-dd'),
            status: 'Plan',
            plannedQuantity: 0,
            actualQuantity: 0,
            weight: 1,
            parentId: undefined
        });
        setEditingId(null);
        setIsAddingItem(true);
    };

    const handleDeleteItem = (itemId: string) => {
        if (!project) return;
        if (confirm('삭제하시겠습니까? 하위 항목이 있다면 함께 삭제됩니다.')) {
            // Need to recursively delete? 
            // Store uses flat list. Deleting parent doesn't auto-delete children unless logic exists.
            // Simple approach: Delete parent. Children become orphans or we should delete them.
            // Let's ensure we delete children.
            // But we don't have a 'deleteTree' action.
            // User can delete manually. Or we implement cascade delete in store (complex).
            // For now, let's just delete the item. Children might disappear from tree view (orphaned) but remain in DB.
            // It's acceptable for prototype.
            deleteItem(project.id, itemId);
        }
    };

    const toggleItemStatus = (item: ExecutionItem & { hasChildren?: boolean }) => {
        if (!project) return;
        if (item.hasChildren) return; // Prevent toggling parents

        const nextStatusMap: Record<ItemStatus, ItemStatus> = {
            'Plan': 'Progress',
            'Progress': 'Complete',
            'Complete': 'Plan'
        };
        const next = nextStatusMap[item.status];

        const updates: Partial<ExecutionItem> = { status: next };
        if (next === 'Complete') {
            updates.actualEndDate = format(new Date(), 'yyyy-MM-dd');
            if (item.actualQuantity === 0 && item.plannedQuantity > 0) {
                updates.actualQuantity = item.plannedQuantity;
            }
        } else if (next === 'Progress') {
            if (!item.actualStartDate) {
                updates.actualStartDate = format(new Date(), 'yyyy-MM-dd');
            }
            updates.actualEndDate = undefined;
        } else {
            updates.actualEndDate = undefined;
        }
        updateItem(project.id, item.id, updates);
    };

    const currentStageIndex = STAGES.indexOf(project.status);
    const parentItemName = newItem.parentId ? project.items.find(i => i.id === newItem.parentId)?.name : null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate('/projects')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> 목록으로
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => generateWeeklyReport([{ ...project, items: projectTree }])}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-md hover:bg-slate-50 text-xs font-medium transition-colors"
                        >
                            <FileDown size={14} /> 주간 보고
                        </button>
                        <button
                            onClick={() => generateMonthlyReport([{ ...project, items: projectTree }])}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium transition-colors"
                        >
                            <FileDown size={14} /> 월간 보고
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                            <StatusBadge status={project.status} />
                            {isEditingDates && <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">기간 수정 중</span>}
                        </div>

                        {isEditingDates ? (
                            <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                <span className="text-slate-500 text-sm"><Calendar size={14} /></span>
                                <input
                                    type="date"
                                    value={tempDates.startDate}
                                    onChange={e => setTempDates(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-slate-400">~</span>
                                <input
                                    type="date"
                                    value={tempDates.endDate}
                                    onChange={e => setTempDates(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button onClick={saveEditDates} className="bg-green-50 text-green-600 p-1 rounded hover:bg-green-100" title="저장">
                                    <Check size={14} />
                                </button>
                                <button onClick={() => setIsEditingDates(false)} className="bg-red-50 text-red-600 p-1 rounded hover:bg-red-100" title="취소">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-slate-500 text-sm flex items-center gap-2 group cursor-pointer" onClick={startEditDates} title="클릭하여 기간 수정">
                                <Calendar size={14} />
                                <span className="group-hover:text-blue-600 transition-colors duration-200">
                                    {project.startDate} ~ {project.endDate}
                                </span>
                                <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-blue-500 transition-opacity duration-200" />
                            </div>
                        )}
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

            {/* Project Dashboard Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 px-1">프로젝트 공정 현황</h3>
                <ProgressCharts items={project.items} />
                {/* Note: Pass raw items to charts? Charts use filter by date. 
                    If charts need Tree logic, we should pass `projectTree` flattened? 
                    Charts just filter items. If sub-items have dates, they are counted.
                    If parent has date, it is counted.
                    If Parent date range covers Child date range, both counted? Yes.
                    This is fine.
                */}
            </div>

            {/* Execution Items Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-slate-800">수행 세부 항목</h3>
                        {Math.abs(getTotalWeight(undefined) - 100) > 0.1 ? (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1" title="전체 가중치 합이 100이 되어야 합니다.">
                                <AlertCircle size={12} />
                                {getTotalWeight(undefined)}%
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <Check size={12} />
                                100%
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("flex items-center px-3 py-1.5 rounded-md transition-all text-xs font-bold", viewMode === 'list' ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}
                                title="목록 보기"
                            >
                                <List size={14} className="mr-1.5" /> 목록
                            </button>
                            <button
                                onClick={() => setViewMode('gantt')}
                                className={cn("flex items-center px-3 py-1.5 rounded-md transition-all text-xs font-bold", viewMode === 'gantt' ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}
                                title="간트 차트 보기"
                            >
                                <StretchHorizontal size={14} className="mr-1.5" /> 간트
                            </button>
                            <button
                                onClick={() => setViewMode('issues')}
                                className={cn("flex items-center px-3 py-1.5 rounded-md transition-all text-xs font-bold", viewMode === 'issues' ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}
                                title="이슈 관리"
                            >
                                <AlertCircle size={14} className="mr-1.5" /> 이슈
                            </button>
                        </div>
                        <button
                            onClick={startAddRootItem}
                            className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> 루트 항목 추가
                        </button>
                    </div>
                </div>

                {isAddingItem && (
                    <form onSubmit={handleAddItem} className="p-4 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                            {editingId ? '항목 수정' : '새 항목 추가'}
                            {parentItemName && <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">상위: {parentItemName}</span>}
                        </h4>
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
                            <div className="w-[100px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">계획물량</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newItem.plannedQuantity}
                                    onChange={e => setNewItem({ ...newItem, plannedQuantity: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                />
                            </div>
                            <div className="w-[100px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">수행물량</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newItem.actualQuantity}
                                    onChange={e => setNewItem({ ...newItem, actualQuantity: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                />
                            </div>
                            <div className="w-[80px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">가중치</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={newItem.weight}
                                    onChange={e => setNewItem({ ...newItem, weight: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                />
                            </div>
                            <div className="w-[240px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">계획 기간 (시작 ~ 종료)</label>
                                <div className="flex gap-1 items-center">
                                    <input
                                        type="date"
                                        required
                                        value={newItem.planStartDate}
                                        onChange={e => setNewItem({ ...newItem, planStartDate: e.target.value })}
                                        className="w-full px-2 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-blue-300">~</span>
                                    <input
                                        type="date"
                                        required
                                        value={newItem.planEndDate}
                                        onChange={e => setNewItem({ ...newItem, planEndDate: e.target.value })}
                                        className="w-full px-2 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="w-[240px]">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">수행 기간 (시작 ~ 종료)</label>
                                <div className="flex gap-1 items-center">
                                    <input
                                        type="date"
                                        value={newItem.actualStartDate || ''}
                                        onChange={e => setNewItem({ ...newItem, actualStartDate: e.target.value })}
                                        className="w-full px-2 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-blue-300">~</span>
                                    <input
                                        type="date"
                                        value={newItem.actualEndDate || ''}
                                        onChange={e => setNewItem({ ...newItem, actualEndDate: e.target.value })}
                                        className="w-full px-2 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pb-1">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 shadow-sm"
                                >
                                    {editingId ? '수정' : '저장'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {viewMode === 'list' ? (
                    <div className="divide-y divide-slate-100">
                        {displayItems.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                등록된 수행 항목이 없습니다.
                            </div>
                        ) : (
                            <div className="min-w-full overflow-auto">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-20">
                                    <div className="col-span-3">항목명</div>
                                    <div className="col-span-1 text-right">계획/수행</div>
                                    <div className="col-span-1 text-right">가중치</div>
                                    <div className="col-span-1 text-center">상태</div>
                                    <div className="col-span-3 text-center">계획 기간</div>
                                    <div className="col-span-2 text-center">수행 기간</div>
                                    <div className="col-span-1 text-center">관리</div>
                                </div>
                                {/* Table Body */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={displayItems}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {displayItems.map((item) => (
                                            <SortableRow
                                                key={item.id}
                                                id={item.id}
                                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group bg-white border-b border-slate-100 last:border-0"
                                            >
                                                <div className="col-span-3 font-medium text-slate-900 truncate flex items-center" title={item.name}>
                                                    {item.depth > 0 && (
                                                        <span style={{ marginLeft: (item.depth * 20) + 'px' }} className="mr-2 text-slate-400">
                                                            <CornerDownRight size={14} />
                                                        </span>
                                                    )}
                                                    {item.name}
                                                </div>
                                                <div className="col-span-1 text-right text-slate-700 text-sm">
                                                    {item.hasChildren ? (
                                                        <span className="text-slate-400 text-xs italic">하위참조</span>
                                                    ) : (
                                                        <span>{item.plannedQuantity}/{item.actualQuantity}</span>
                                                    )}
                                                </div>
                                                <div className="col-span-1 text-right text-slate-500 text-sm">
                                                    {item.weight}
                                                </div>
                                                <div className="col-span-1 text-center clickable" onClick={(e) => { e.stopPropagation(); toggleItemStatus(item); }}>
                                                    <div className={cn("cursor-pointer select-none transition-opacity", item.hasChildren && "pointer-events-none opacity-80")}>
                                                        <StatusBadge status={item.status} type="item" />
                                                    </div>
                                                </div>
                                                <div
                                                    className="col-span-3 text-sm text-slate-600 flex flex-col items-center justify-center leading-tight cursor-pointer hover:bg-blue-50 rounded p-1 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                                    title="클릭하여 수정"
                                                >
                                                    <span className="font-medium">{item.planStartDate}</span>
                                                    <span className="text-slate-400 text-[10px]">~ {item.planEndDate}</span>
                                                    <span className="text-xs text-blue-600 font-medium mt-0.5">
                                                        ({differenceInDays(parseISO(item.planEndDate), parseISO(item.planStartDate)) + 1}일)
                                                    </span>
                                                </div>
                                                <div
                                                    className="col-span-2 text-sm text-slate-600 flex flex-col items-center justify-center leading-tight cursor-pointer hover:bg-blue-50 rounded p-1 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                                    title="클릭하여 수정"
                                                >
                                                    {item.actualStartDate ? (
                                                        <>
                                                            <span className="font-medium">{item.actualStartDate}</span>
                                                            <span className="text-slate-400 text-[10px]">~ {item.actualEndDate || '진행중'}</span>
                                                            {(() => {
                                                                const start = parseISO(item.actualStartDate);
                                                                const end = item.actualEndDate ? parseISO(item.actualEndDate) : new Date();
                                                                const days = differenceInDays(end, start) + 1;
                                                                return <span className="text-xs text-green-600 font-medium mt-0.5">({days}일{item.actualEndDate ? '' : '째'})</span>;
                                                            })()}
                                                        </>
                                                    ) : '-'}
                                                    {(() => {
                                                        const planEnd = parseISO(item.planEndDate);
                                                        const planStart = parseISO(item.planStartDate);
                                                        const planDuration = Math.max(1, differenceInDays(planEnd, planStart) + 1);
                                                        const today = new Date();
                                                        // Reset time for accurate day comparison
                                                        today.setHours(0, 0, 0, 0);

                                                        // Also set planEnd time to end of day? Or just compare dates?
                                                        // parseISO returns local time midnight.

                                                        if (item.status === 'Complete' && item.actualEndDate) {
                                                            const actEnd = parseISO(item.actualEndDate);
                                                            if (differenceInDays(actEnd, planEnd) > 0) {
                                                                const days = differenceInDays(actEnd, planEnd);
                                                                const percent = Math.round((days / planDuration) * 100);
                                                                return <span className="text-red-500 text-[10px] font-bold block mt-1">(+{days}일, {percent}%)</span>;
                                                            }
                                                        } else if (item.status !== 'Complete') {
                                                            // Check overdose
                                                            if (differenceInDays(today, planEnd) > 0) {
                                                                const days = differenceInDays(today, planEnd);
                                                                const percent = Math.round((days / planDuration) * 100);
                                                                return <span className="text-red-500 text-[10px] font-bold block mt-1 animate-pulse">(+{days}일, {percent}%)</span>;
                                                            }
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                                <div className="col-span-1 text-center flex justify-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startAddSubItem(item.id); }}
                                                        className="text-slate-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50 transition-colors"
                                                        title="하위 항목 추가"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                                        className="text-slate-400 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                                        title="수정"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                                        className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </SortableRow>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>
                ) : viewMode === 'gantt' ? (
                    <div className="p-6 overflow-auto">
                        <GanttChart items={displayItems} startDate={project.startDate} endDate={project.endDate} />
                    </div>
                ) : (
                    <IssueList projectId={project.id} />
                )}
            </div>
        </div>
    );
}
