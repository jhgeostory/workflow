import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Issue, IssueStatus } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
    projectId: string;
    issues: Issue[];
}

const COLUMNS: { id: IssueStatus; title: string }[] = [
    { id: 'Open', title: '할 일 (Open)' },
    { id: 'InProgress', title: '진행 중 (In Progress)' },
    { id: 'Resolved', title: '완료 (Resolved)' },
];

function SortableItem({ issue }: { issue: Issue }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: issue.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded shadow-sm border border-slate-200 mb-2 cursor-grab active:cursor-grabbing hover:border-blue-300"
        >
            <div className="font-medium text-sm text-slate-800">{issue.title}</div>
            <div className="flex justify-between items-center mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${issue.priority === 'High' || issue.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                    issue.priority === 'Medium' ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                    }`}>
                    {issue.priority}
                </span>
                <span className="text-xs text-slate-400">
                    {new Date(issue.createdAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}

export function IssueKanban({ projectId, issues }: Props) {
    const { updateIssue } = useProjectStore();
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeIssue = issues.find(i => i.id === active.id);
        if (!activeIssue) return;

        // Determine Drop Target
        // If over a Container(Column), status changes.
        // If over an Item, status changes to that item's status.

        let newStatus: IssueStatus | undefined;

        if (COLUMNS.find(c => c.id === over.id)) {
            newStatus = over.id as IssueStatus;
        } else {
            const overIssue = issues.find(i => i.id === over.id);
            if (overIssue) {
                newStatus = overIssue.status;
            }
        }

        if (newStatus && newStatus !== activeIssue.status) {
            updateIssue(projectId, activeIssue.id, { status: newStatus });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                {COLUMNS.map(col => (
                    <div key={col.id} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
                        <div className="p-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                            {col.title}
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                {issues.filter(i => i.status === col.id).length}
                            </span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto">
                            <SortableContext
                                id={col.id}
                                items={issues.filter(i => i.status === col.id).map(i => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {/* Actually, SortableContext needs a parent with useDroppable if we want the container itself to be a drop target when empty */}
                                <ColumnDroppable id={col.id}>
                                    {issues.filter(i => i.status === col.id).map(issue => (
                                        <SortableItem key={issue.id} issue={issue} />
                                    ))}
                                </ColumnDroppable>
                            </SortableContext>
                        </div>
                    </div>
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="bg-white p-3 rounded shadow-lg border border-blue-500 opacity-80 cursor-grabbing w-[300px]">
                        <div className="font-medium text-sm text-slate-800">Moving...</div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

import { useDroppable } from '@dnd-kit/core';

function ColumnDroppable({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className="min-h-[100px]">
            {children}
        </div>
    );
}
